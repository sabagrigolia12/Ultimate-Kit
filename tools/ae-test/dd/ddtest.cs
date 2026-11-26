// Drag & drop lab (test tool, not shipped). Commands:
//   shot <png>                      full virtual screen to png (+ prints its origin)
//   formats <x> <y> <w> <h> <sec>   topmost drop window; logs the formats a drag offers (out\dd_formats.txt)
//   drag <x1> <y1> <x2> <y2> <drop|esc> [x3 y3 ...]   real mouse drag (SendInput) through the points; logs the
//                                   cursor kind at every point (out\dd_drag.txt); drop = release, esc = cancel
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

class DD {
    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] static extern void mouse_event(uint f, int dx, int dy, uint d, UIntPtr e);
    [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint f, UIntPtr e);
    [StructLayout(LayoutKind.Sequential)] struct POINT { public int X, Y; }
    [StructLayout(LayoutKind.Sequential)] struct CURSORINFO { public int cbSize, flags; public IntPtr hCursor; public POINT pt; }
    [DllImport("user32.dll")] static extern bool GetCursorInfo(ref CURSORINFO ci);
    [DllImport("user32.dll")] static extern IntPtr LoadCursor(IntPtr h, int id);
    [DllImport("user32.dll")] static extern bool DrawIcon(IntPtr hdc, int x, int y, IntPtr h);
    const string OUT = @"D:\Projects\Codex\tools\ae-test\out\";

    static string Kind() {
        var ci = new CURSORINFO(); ci.cbSize = Marshal.SizeOf(ci); GetCursorInfo(ref ci);
        var names = new Dictionary<int, string> { { 32512, "arrow" }, { 32648, "no" }, { 32649, "hand" }, { 32515, "cross" }, { 32513, "ibeam" }, { 32646, "sizeall" }, { 32514, "wait" } };
        foreach (var kv in names) if (LoadCursor(IntPtr.Zero, kv.Key) == ci.hCursor) return kv.Value;
        return "custom:" + ci.hCursor.ToInt64();
    }

    [STAThread]
    static int Main(string[] a) {
        SetProcessDPIAware();
        if (a[0] == "cursorshot") { var ci = new CURSORINFO(); ci.cbSize = Marshal.SizeOf(ci); GetCursorInfo(ref ci); using (var bmp = new Bitmap(64, 64)) { using (var g = Graphics.FromImage(bmp)) { g.Clear(Color.FromArgb(40, 40, 40)); var hdc = g.GetHdc(); DrawIcon(hdc, 8, 8, ci.hCursor); g.ReleaseHdc(hdc); } bmp.Save(a[1]); } Console.WriteLine(Kind()); return 0; }
        if (a[0] == "move") { SetCursorPos(int.Parse(a[1]), int.Parse(a[2])); return 0; }
        if (a[0] == "shot") {
            var r = SystemInformation.VirtualScreen;
            using (var bmp = new Bitmap(r.Width, r.Height)) using (var g = Graphics.FromImage(bmp)) { g.CopyFromScreen(r.Left, r.Top, 0, 0, r.Size); bmp.Save(a[1]); }
            Console.WriteLine(r.Left + "," + r.Top + " " + r.Width + "x" + r.Height);
            return 0;
        }
        if (a[0] == "formats") {
            var f = new Form { TopMost = true, FormBorderStyle = FormBorderStyle.None, StartPosition = FormStartPosition.Manual, AllowDrop = true, BackColor = Color.DarkSlateBlue,
                Left = int.Parse(a[1]), Top = int.Parse(a[2]), Width = int.Parse(a[3]), Height = int.Parse(a[4]), ShowInTaskbar = false };
            var log = new List<string>();
            DragEventHandler enter = (s, e) => {
                log.Add("enter: " + string.Join(" | ", e.Data.GetFormats(false)));
                try { var fd = e.Data.GetData(DataFormats.FileDrop) as string[]; if (fd != null) log.Add("files: " + string.Join(";", fd)); } catch (Exception ex) { log.Add("files err " + ex.Message); }
                e.Effect = DragDropEffects.Copy;
                File.WriteAllLines(OUT + "dd_formats.txt", log);
            };
            f.DragEnter += enter;
            f.DragDrop += (s, e) => { log.Add("drop"); File.WriteAllLines(OUT + "dd_formats.txt", log); };
            var t = new System.Windows.Forms.Timer { Interval = int.Parse(a[5]) * 1000 }; t.Tick += (s, e) => f.Close(); t.Start();
            File.WriteAllLines(OUT + "dd_formats.txt", new[] { "waiting" });
            Application.Run(f);
            return 0;
        }
        if (a[0] == "source") {   // source <x> <y> <file> <sec>: a small window that starts a real file drag (FileDrop) on mouse down
            var f = new Form { TopMost = true, FormBorderStyle = FormBorderStyle.None, StartPosition = FormStartPosition.Manual, BackColor = Color.OrangeRed,
                Left = int.Parse(a[1]), Top = int.Parse(a[2]), Width = 120, Height = 80, ShowInTaskbar = false };
            var path = a[3];
            f.MouseDown += (s, e) => {
                var d = new DataObject(); d.SetData(DataFormats.FileDrop, new string[] { path });
                var r = f.DoDragDrop(d, DragDropEffects.Copy | DragDropEffects.Move | DragDropEffects.Link);
                File.WriteAllText(OUT + "dd_source.txt", "result " + r);
            };
            var t = new System.Windows.Forms.Timer { Interval = int.Parse(a[4]) * 1000 }; t.Tick += (s, e) => f.Close(); t.Start();
            Application.Run(f);
            return 0;
        }
        if (a[0] == "drag") {
            var log = new List<string>();
            var pts = new List<Point>();
            int i = 1;
            pts.Add(new Point(int.Parse(a[1]), int.Parse(a[2]))); pts.Add(new Point(int.Parse(a[3]), int.Parse(a[4])));
            string mode = a[5];
            for (i = 6; i + 1 < a.Length; i += 2) pts.Add(new Point(int.Parse(a[i]), int.Parse(a[i + 1])));
            SetCursorPos(pts[0].X, pts[0].Y); Thread.Sleep(150);
            mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero); Thread.Sleep(120);
            for (int p = 1; p < pts.Count; p++) {
                var A = pts[p - 1]; var B = pts[p];
                for (int s = 1; s <= 30; s++) { SetCursorPos(A.X + (B.X - A.X) * s / 30, A.Y + (B.Y - A.Y) * s / 30); Thread.Sleep(25); }
                Thread.Sleep(900);
                log.Add(B.X + "," + B.Y + " cursor " + Kind());
            }
            if (mode == "esc") { keybd_event(0x1B, 0, 0, UIntPtr.Zero); keybd_event(0x1B, 0, 2, UIntPtr.Zero); Thread.Sleep(150); }
            mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero);
            log.Add("released (" + mode + ")");
            File.WriteAllLines(OUT + "dd_drag.txt", log);
            return 0;
        }
        return 1;
    }
}

