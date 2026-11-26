param([string]$Dir, [string]$Prefix = "", [string]$Out, [int]$Cols = 3, [int]$TW = 256, [int]$TH = 144, [switch]$Coverage, [string]$Pattern = "*.png")
Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem $Dir -Filter $Pattern | Where-Object { $_.Name -like "$Prefix*" } | Sort-Object Name
if ($Coverage) {
    foreach ($f in ($files | Where-Object { $_.Name -like "*_50.png" })) {
        $bmp = [System.Drawing.Bitmap]::FromFile($f.FullName)
        $tot = 0; $holes = 0
        for ($y = 2; $y -lt $bmp.Height; $y += [Math]::Max(1, [int]($bmp.Height / 60))) {
            for ($x = 2; $x -lt $bmp.Width; $x += [Math]::Max(1, [int]($bmp.Width / 100))) {
                $tot++; if ($bmp.GetPixel($x, $y).A -lt 250) { $holes++ }
            }
        }
        $bmp.Dispose()
        "{0,-14} holes {1,5:N1}%" -f $f.Name, (100.0 * $holes / $tot)
    }
}
if ($Out) {
    $rows = [Math]::Ceiling($files.Count / $Cols)
    $sheet = New-Object System.Drawing.Bitmap ($Cols * ($TW + 6)), ($rows * ($TH + 22))
    $g = [System.Drawing.Graphics]::FromImage($sheet)
    $g.Clear([System.Drawing.Color]::FromArgb(255, 60, 60, 60))
    $font = New-Object System.Drawing.Font "Arial", 9
    $i = 0
    foreach ($f in $files) {
        $c = $i % $Cols; $r = [Math]::Floor($i / $Cols)
        $x0 = $c * ($TW + 6); $y0 = $r * ($TH + 22) + 16
        # checkerboard so transparency is visible
        for ($yy = 0; $yy -lt $TH; $yy += 12) { for ($xx = 0; $xx -lt $TW; $xx += 12) {
            $col = if ((($xx + $yy) / 12) % 2 -eq 0) { [System.Drawing.Color]::FromArgb(255, 200, 200, 200) } else { [System.Drawing.Color]::FromArgb(255, 150, 150, 150) }
            $g.FillRectangle((New-Object System.Drawing.SolidBrush $col), $x0 + $xx, $y0 + $yy, [Math]::Min(12, $TW - $xx), [Math]::Min(12, $TH - $yy)) } }
        $img = [System.Drawing.Image]::FromFile($f.FullName)
        $g.DrawImage($img, $x0, $y0, $TW, $TH)
        $img.Dispose()
        $g.DrawString($f.BaseName, $font, [System.Drawing.Brushes]::White, $x0 + 2, $y0 - 15)
        $i++
    }
    $sheet.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $sheet.Dispose()
    "sheet -> $Out ($($files.Count) frames)"
}
