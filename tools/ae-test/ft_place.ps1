# Fill Trim place sliders on my test comp: Apply through the panel's route, the key changes, then frames per state, each state finished before the next changes the project.
$ae = "D:\Projects\Codex\tools\ae-test"
& "$ae\cdp.ps1" -Timeout 20 -Expr "eval(window.cep.fs.readFile('D:/Projects/Codex/tools/ae-test/ft_call.js').data); 'started'" | Out-Null
$t = 0; do { Start-Sleep -Seconds 3; $t += 3; $a = & "$ae\cdp.ps1" -Timeout 20 -Expr "String(window.__ftAnswer).slice(0, 400)" } while ($a -match 'waiting' -and $t -lt 280)
"apply after $t s: $a"
& "$ae\cdp.ps1" -Timeout 90 -Expr "new Promise(function(res){ window.__adobe_cep__.evalScript(`"`$.global.FT_STEP = 'keys'; `$.evalFile(new File('D:/Projects/Codex/tools/ae-test/t_ft_place.jsx')); 'done'`", res); })" | Out-Null
Get-Content "$ae\out\ft_place.txt" -Encoding UTF8
Remove-Item "$ae\out\hlref\ftp_*.png" -ErrorAction SilentlyContinue
$states = @(@("center", "[50, 50]", "false"), @("p30", "[30, 30]", "false"), @("win", "[30, 60]", "false"), @("rev", "[50, 50]", "true"))
foreach ($s in $states) {
    $tag = $s[0]; $pl = $s[1]; $rv = $s[2]
    $sw = [Diagnostics.Stopwatch]::StartNew()
    & "$ae\cdp.ps1" -Timeout 60 -Expr "new Promise(function(res){ window.__adobe_cep__.evalScript(`"`$.global.FT_STEP = 'frames'; `$.global.FT_TAG = '$tag'; `$.global.FT_PL = $pl; `$.global.FT_REV = $rv; `$.evalFile(new File('D:/Projects/Codex/tools/ae-test/t_ft_place.jsx')); 'done'`", res); })" | Out-Null
    Get-Content "$ae\out\ft_place.txt" -Encoding UTF8
    $p = "$ae\out\hlref\ftp_${tag}_75.png"; $last = -1
    for ($i = 0; $i -lt 600; $i++) { if (Test-Path $p) { $n = (Get-Item $p).Length; if ($n -gt 100 -and $n -eq $last) { break }; $last = $n }; Start-Sleep -Milliseconds 150 }
    "$tag : 4 frames in {0:n1} s" -f $sw.Elapsed.TotalSeconds
    Get-ChildItem "$ae\out\hlref\ftp_${tag}_*.png" | ForEach-Object { Copy-Item $_.FullName "$ae\web\$($_.Name)" -Force }
}
