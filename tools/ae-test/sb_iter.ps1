param([string]$Ids, [string]$Out = "out\sb_iter.png", [int]$Cols = 4, [int]$Timeout = 900)
# One SaaS-BG iteration: remove the previous test comps (by id), build $Ids, render frame 4 s, contact sheet.
$ErrorActionPreference = "Continue"
.\run-ae.ps1 -Jsx D:\Projects\Codex\tools\ae-test\t_cleanup_created.jsx -Timeout 300 | Out-Null
Get-Content out\cleanup.txt
[System.IO.File]::WriteAllText("D:\Projects\Codex\tools\ae-test\out\sb_only.txt", $Ids)
.\run-ae.ps1 -Jsx D:\Projects\Codex\tools\ae-test\t_saasbg.jsx -Timeout $Timeout | Out-Null
Get-Content out\t_saasbg_out.txt | Where-Object { $_ -notmatch '^OK ' -and $_ -notmatch "^load error: ''" }
Get-Content out\t_saasbg_out.txt | Where-Object { $_ -match '^OK ' } | ForEach-Object { ($_ -split '\s+')[1] + " " + (($_ -split 'ms=')[1]) } | Out-String | ForEach-Object { $_.Replace("`r`n", " | ") }
[System.IO.File]::WriteAllText("D:\Projects\Codex\tools\ae-test\out\render_cfg.txt", "SB_|sbr|4")
$t0 = Get-Date
.\run-ae.ps1 -Jsx D:\Projects\Codex\tools\ae-test\t_render.jsx -Timeout 600 | Out-Null
$list = $Ids.Split(",")
for ($w = 0; $w -lt 120; $w++) {
    $n = ($list | Where-Object { $f = "out\sbr\$($_)_0.png"; (Test-Path $f) -and ((Get-Item $f).LastWriteTime -gt $t0) }).Count
    if ($n -ge $list.Count) { break }
    Start-Sleep 2
}
"rendered $n / $($list.Count)"
.\sel_sheet.ps1 -Ids $Ids -Out $Out -Cols $Cols
