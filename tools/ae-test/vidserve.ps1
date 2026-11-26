# Tiny local server for reading a reference video frame by frame in the browser pane (no ffmpeg here):
#   GET  /            -> tools/ae-test/web/<page> (default vidframes.html)
#   GET  /video.mp4   -> the video given with -Video (read only)
#   POST /save/<name> -> body = data URL, written as a file to out/<Out>/<name>
param([int]$Port = 8765, [string]$Video = "C:\Users\user\Desktop\Video-70210.mp4", [string]$Out = "hlref")
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$web = Join-Path $root "web"; $dst = Join-Path $root ("out\" + $Out)
New-Item -ItemType Directory -Force $dst | Out-Null
$l = New-Object System.Net.HttpListener; $l.Prefixes.Add("http://localhost:$Port/"); $l.Start()
"listening on $Port"
while ($l.IsListening) {
    $c = $l.GetContext(); $q = $c.Request; $r = $c.Response
    try {
        $path = $q.Url.AbsolutePath
        if ($q.HttpMethod -eq "POST" -and $path.StartsWith("/save/")) {
            $name = [IO.Path]::GetFileName($path.Substring(6))
            $sr = New-Object IO.StreamReader($q.InputStream); $body = $sr.ReadToEnd(); $sr.Close()
            $b64 = $body.Substring($body.IndexOf(",") + 1)
            [IO.File]::WriteAllBytes((Join-Path $dst $name), [Convert]::FromBase64String($b64))
            $bytes = [Text.Encoding]::UTF8.GetBytes("saved")
        } elseif ($path.StartsWith("/uk/")) {
            $f = Join-Path "D:\Projects\Codex\UltimateKit" ($path.Substring(4).Replace("/", "\"))
            $bytes = [IO.File]::ReadAllBytes($f); $r.ContentType = if ($f.EndsWith(".js")) { "text/javascript; charset=utf-8" } else { "text/plain; charset=utf-8" }
            $r.AddHeader("Cache-Control", "no-store")
        } elseif ($path -eq "/video.mp4") {
            $bytes = [IO.File]::ReadAllBytes($Video); $r.ContentType = "video/mp4"
        } else {
            $f = if ($path -eq "/") { "vidframes.html" } else { [IO.Path]::GetFileName($path) }
            $bytes = [IO.File]::ReadAllBytes((Join-Path $web $f)); $r.ContentType = "text/html; charset=utf-8"; $r.AddHeader("Cache-Control", "no-store")
        }
        $r.ContentLength64 = $bytes.Length; $r.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch { $r.StatusCode = 500 }
    $r.Close()
}
