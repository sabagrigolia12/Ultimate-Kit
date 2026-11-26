param([string]$Only = "", [string]$Times = "0.5,5", [int]$Cols = 4)
# clean previous SB_ test comps, build the given SaaS backgrounds, render frames, make a contact sheet
$ae = "D:\Projects\Codex\tools\ae-test"
Set-Location $ae
& .\run-ae.ps1 -Jsx "$ae\t_cleanup_mine.jsx" | Out-Null
& .\run-ae.ps1 -Jsx "$ae\t_cleanup_solids.jsx" | Out-Null
& .\run-ae.ps1 -Jsx "$ae\t_cleanup_mine.jsx" | Out-Null
if ($Only) { Set-Content out\sb_only.txt $Only -NoNewline -Encoding ascii } else { Remove-Item out\sb_only.txt -ErrorAction SilentlyContinue }
& .\run-ae.ps1 -Jsx "$ae\t_saasbg.jsx" | Out-Null
Get-Content out\t_saasbg_out.txt
Remove-Item out\sbr -Recurse -ErrorAction SilentlyContinue
Set-Content out\render_cfg.txt "SB_|sbr|$Times" -NoNewline -Encoding ascii
$want = ((Get-Content out\t_saasbg_out.txt) | Where-Object { $_ -match "^(OK|WARN)" }).Count * ($Times.Split(",").Count)
& .\run-ae.ps1 -Jsx "$ae\t_render.jsx" | Out-Null
$n = 0; $tries = 0
while ($n -lt $want -and $tries -lt 60) { Start-Sleep 5; $n = (Get-ChildItem out\sbr -ErrorAction SilentlyContinue).Count; $tries++ }
Start-Sleep 3
& .\sheet.ps1 -Dir out\sbr -Out out\sb_sheet.png -Cols $Cols -TW 320 -TH 180
