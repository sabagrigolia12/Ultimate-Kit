param([string[]]$Files = @("bl_0", "bl_1"), [double]$MaxErr = 4.5, [string[]]$Skip = @())
# out/sink/<file>.json (mesh lab __fitAll) -> UltimateKit/shared/saasbg_blobs.js
# Backgrounds whose blob fit error is above $MaxErr (or listed in $Skip) stay a mesh.
$dir = "D:\Projects\Codex\tools\ae-test\out\sink"
$all = [ordered]@{}
foreach ($n in $Files) {
    $p = "$dir\$n.json"; if (-not (Test-Path $p)) { "missing $n"; continue }
    $o = [IO.File]::ReadAllText($p) | ConvertFrom-Json
    foreach ($q in $o.PSObject.Properties) { $all[$q.Name] = $q.Value }
}
$ids = $all.Keys | Sort-Object
$sb = New-Object Text.StringBuilder
[void]$sb.Append("/*  Ultimate Kit - SaaS backgrounds built as blurred ellipses (UK_CAT.saasBlobs), fitted to the text-free`n    preview frame in tools/ae-test/lab (blobs.js). W x H = fit grid; pal = colours (0..255); bg = background colour;`n    blobs = [colour, x, y, ln rx, ln ry, angle (rad), ln blur sigma, logit opacity] in fit-grid pixels, bottom -> top. */`nUK_CAT.saasBlobs = {`n")
$kept = @(); $skipped = @()
foreach ($id in $ids) {
    $m = $all[$id]
    if ($m.err -gt $MaxErr -or $Skip -contains $id) { $skipped += "$id($($m.err))"; continue }
    $pal = ($m.pal | ForEach-Object { "[" + ($_ -join ", ") + "]" }) -join ", "
    $bl = ($m.blobs | ForEach-Object { "[" + ($_ -join ", ") + "]" }) -join ", "
    $kept += "    ${id}: { W: $($m.W), H: $($m.H), bg: $($m.bg), pal: [$pal], blobs: [$bl] }"
}
[void]$sb.Append(($kept -join ",`n") + "`n};`n")
[IO.File]::WriteAllText("D:\Projects\Codex\UltimateKit\shared\saasbg_blobs.js", $sb.ToString(), (New-Object Text.UTF8Encoding($false)))
"blobs: $($kept.Count)  kept as mesh: $($skipped -join ' ')"
