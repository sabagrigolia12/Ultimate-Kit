# Builds bin\ukdrag.exe (the drag & drop helper) with the C# compiler that ships with Windows (.NET Framework 4).
$fw = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319"; $wm = "$env:WINDIR\System32\WinMetadata"
$refs = @("$fw\System.Windows.Forms.dll", "$fw\System.Drawing.dll", "$fw\System.Runtime.dll", "$fw\System.Runtime.WindowsRuntime.dll",
    "$wm\Windows.Foundation.winmd", "$wm\Windows.Media.winmd", "$wm\Windows.Graphics.winmd", "$wm\Windows.Globalization.winmd",
    "$wm\Windows.Storage.winmd", "$wm\Windows.Security.winmd") | ForEach-Object { "/r:$_" }
& "$fw\csc.exe" /nologo /target:winexe /optimize $refs "/out:$PSScriptRoot\ukdrag.exe" "$PSScriptRoot\ukdrag.cs"
