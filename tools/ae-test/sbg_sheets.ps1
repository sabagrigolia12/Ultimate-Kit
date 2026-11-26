# Packs out/sbg/seq/<id>/f00..f59.png into UltimateKit/assets/saasbg/<id>.jpg (480x270 frames, 6 columns x 10 rows).
param([int]$Quality = 84)
Add-Type -AssemblyName System.Drawing
$src = "D:\Projects\Codex\tools\ae-test\out\sbg\seq"; $dst = "D:\Projects\Codex\UltimateKit\assets\saasbg"
$enc = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$ep = New-Object Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), ([long]$Quality)
foreach ($d in Get-ChildItem $src -Directory) {
    $sheet = New-Object Drawing.Bitmap 2880, 2700; $g = [Drawing.Graphics]::FromImage($sheet)
    $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    for ($i = 0; $i -lt 60; $i++) {
        $f = Join-Path $d.FullName ("f{0:D2}.png" -f $i); if (-not (Test-Path $f)) { "missing $f"; continue }
        $im = [Drawing.Image]::FromFile($f); $g.DrawImage($im, ($i % 6) * 480, [Math]::Floor($i / 6) * 270, 480, 270); $im.Dispose()
    }
    $g.Dispose(); $out = Join-Path $dst ($d.Name + ".jpg"); $sheet.Save($out, $enc, $ep); $sheet.Dispose()
    "{0} {1:N0} KB" -f $d.Name, ((Get-Item $out).Length / 1KB)
}
