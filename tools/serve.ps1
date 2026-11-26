# Tiny static file server used only to preview the panel UI in a browser (outside After Effects).
param([int]$Port = 8765, [string]$Root = (Join-Path $PSScriptRoot "..\UltimateKit"))
$Root = (Resolve-Path $Root).Path
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Serving $Root on http://localhost:$Port/"
$types = @{ ".html" = "text/html"; ".js" = "application/javascript"; ".css" = "text/css"; ".svg" = "image/svg+xml"; ".png" = "image/png"; ".json" = "application/json" }
while ($l.IsListening) {
    $ctx = $l.GetContext()
    $p = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($p -eq "") { $p = "index.html" }
    $f = Join-Path $Root $p
    if (Test-Path $f -PathType Leaf) {
        $b = [IO.File]::ReadAllBytes($f)
        $ext = [IO.Path]::GetExtension($f).ToLower()
        $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
        $ctx.Response.Headers.Add("Cache-Control", "no-store")
        $ctx.Response.OutputStream.Write($b, 0, $b.Length)
    } else { $ctx.Response.StatusCode = 404 }
    $ctx.Response.Close()
}
