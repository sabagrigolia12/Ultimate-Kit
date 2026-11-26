# Tiny local helper server for the SaaS-BG mesh lab (tools/ae-test/lab):
#   GET  /lab/<file>  -> tools/ae-test/lab/<file>        GET /uk/<path> -> UltimateKit/<path>
#   POST /<name>      -> saves the body to tools/ae-test/out/sink/<name>
#   GET  /v/<path>    -> the Envato preview video of that pack, same origin so canvas pixels stay readable
param([int]$Port = 8766)
$Dir = Join-Path $PSScriptRoot "ae-test\out\sink"
$Lab = Join-Path $PSScriptRoot "ae-test\lab"
$UK = (Resolve-Path (Join-Path $PSScriptRoot "..\UltimateKit")).Path
New-Item -ItemType Directory -Force $Dir | Out-Null
$types = @{ ".html" = "text/html"; ".js" = "application/javascript"; ".css" = "text/css"; ".json" = "application/json"; ".png" = "image/png"; ".txt" = "text/plain" }
$vids = @{}; $wc = New-Object System.Net.WebClient
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Sink on http://localhost:$Port/ -> $Dir"
while ($l.IsListening) {
    $ctx = $l.GetContext(); $rq = $ctx.Request; $rs = $ctx.Response
    $rs.Headers.Add("Access-Control-Allow-Origin", "*")
    $rs.Headers.Add("Cache-Control", "no-store")
    $p = [Uri]::UnescapeDataString($rq.Url.AbsolutePath.TrimStart('/'))
    # ?coi=1 pages (and everything they load) are cross-origin isolated, so SharedArrayBuffer / wasm threads work
    if ($rq.Url.Query -like "*coi=1*" -or $p -like "uk/lib/depth/*") { $rs.Headers.Add("Cross-Origin-Opener-Policy", "same-origin"); $rs.Headers.Add("Cross-Origin-Embedder-Policy", "require-corp"); $rs.Headers.Add("Cross-Origin-Resource-Policy", "same-origin") }
    try {
        if ($rq.HttpMethod -eq "POST") {
            $name = [IO.Path]::GetFileName($p)
            $sr = New-Object IO.StreamReader($rq.InputStream, [Text.Encoding]::UTF8); $body = $sr.ReadToEnd(); $sr.Close()
            if ($name -match '^[\w\-.]+$') { [IO.File]::WriteAllText((Join-Path $Dir $name), $body, (New-Object Text.UTF8Encoding($false))); $msg = "saved $name " + $body.Length } else { $msg = "bad name" }
            $b = [Text.Encoding]::UTF8.GetBytes($msg); $rs.ContentType = "text/plain"; $rs.OutputStream.Write($b, 0, $b.Length)
        } elseif ($p -like "v/*") {
            # preview video passthrough (kept in memory only) with Range support so the lab page can seek
            $key = $p.Substring(2)
            if (-not $vids.ContainsKey($key)) { $vids[$key] = $wc.DownloadData("https://public-assets.content-platform.envatousercontent.com/$key/preview_540p_crf22_higher_quality.mp4") }
            $b = $vids[$key]; $n = $b.Length; $a = 0; $z = $n - 1
            $rs.ContentType = "video/mp4"; $rs.Headers.Add("Accept-Ranges", "bytes")
            $rg = $rq.Headers["Range"]
            if ($rg -match 'bytes=(\d*)-(\d*)') {
                if ($matches[1]) { $a = [long]$matches[1] }
                if ($matches[2]) { $z = [Math]::Min([long]$matches[2], $n - 1) }
                # small chunks: the video element stops reading open-ended ranges, which would block this single thread
                $z = [Math]::Min($z, $a + 524287)
                $rs.StatusCode = 206; $rs.Headers.Add("Content-Range", "bytes $a-$z/$n")
            }
            $rs.ContentLength64 = $z - $a + 1
            $rs.OutputStream.Write($b, $a, $z - $a + 1)
        } else {
            $f = $null
            if ($p -like "lab/*") { $f = Join-Path $Lab $p.Substring(4) } elseif ($p -like "uk/*") { $f = Join-Path $UK $p.Substring(3) } elseif ($p -like "sink/*") { $f = Join-Path $Dir $p.Substring(5) }
            if ($f -and ($f -notmatch '\.\.') -and (Test-Path $f -PathType Leaf)) {
                $b = [IO.File]::ReadAllBytes($f); $ext = [IO.Path]::GetExtension($f).ToLower()
                $rs.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
                $rs.OutputStream.Write($b, 0, $b.Length)
            } else {
                $msg = (Get-ChildItem $Dir | ForEach-Object { $_.Name + " " + $_.Length }) -join "`n"
                $b = [Text.Encoding]::UTF8.GetBytes($msg); $rs.ContentType = "text/plain"; $rs.OutputStream.Write($b, 0, $b.Length)
            }
        }
    } catch { $rs.StatusCode = 500 }
    $rs.Close()
}
