param([string]$Ids, [string]$Out = "out\cmp_sheet.png", [int]$Pairs = 2, [int]$TW = 400, [int]$TH = 225)
# reference (out/sink/ref_<id>.b64, saved by the mesh lab) | AE render (out/sbr/<id>_0.png), $Pairs pairs per row
Add-Type -AssemblyName System.Drawing
$list = $Ids.Split(",")
$rows = [Math]::Ceiling($list.Count / $Pairs)
$W = $Pairs * (2 * $TW + 12); $H = $rows * ($TH + 18)
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(40, 40, 40))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$font = New-Object System.Drawing.Font("Segoe UI", 9)
$k = 0
foreach ($id in $list) {
    $x = ($k % $Pairs) * (2 * $TW + 12); $y = [Math]::Floor($k / $Pairs) * ($TH + 18)
    $g.DrawString("$id  ref | AE", $font, [System.Drawing.Brushes]::White, $x + 2, $y + 1)
    $rf = "out\sink\ref_$id.b64"
    if (Test-Path $rf) {
        $ms = New-Object IO.MemoryStream(, [Convert]::FromBase64String([IO.File]::ReadAllText($rf)))
        $im = [System.Drawing.Image]::FromStream($ms); $g.DrawImage($im, $x, $y + 16, $TW, $TH); $im.Dispose(); $ms.Dispose()
    }
    $af = "out\sbr\$($id)_0.png"
    if (Test-Path $af) { $im = [System.Drawing.Image]::FromFile((Resolve-Path $af)); $g.DrawImage($im, $x + $TW + 2, $y + 16, $TW, $TH); $im.Dispose() }
    $k++
}
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose()
"cmp -> $Out ($($list.Count))"
