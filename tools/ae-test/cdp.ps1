param([string]$JsFile, [string]$Expr, [int]$Port = 8099, [int]$Timeout = 120)
$targets = Invoke-RestMethod "http://localhost:$Port/json"
$ws = ($targets | Where-Object { $_.title -eq "Ultimate Kit" } | Select-Object -First 1).webSocketDebuggerUrl
if (-not $ws) { "no target"; exit 1 }
if ($JsFile) { $Expr = Get-Content $JsFile -Raw }
$c = New-Object System.Net.WebSockets.ClientWebSocket
$ct = [Threading.CancellationToken]::None
$c.ConnectAsync([Uri]$ws, $ct).Wait()
$msg = @{ id = 1; method = "Runtime.evaluate"; params = @{ expression = $Expr; awaitPromise = $true; returnByValue = $true; timeout = ($Timeout * 1000) } } | ConvertTo-Json -Depth 5 -Compress
$bytes = [Text.Encoding]::UTF8.GetBytes($msg)
$c.SendAsync([ArraySegment[byte]]$bytes, [Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait()
$buf = New-Object byte[] 1048576
$sb = New-Object Text.StringBuilder
$deadline = (Get-Date).AddSeconds($Timeout)
while ((Get-Date) -lt $deadline) {
    $t = $c.ReceiveAsync([ArraySegment[byte]]$buf, $ct)
    if (-not $t.Wait(($deadline - (Get-Date)).TotalMilliseconds)) { break }
    $r = $t.Result
    [void]$sb.Append([Text.Encoding]::UTF8.GetString($buf, 0, $r.Count))
    if ($r.EndOfMessage) {
        $j = $sb.ToString() | ConvertFrom-Json
        if ($j.id -eq 1) {
            if ($j.result.exceptionDetails) { "EXCEPTION: " + ($j.result.exceptionDetails | ConvertTo-Json -Depth 6 -Compress) }
            else { $v = $j.result.result.value; if ($v -is [string]) { $v } else { $v | ConvertTo-Json -Depth 8 } }
            break
        }
        [void]$sb.Clear()
    }
}
$c.Dispose()
