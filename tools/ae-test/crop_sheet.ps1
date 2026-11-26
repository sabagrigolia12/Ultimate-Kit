param([string]$Dir, [string]$Pattern = "*.png", [string]$Out, [int]$Cols = 2, [int]$X = 0, [int]$Y = 440, [int]$W = 1280, [int]$H = 280, [double]$Scale = 0.5)
# Contact sheet of one cropped region of every frame (e.g. the lower-third area), labelled with the file name.
Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem $Dir -Filter *.png | Where-Object { $_.Name -like $Pattern } | Sort-Object Name
$tw = [int]($W * $Scale); $th = [int]($H * $Scale)
$rows = [Math]::Ceiling($files.Count / $Cols)
$sheet = New-Object System.Drawing.Bitmap ($Cols * ($tw + 4)), ($rows * ($th + 16))
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::FromArgb(255, 50, 50, 50))
$font = New-Object System.Drawing.Font "Arial", 9
$i = 0
foreach ($f in $files) {
    $c = $i % $Cols; $r = [Math]::Floor($i / $Cols)
    $x0 = $c * ($tw + 4); $y0 = $r * ($th + 16) + 14
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle $x0, $y0, $tw, $th), (New-Object System.Drawing.Rectangle $X, $Y, $W, $H), [System.Drawing.GraphicsUnit]::Pixel)
    $img.Dispose()
    $g.DrawString($f.BaseName, $font, [System.Drawing.Brushes]::Yellow, $x0 + 2, $y0 - 13)
    $i++
}
$sheet.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $sheet.Dispose()
"sheet -> $Out ($($files.Count) frames)"
