# Times one frame of my test comp per state (t_ft_bench.jsx): each frame to its own file, the next only when the file is there and has stopped growing.
param([string[]]$Modes = @("expr", "static", "nomask", "expr"), [int]$Start = 31)
$dir = "D:\Projects\Codex\tools\ae-test\out\hlref"
$f = $Start
foreach ($m in $Modes) {
    $png = "$dir\ft_bench_$f.png"
    Remove-Item $png -ErrorAction SilentlyContinue
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $expr = "new Promise(function(res){ window.__adobe_cep__.evalScript(`"`$.global.FT_MODE = '$m'; `$.global.FT_FRAME = $f; `$.evalFile(new File('D:/Projects/Codex/tools/ae-test/t_ft_bench.jsx')); 'done'`", res); })"
    $ans = & D:\Projects\Codex\tools\ae-test\cdp.ps1 -Timeout 120 -Expr $expr
    $setup = $sw.Elapsed.TotalSeconds
    $last = -1
    for ($i = 0; $i -lt 1200; $i++) {
        if (Test-Path $png) { $n = (Get-Item $png).Length; if ($n -gt 100 -and $n -eq $last) { break }; $last = $n }
        Start-Sleep -Milliseconds 100
    }
    "{0,-8} frame {1}: script {2:n2} s, file done after {3:n2} s, {4} bytes, answer {5} | {6}" -f $m, $f, $setup, ($sw.Elapsed.TotalSeconds - 0.1), $last, $ans, (Get-Content D:\Projects\Codex\tools\ae-test\out\ft_bench.txt)
    Remove-Item $png -ErrorAction SilentlyContinue
    $f++
}
