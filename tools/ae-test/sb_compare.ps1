param([string]$Ids = "", [switch]$Detail, [string]$Dir = "out\sbr")
# compares each AE render (out\sbr\<id>_0.png) with the reference preview's 8x5 colour grid (out\ref_grids.txt)
Add-Type -AssemblyName System.Drawing
$ref = @{}
foreach ($l in Get-Content out\ref_grids.txt) { if ($l -match '^(sb\d+):([0-9a-f]+)$') { $ref[$Matches[1]] = $Matches[2] } }
function Grid($path) {
    $src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $path))
    $m = New-Object System.Drawing.Bitmap 64, 40
    $g = [System.Drawing.Graphics]::FromImage($m); $g.InterpolationMode = 'HighQualityBicubic'; $g.DrawImage($src, 0, 0, 64, 40); $g.Dispose()
    $s = New-Object System.Drawing.Bitmap 8, 5
    $g = [System.Drawing.Graphics]::FromImage($s); $g.InterpolationMode = 'HighQualityBicubic'; $g.DrawImage($m, 0, 0, 8, 5); $g.Dispose()
    $o = @()
    for ($y = 0; $y -lt 5; $y++) { for ($x = 0; $x -lt 8; $x++) { $c = $s.GetPixel($x, $y); $o += , @($c.R, $c.G, $c.B) } }
    $src.Dispose(); $m.Dispose(); $s.Dispose()
    return , $o
}
$want = if ($Ids) { $Ids.Split(",") } else { $ref.Keys | Sort-Object }
$rows = @()
foreach ($id in $want) {
    $f = Join-Path $Dir ($id + "_0.png")
    if (-not (Test-Path $f)) { continue }
    $a = Grid $f; $r = $ref[$id]; $err = 0; $lum = 0
    $cells = @()
    for ($i = 0; $i -lt 40; $i++) {
        $rr = [Convert]::ToInt32($r.Substring($i * 6, 2), 16); $rg = [Convert]::ToInt32($r.Substring($i * 6 + 2, 2), 16); $rb = [Convert]::ToInt32($r.Substring($i * 6 + 4, 2), 16)
        $d = ([Math]::Abs($a[$i][0] - $rr) + [Math]::Abs($a[$i][1] - $rg) + [Math]::Abs($a[$i][2] - $rb)) / 3
        $err += $d
        $lum += (($a[$i][0] + $a[$i][1] + $a[$i][2]) - ($rr + $rg + $rb)) / 3
        $cells += ('{0:x2}{1:x2}{2:x2}/{3}' -f $a[$i][0], $a[$i][1], $a[$i][2], $r.Substring($i * 6, 6))
    }
    $rows += [pscustomobject]@{ id = $id; err = [Math]::Round($err / 40, 1); bright = [Math]::Round($lum / 40, 1) }
    if ($Detail) { "$id  (mine/ref)"; for ($y = 0; $y -lt 5; $y++) { ($cells[($y * 8)..($y * 8 + 7)] -join ' ') } }
}
$rows | Sort-Object err -Descending | Format-Table -AutoSize | Out-String -Width 200
