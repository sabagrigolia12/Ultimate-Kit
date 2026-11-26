param([string]$Png, [int]$X, [int]$Y, [int]$W, [int]$H, [double]$Scale = 4, [switch]$Prefix, [switch]$Bin)
# Number OCR experiment: crop -> grey -> (binarize) dark text on white -> upscale, optionally after a drawn "Layer " prefix.
Add-Type -AssemblyName System.Drawing, System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }
$src = [Drawing.Bitmap]::FromFile($Png)
$crop = New-Object Drawing.Bitmap $W, $H
for ($yy = 0; $yy -lt $H; $yy++) { for ($xx = 0; $xx -lt $W; $xx++) { $c = $src.GetPixel($X + $xx, $Y + $yy); $l = [int](0.3 * $c.R + 0.59 * $c.G + 0.11 * $c.B); $v = 255 - $l; if ($Bin) { $v = if ($l -gt 120) { 0 } else { 255 } }; $crop.SetPixel($xx, $yy, [Drawing.Color]::FromArgb($v, $v, $v)) } }
$src.Dispose()
$pre = 0; if ($Prefix) { $pre = [int]($H * $Scale * 3.2) }
$bw = [int]($W * $Scale) + $pre + 40; $bh = [int]($H * $Scale) + 40
$bmp = New-Object Drawing.Bitmap $bw, $bh; $g = [Drawing.Graphics]::FromImage($bmp); $g.Clear([Drawing.Color]::White); $g.InterpolationMode = 'HighQualityBicubic'
if ($Prefix) { $f = New-Object Drawing.Font "Arial", ([float]($H * $Scale * 0.42)), ([Drawing.FontStyle]::Regular), ([Drawing.GraphicsUnit]::Pixel); $g.DrawString("Layer", $f, [Drawing.Brushes]::Black, 20, ($bh / 2 - $H * $Scale * 0.3)) }
$g.DrawImage($crop, (New-Object Drawing.Rectangle (20 + $pre), 20, ([int]($W * $Scale)), ([int]($H * $Scale))))
$tmp = Join-Path $env:TEMP "ukocrn.png"; $bmp.Save($tmp); $bmp.Dispose()
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($tmp)) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$sb = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new("en-US"))
$res = Await ($eng.RecognizeAsync($sb)) ([Windows.Media.Ocr.OcrResult])
($res.Lines | ForEach-Object { ($_.Words | ForEach-Object { $_.Text }) -join " " }) -join " / "
