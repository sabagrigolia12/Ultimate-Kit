param([string]$Png, [int]$X, [int]$Y, [int]$W, [int]$H, [double]$Scale = 2.5, [switch]$Invert)
# OCR test: crops a region of a png, upscales (+ inverts), runs Windows OCR (en-US), prints lines with word boxes.
Add-Type -AssemblyName System.Drawing, System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }
$src = [Drawing.Image]::FromFile($Png)
$bw = [int]($W * $Scale); $bh = [int]($H * $Scale)
$bmp = New-Object Drawing.Bitmap $bw, $bh; $g = [Drawing.Graphics]::FromImage($bmp); $g.InterpolationMode = 'HighQualityBicubic'
$ia = New-Object Drawing.Imaging.ImageAttributes
if ($Invert) { $cm = New-Object Drawing.Imaging.ColorMatrix; $cm.Matrix00 = -1; $cm.Matrix11 = -1; $cm.Matrix22 = -1; $cm.Matrix40 = 1; $cm.Matrix41 = 1; $cm.Matrix42 = 1; $ia.SetColorMatrix($cm) }
$g.DrawImage($src, (New-Object Drawing.Rectangle 0, 0, $bw, $bh), $X, $Y, $W, $H, [Drawing.GraphicsUnit]::Pixel, $ia); $src.Dispose()
$tmp = Join-Path $env:TEMP "ukocr.png"; $bmp.Save($tmp); $bmp.Dispose()
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($tmp)) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$sb = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$null = [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]; $eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new("en-US"))
$sw = [Diagnostics.Stopwatch]::StartNew()
$res = Await ($eng.RecognizeAsync($sb)) ([Windows.Media.Ocr.OcrResult])
"ocr ms " + $sw.ElapsedMilliseconds
foreach ($l in $res.Lines) { ($l.Words | ForEach-Object { $_.Text + "@" + [int]($_.BoundingRect.X / $Scale + $X) + "," + [int]($_.BoundingRect.Y / $Scale + $Y) }) -join "  " }

