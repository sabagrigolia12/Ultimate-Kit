param([string]$Ids, [string]$Out = "out\sel_sheet.png", [int]$Cols = 4, [string]$Dir = "out\sbr")
# contact sheet of the given ids, in the given order
$tmp = "out\_sel"; Remove-Item $tmp -Recurse -ErrorAction SilentlyContinue; New-Item -ItemType Directory $tmp | Out-Null
$k = 0; foreach ($id in $Ids.Split(",")) { $f = Join-Path $Dir ($id + "_0.png"); if (Test-Path $f) { Copy-Item $f (Join-Path $tmp ("{0:D3}_{1}.png" -f $k, $id)) }; $k++ }
& .\sheet.ps1 -Dir $tmp -Out $Out -Cols $Cols -TW 320 -TH 180
