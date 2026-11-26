# rebuild all cinematic backgrounds, render frames, make a contact sheet of the middle frames
$t = "D:\Projects\Codex\tools\ae-test"
& "$t\run-ae.ps1" -Jsx "$t\t_reset.jsx" -Timeout 200
& "$t\run-ae.ps1" -Jsx "$t\t_cine.jsx" -Timeout 300
Get-Content "$t\out\t_cine_out.txt" | Select-String "FAIL|ERR"
Get-ChildItem "$t\out\frames_cn" -Filter *.png -ErrorAction SilentlyContinue | Remove-Item
Set-Content "$t\out\render_cfg.txt" "CN_|frames_cn|1,6,11" -NoNewline
& "$t\run-ae.ps1" -Jsx "$t\t_render.jsx" -Timeout 60
$n = 0; while ($n -lt 120) { $c = (Get-ChildItem "$t\out\frames_cn" -Filter *.png -ErrorAction SilentlyContinue).Count; if ($c -ge 60) { break }; Start-Sleep 4; $n++ }
"frames $c"
& "$t\sheet.ps1" -Dir "$t\out\frames_cn" -Pattern "*_1.png" -Out "$t\out\sheet_cn_mid.png" -Cols 4 -TW 300 -TH 169
