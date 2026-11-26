param([string]$Label = "", [int[]]$Xs = @(300, 1700), [int]$Step = 3)
# Moves the mouse down the 6 test rows of WR_dnd (t_dndcomp6.jsx) and checks ukdrag_con.exe probe against the expected row.
$exp = @{ 1 = 1218; 2 = 1243; 3 = 1268; 4 = 1293; 5 = 1319; 6 = 1344 }
$bad = 0; $tot = 0
foreach ($x in $Xs) {
    for ($y = 1208; $y -le 1354; $y += $Step) {
        & "$PSScriptRoot\ddtest.exe" move $x $y
        $r = & "$PSScriptRoot\ukdrag_con.exe" probe
        $want = 0; foreach ($k in $exp.Keys) { if ([Math]::Abs($y - $exp[$k]) -le 12) { $want = $k } }
        $tot++
        if ($r -notmatch "^row $want\|") { $bad++; "BAD {0},{1} want {2}: {3}" -f $x, $y, $want, $r }
    }
}
"$Label : bad $bad of $tot"
