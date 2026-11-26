param([string[]]$Files, [string]$Out, [int]$X = 760, [int]$Y = 230, [int]$W = 960, [int]$H = 540, [double]$Gain = 3, [double]$Scale = 1, [int]$Cols = 1, [int]$Bg = 50)
# Crops one region of each frame, brightens it (dim screen recordings) and tiles them into one image.
Add-Type -AssemblyName System.Drawing
$tw = [int]($W * $Scale); $th = [int]($H * $Scale); $rows = [Math]::Ceiling($Files.Count / $Cols)
$sheet = New-Object System.Drawing.Bitmap ($Cols * ($tw + 4)), ($rows * ($th + 16))
$g = [System.Drawing.Graphics]::FromImage($sheet); $g.Clear([System.Drawing.Color]::FromArgb(255, $Bg, $Bg, $Bg))
$font = New-Object System.Drawing.Font "Arial", 9
$cm = New-Object System.Drawing.Imaging.ColorMatrix
$cm.Matrix00 = $Gain; $cm.Matrix11 = $Gain; $cm.Matrix22 = $Gain
$ia = New-Object System.Drawing.Imaging.ImageAttributes; $ia.SetColorMatrix($cm)
$i = 0
foreach ($f in $Files) {
    $c = $i % $Cols; $r = [Math]::Floor($i / $Cols); $x0 = $c * ($tw + 4); $y0 = $r * ($th + 16) + 14
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $f).Path)
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle $x0, $y0, $tw, $th), $X, $Y, $W, $H, [System.Drawing.GraphicsUnit]::Pixel, $ia)
    $g.DrawString([IO.Path]::GetFileNameWithoutExtension($f), $font, [System.Drawing.Brushes]::Yellow, $x0 + 2, $y0 - 13)
    $img.Dispose(); $i++
}
$sheet.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $sheet.Dispose()
"bright -> $Out ($i)"

