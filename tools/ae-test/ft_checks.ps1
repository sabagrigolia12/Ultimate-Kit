# Runs t_ft_checks.jsx step by step, each frame finished before the next step changes the project. The frames are copied next to the test page.
param([string[]]$Steps = @("info", "end0", "range", "swap", "reverse", "moved"))
$dir = "D:\Projects\Codex\tools\ae-test\out\hlref"
foreach ($s in $Steps) {
    $png = "$dir\ft_c_$s.png"
    Remove-Item $png -ErrorAction SilentlyContinue
    $expr = "new Promise(function(res){ window.__adobe_cep__.evalScript(`"`$.global.FT_STEP = '$s'; `$.evalFile(new File('D:/Projects/Codex/tools/ae-test/t_ft_checks.jsx')); 'done'`", res); })"
    & D:\Projects\Codex\tools\ae-test\cdp.ps1 -Timeout 60 -Expr $expr | Out-Null
    "--- $s"
    Get-Content D:\Projects\Codex\tools\ae-test\out\ft_checks.txt -Encoding UTF8
    if ($s -ne "info") {
        $last = -1
        for ($i = 0; $i -lt 300; $i++) { if (Test-Path $png) { $n = (Get-Item $png).Length; if ($n -gt 100 -and $n -eq $last) { break }; $last = $n }; Start-Sleep -Milliseconds 100 }
        if (Test-Path $png) { Copy-Item $png "D:\Projects\Codex\tools\ae-test\web\ft_c_$s.png" -Force; "frame $last bytes" } else { "NO FRAME" }
    }
}
