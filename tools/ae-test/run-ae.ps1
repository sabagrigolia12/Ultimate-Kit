param([string]$Jsx, [int]$Timeout = 180)
$sp = "D:/Projects/Codex/tools/ae-test/out"
$done = "$sp/_done.txt"
Remove-Item $done -ErrorAction SilentlyContinue
Add-Type -AssemblyName System.Drawing
if (-not ("UKW" -as [type])) {
Add-Type @"
using System; using System.Text; using System.Runtime.InteropServices; using System.Collections.Generic;
public class UKW { public delegate bool EP(IntPtr h, IntPtr l);
[StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
[DllImport("user32.dll")] public static extern bool EnumWindows(EP cb, IntPtr l);
[DllImport("user32.dll")] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
[DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
[DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
[DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
[DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
public static List<IntPtr> Dialogs(uint pid){ var r=new List<IntPtr>(); EnumWindows((h,l)=>{ uint p; GetWindowThreadProcessId(h,out p); if(p==pid && IsWindowVisible(h)){ var c=new StringBuilder(256); GetClassName(h,c,256); if(c.ToString()=="#32770") r.Add(h);} return true;}, IntPtr.Zero); return r; } }
"@
}
function Handle-Dialogs {
    $p = Get-Process -Name AfterFX -ErrorAction SilentlyContinue
    if (-not $p) { return }
    foreach ($h in [UKW]::Dialogs([uint32]$p.Id)) {
        $r = New-Object UKW+RECT; [UKW]::GetWindowRect($h, [ref]$r) | Out-Null
        $w = $r.R - $r.L; $hh = $r.B - $r.T
        if ($w -lt 450) { continue }
        if ($w -gt 10 -and $hh -gt 10) {
            $bmp = New-Object System.Drawing.Bitmap $w, $hh; $g = [System.Drawing.Graphics]::FromImage($bmp); $hdc = $g.GetHdc()
            [UKW]::PrintWindow($h, $hdc, 2) | Out-Null; $g.ReleaseHdc($hdc); $g.Dispose()
            $f = "$sp/dialog_" + (Get-Date -Format "HHmmss") + ".png"; $bmp.Save($f); $bmp.Dispose()
            "[runner] DIALOG captured -> $f (dismissed)"
        }
        [UKW]::PostMessage($h, 0x0100, [IntPtr]0x0D, [IntPtr]0) | Out-Null
        [UKW]::PostMessage($h, 0x0101, [IntPtr]0x0D, [IntPtr]0) | Out-Null
    }
}
$jsxF = $Jsx -replace '\\', '/'
$js = "var __d=new File('$done'); var __m='ok'; try{`$.evalFile(new File('$jsxF'));}catch(e){__m='EVALERR '+e.toString()+' line '+e.line+' file '+e.fileName;} __d.open('w'); __d.write(__m); __d.close();"
$exe = "C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\AfterFX.exe"
# Never start After Effects from here (2026-10-25: it once opened a fresh empty AE after the user's had closed, and the
# tests then ran in it). No AE running = stop and say so.
if (-not (Get-Process -Name AfterFX -ErrorAction SilentlyContinue)) { "[runner] After Effects is not running - not started, nothing done"; exit 2 }
Handle-Dialogs
$null = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "`"$exe`" -s `"$js`"" }
$t = 0
while (-not (Test-Path $done) -and $t -lt $Timeout) { Start-Sleep 2; $t += 2; if ($t % 6 -eq 0) { Handle-Dialogs } }
Handle-Dialogs
if (Test-Path $done) { "[runner] finished in ${t}s: " + (Get-Content $done -Raw) } else { "[runner] TIMEOUT after ${t}s" }

