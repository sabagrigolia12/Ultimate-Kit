// Ultimate Kit - drag helper (Windows). The panel starts it when a preset tile is dragged out of the panel:
//   ukdrag.exe carry
// While the mouse is over an After Effects panel it reads the timeline row under the mouse from the screen (Windows
// OCR: the layer number and name) and prints "row <n>|<words>", "name|<words>" or "none|<why>" on stdout whenever that
// changes, and "up" / "esc" when the mouse button is released / Esc is pressed. The panel answers on stdin with the
// pointer to show: "ok" (text layer: green +), "no" (another layer: red x), "drop" (anywhere else: the drag icon), or
// "quit". After Effects can't tell a script which layer is under the mouse, and its timeline refuses drags from
// outside, so this is how the panel knows the layer.
// No system setting is touched: the drag pointer belongs to the helper's own invisible cover window.
// Build: bin\build.ps1 (csc of .NET Framework 4 + the WinRT metadata in System32\WinMetadata, no SDK needed)
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Windows.Graphics.Imaging;
using Windows.Media.Ocr;

class UKDrag {
    [StructLayout(LayoutKind.Sequential)] struct POINT { public int X, Y; }
    [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
    [StructLayout(LayoutKind.Sequential)] struct GUITHREADINFO { public int cbSize, flags; public IntPtr hwndActive, hwndFocus, hwndCapture, hwndMenuOwner, hwndMoveSize, hwndCaret; public RECT rcCaret; }
    [StructLayout(LayoutKind.Sequential)] struct ICONINFO { public bool fIcon; public int xHotspot, yHotspot; public IntPtr hbmMask, hbmColor; }
    [StructLayout(LayoutKind.Sequential)] struct BITMAPINFOHEADER { public int biSize, biWidth, biHeight; public short biPlanes, biBitCount; public int biCompression, biSizeImage, biXPelsPerMeter, biYPelsPerMeter, biClrUsed, biClrImportant; }
    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] static extern bool GetCursorPos(out POINT p);
    [DllImport("user32.dll")] static extern IntPtr WindowFromPoint(POINT p);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int vk);
    [DllImport("user32.dll")] static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
    [DllImport("user32.dll")] static extern bool GetGUIThreadInfo(uint tid, ref GUITHREADINFO gi);
    [DllImport("user32.dll")] static extern int GetSystemMetrics(int i);
    [DllImport("user32.dll")] static extern IntPtr CreateIconIndirect(ref ICONINFO ii);
    [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr ChildWindowFromPointEx(IntPtr parent, POINT p, uint flags);
    [DllImport("user32.dll")] static extern bool ScreenToClient(IntPtr h, ref POINT p);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr h, uint cmd);
    [DllImport("user32.dll")] static extern IntPtr GetTopWindow(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr SetCursor(IntPtr h);
    [DllImport("user32.dll")] static extern void mouse_event(uint f, int dx, int dy, uint d, UIntPtr e);
    static int handOver = 0;   // tick count when the press was handed over to the cover
    static volatile IntPtr coverHwnd = IntPtr.Zero;
    /* the window under the mouse, looking through the cover: the topmost visible top-level window there (not ours),
       then its deepest child at that point */
    static IntPtr Under(POINT p) {
        if (coverHwnd == IntPtr.Zero) return WindowFromPoint(p);
        uint me = (uint)Process.GetCurrentProcess().Id;
        for (IntPtr w = GetTopWindow(IntPtr.Zero); w != IntPtr.Zero; w = GetWindow(w, 2)) {   // GW_HWNDNEXT: top to bottom
            uint pid; GetWindowThreadProcessId(w, out pid);
            if (pid == me || !IsWindowVisible(w)) continue;
            RECT r; GetWindowRect(w, out r);
            if (p.X < r.L || p.X >= r.R || p.Y < r.T || p.Y >= r.B) continue;
            IntPtr cur = w;
            for (int d = 0; d < 32; d++) {
                POINT q = p; ScreenToClient(cur, ref q);
                IntPtr ch = ChildWindowFromPointEx(cur, q, 0x0001 | 0x0004);   // skip invisible / transparent
                if (ch == IntPtr.Zero || ch == cur) break;
                cur = ch;
            }
            return cur;
        }
        return IntPtr.Zero;
    }
    [DllImport("gdi32.dll")] static extern IntPtr CreateDIBSection(IntPtr hdc, ref BITMAPINFOHEADER bi, uint usage, out IntPtr bits, IntPtr sec, uint off);

    static OcrEngine ocr;
    static bool Debug = false;
    static volatile string state = "drop";     // the pointer: "drop" | "ok" | "no"
    static volatile bool quit = false, released = false;
    static readonly object outLock = new object();
    static void Say(string t) { lock (outLock) { try { Console.Out.WriteLine(t); Console.Out.Flush(); } catch (Exception) { quit = true; } } }

    /* ------------------------------------------------------------------ pointer
       Once the mouse is out of the panel, an invisible window (alpha 1/255) covers the screens: it takes the mouse for
       the rest of the drag, so After Effects sees no mouse at all (no hover effects, none of its own pointers, no stray
       button release) and the pointer is ours: an arrow with a small badge - violet with an arrow into a tray (drag),
       green with + (drop allowed here), red with x (not on this layer). */
    static readonly Dictionary<string, IntPtr> curs = new Dictionary<string, IntPtr>();
    static Overlay cover;
    class Overlay : Form {
        public Overlay() {
            FormBorderStyle = FormBorderStyle.None; ShowInTaskbar = false; TopMost = true; StartPosition = FormStartPosition.Manual;
            var v = SystemInformation.VirtualScreen; Bounds = v; BackColor = Color.Black; Opacity = 1.0 / 255;
        }
        protected override bool ShowWithoutActivation { get { return true; } }
        protected override CreateParams CreateParams { get { var c = base.CreateParams; c.ExStyle |= 0x08000000 | 0x00000080 | 0x00000008; return c; } }   // no activate, tool window, topmost
    }
    static string curShown = null;
    static void Pointer(string st) {
        if (cover == null || st == curShown) return;
        curShown = st;
        try { cover.Cursor = new Cursor(MakeCursor(st)); } catch (Exception) { }
    }    static IntPtr MakeCursor(string kind) {
        IntPtr h;
        if (curs.TryGetValue(kind, out h)) return h;
        int n = Math.Max(32, GetSystemMetrics(13));
        using (var bmp = new Bitmap(n, n, PixelFormat.Format32bppArgb)) {
            using (var g = Graphics.FromImage(bmp)) {
                g.SmoothingMode = SmoothingMode.AntiAlias; g.Clear(Color.Transparent);
                float k = n / 32f;
                var arrow = new PointF[] { new PointF(1, 1), new PointF(1, 22), new PointF(6, 17), new PointF(10, 26), new PointF(13, 25), new PointF(9, 16), new PointF(16, 16) };
                for (int i = 0; i < arrow.Length; i++) arrow[i] = new PointF(arrow[i].X * k, arrow[i].Y * k);
                g.FillPolygon(Brushes.White, arrow);
                using (var pen = new Pen(Color.Black, 1.3f * k)) g.DrawPolygon(pen, arrow);
                Color bg = kind == "ok" ? Color.FromArgb(34, 160, 92) : (kind == "no" ? Color.FromArgb(214, 48, 49) : Color.FromArgb(124, 92, 255));
                var c = new RectangleF(16.5f * k, 16.5f * k, 15 * k, 15 * k);
                using (var ring = new SolidBrush(Color.FromArgb(230, 20, 20, 24))) g.FillEllipse(ring, c.X - 0.8f * k, c.Y - 0.8f * k, c.Width + 1.6f * k, c.Height + 1.6f * k);
                using (var gb = new SolidBrush(bg)) g.FillEllipse(gb, c);
                float cx = 24 * k, cy = 24 * k;
                using (var wp = new Pen(Color.White, 2f * k)) {
                    wp.StartCap = LineCap.Round; wp.EndCap = LineCap.Round;
                    if (kind == "ok") { g.DrawLine(wp, cx - 3.6f * k, cy, cx + 3.6f * k, cy); g.DrawLine(wp, cx, cy - 3.6f * k, cx, cy + 3.6f * k); }
                    else if (kind == "no") { g.DrawLine(wp, cx - 3f * k, cy - 3f * k, cx + 3f * k, cy + 3f * k); g.DrawLine(wp, cx + 3f * k, cy - 3f * k, cx - 3f * k, cy + 3f * k); }
                    else {   // an arrow down into a tray
                        wp.Width = 1.7f * k;
                        g.DrawLine(wp, cx, cy - 4f * k, cx, cy + 1.2f * k);
                        g.DrawLine(wp, cx - 2.4f * k, cy - 1.2f * k, cx, cy + 1.2f * k); g.DrawLine(wp, cx + 2.4f * k, cy - 1.2f * k, cx, cy + 1.2f * k);
                        g.DrawLine(wp, cx - 4f * k, cy + 3.6f * k, cx + 4f * k, cy + 3.6f * k);
                    }
                }
            }
            var ii = new ICONINFO(); ii.fIcon = false; ii.xHotspot = 1; ii.yHotspot = 1;
            using (var mono = new Bitmap(n, n, PixelFormat.Format1bppIndexed)) {
                ii.hbmColor = ColorBitmap(bmp); ii.hbmMask = mono.GetHbitmap();
                h = CreateIconIndirect(ref ii);
                DeleteObject(ii.hbmColor); DeleteObject(ii.hbmMask);
            }
        }
        curs[kind] = h;
        return h;
    }
    /* a top-down 32-bit DIB with premultiplied alpha (GetHbitmap would drop the alpha) */
    static IntPtr ColorBitmap(Bitmap bmp) {
        int w = bmp.Width, h = bmp.Height;
        var bi = new BITMAPINFOHEADER { biSize = 40, biWidth = w, biHeight = -h, biPlanes = 1, biBitCount = 32 };
        IntPtr bits; IntPtr hb = CreateDIBSection(IntPtr.Zero, ref bi, 0, out bits, IntPtr.Zero, 0);
        var px = new byte[w * h * 4];
        var bd = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        Marshal.Copy(bd.Scan0, px, 0, px.Length); bmp.UnlockBits(bd);
        for (int i = 0; i < px.Length; i += 4) { int a = px[i + 3]; px[i] = (byte)(px[i] * a / 255); px[i + 1] = (byte)(px[i + 1] * a / 255); px[i + 2] = (byte)(px[i + 2] * a / 255); }
        Marshal.Copy(px, 0, bits, px.Length);
        return hb;
    }

    [STAThread]
    static int Main(string[] a) {
        SetProcessDPIAware();
        try { ocr = OcrEngine.TryCreateFromLanguage(new Windows.Globalization.Language("en-US")) ?? OcrEngine.TryCreateFromUserProfileLanguages(); } catch (Exception) { }
        if (a.Length > 0 && a[0] == "probe") { Debug = true; var sw = Stopwatch.StartNew(); Console.WriteLine(Probe() + "  (" + sw.ElapsedMilliseconds + " ms)"); return 0; }
        if (a.Length < 1 || a[0] != "carry") return 1;
        // stdin: the pointer to show
        var rd = new Thread(() => {
            try {
                string line;
                while (!quit && (line = Console.In.ReadLine()) != null) {
                    line = line.Trim();
                    if (line == "quit") break;
                    if (line == "ok" || line == "no" || line == "drop") state = line;
                }
            } catch (Exception) { }
            quit = true;
        }) { IsBackground = true };
        rd.Start();
        // the row under the mouse, read in the background
        var scan = new Thread(() => {
            string last = null;
            int started = Environment.TickCount;
            while (!quit) {
                string now = Probe();
                if (now != last && !released) { last = now; Say(now); }
                Thread.Sleep(50);
                if (Environment.TickCount - started > 120000) quit = true;   // safety
            }
        }) { IsBackground = true };
        scan.Start();
        // the panel holds the mouse capture while its button is down (and with it the pointer): once the mouse is out
        // of the panel the capture is cancelled, so the pointer follows the windows under it; the release of the button
        // (or Esc) is then watched here and reported as "up" / "esc"
        POINT p0; GetCursorPos(out p0);
        uint pid0, panelTid = GetWindowThreadProcessId(WindowFromPoint(p0), out pid0);
        bool freed = false;
        var tm = new System.Windows.Forms.Timer { Interval = 15 };
        tm.Tick += (s, e) => {
            if (quit) { tm.Stop(); if (cover != null) cover.Close(); Application.ExitThread(); return; }
            Pointer(state);
            if (cover != null) SetCursor(MakeCursor(state));   // the cover owns the mouse: its pointer, every tick
            if (released) return;
            POINT p; GetCursorPos(out p);
            if ((GetAsyncKeyState(0x1B) & 0x8000) != 0) { released = true; Say("esc"); }
            else if (cover == null && (GetAsyncKeyState(0x01) & 0x8000) == 0) { released = true; Say("up"); }   // (with the cover: its MouseUp)
            else if (!freed) {
                var cb = new StringBuilder(64); GetClassName(WindowFromPoint(p), cb, 64);
                string cn = cb.ToString();
                if (!cn.StartsWith("Chrome") && !cn.StartsWith("Cef")) {
                    var gi = new GUITHREADINFO(); gi.cbSize = Marshal.SizeOf(gi);
                    if (GetGUIThreadInfo(panelTid, ref gi) && gi.hwndCapture != IntPtr.Zero) PostMessage(gi.hwndCapture, 0x001F, IntPtr.Zero, IntPtr.Zero);   // WM_CANCELMODE
                    freed = true;
                    cover = new Overlay(); cover.Show(); coverHwnd = cover.Handle; curShown = null; Pointer(state);
                    // the press still belongs to the panel's window, and Windows keeps the pointer of the window the button
                    // went down in: hand the press over to the cover (up + down, the user's finger stays down), so the
                    // pointer is the cover's and the real release arrives there
                    cover.MouseDown += (s2, e2) => { cover.Capture = true; };
                    cover.MouseUp += (s2, e2) => { if (!released && Environment.TickCount - handOver > 60) { released = true; Say("up"); } };
                    handOver = Environment.TickCount;
                    mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero); mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero);
                }
            }
        };
        tm.Start();
        Application.Run(new ApplicationContext());
        return 0;
    }

    /* ------------------------------------------------------------------ the row under the mouse
       Timeline rows are a regular grid. A band of ~3 rows is read once per window to learn it (row pitch, row
       centres, where the # column is); after that only the one row under the mouse is read: its name from a strip
       of exactly that row (neighbour rows - selected ones look different - can't get mixed in), its number from the
       # column alone, made black on white with a word in front ("Layer 3": OCR reads a lone digit badly, a digit
       after a word well). The answer is kept while the mouse stays inside that row (no re-reading = no blinking). */
    static IntPtr gridWnd = IntPtr.Zero;
    static double gPitch = 0, gPhase = 0, gNameX = double.NaN;
    static int misses = 0;
    static IntPtr lockWnd = IntPtr.Zero;
    static int lockTop = 0, lockBot = -1;
    static string lockRes = null;
    static string Probe() {
        POINT p; GetCursorPos(out p);
        IntPtr h = Under(p);
        uint pid; GetWindowThreadProcessId(h, out pid);
        var c = new StringBuilder(256); GetClassName(h, c, 256);
        string cls = c.ToString();
        if (cls.StartsWith("Chrome") || cls.StartsWith("Cef")) { lockRes = null; return "none|panel"; }     // an HTML panel (its own process)
        string proc = "";
        try { proc = Process.GetProcessById((int)pid).ProcessName; } catch (Exception) { }
        if (!proc.Equals("AfterFX", StringComparison.OrdinalIgnoreCase)) { lockRes = null; return "none|outside"; }
        if (ocr == null) return "none|noocr";
        if (lockRes != null && h == lockWnd && p.Y >= lockTop && p.Y <= lockBot) return lockRes;
        RECT r; GetWindowRect(h, out r);
        int x0 = r.L, w = Math.Min((int)((r.R - r.L) * 0.45), 700);   // the left part: # and name live there
        if (w < 80) { lockRes = null; return "none|small"; }
        try {
            if (gridWnd != h || gPitch <= 0) {
                int y0 = Math.Max(r.T, p.Y - 64), y1 = Math.Min(r.B, p.Y + 64);
                var rows = ReadBand(x0, y0, w, y1 - y0, 3.0);
                var gaps = new List<double>();
                for (int i = 1; i < rows.Count; i++) { double d = rows[i].Cy - rows[i - 1].Cy; if (d > 12 && d < 60) gaps.Add(d); }
                if (gaps.Count == 0) { lockRes = null; return "none|nogrid"; }     // one row only: try again a little later
                // the grid: every row centre on c0 + k * pitch (k whole). Tried from each row and each gap; the fit with the
                // most rows on it (within 3 px) wins, refined by least squares. Toolbars / headers fall off; too few rows
                // on one grid (the mouse at the top of the timeline) = no grid yet, read again a moment later
                int bestIn = 0; double bestP = 0, bestC = 0;
                foreach (double g0 in gaps) foreach (var r0 in rows) {
                    double num = 0, den = 0; int inl = 0;
                    foreach (var rw in rows) { double kk = Math.Round((rw.Cy - r0.Cy) / g0); if (Math.Abs(rw.Cy - r0.Cy - kk * g0) <= 3) { inl++; num += (rw.Cy - r0.Cy) * kk; den += kk * kk; } }
                    if (inl > bestIn && den > 0) { bestIn = inl; bestP = num / den; bestC = r0.Cy; }
                }
                if (bestIn < 3 || bestP < 15 || bestP > 50) { lockRes = null; return "none|nogrid"; }
                gPitch = bestP;
                double sx = 0, sy = 0;                                             // phase: the mean offset of the rows on the grid
                foreach (var rw in rows) {
                    double kk = Math.Round((rw.Cy - bestC) / gPitch);
                    if (Math.Abs(rw.Cy - bestC - kk * gPitch) > 3) continue;
                    double a = 2 * Math.PI * rw.Cy / gPitch; sx += Math.Cos(a); sy += Math.Sin(a);
                }
                gPhase = Math.Atan2(sy, sx) / (2 * Math.PI) * gPitch;
                // the name column: where most names start (the first real word of a row); the # column lies left of it
                var xs = new List<double>();
                foreach (var rw in rows) { double nx = rw.NameX(); if (!double.IsNaN(nx)) xs.Add(x0 + nx); }
                gNameX = double.NaN;
                if (xs.Count > 0) { xs.Sort(); gNameX = xs[xs.Count / 2]; }
                gridWnd = h;
            }
            double k = Math.Round((p.Y - gPhase) / gPitch), cy = gPhase + k * gPitch;
            int top = (int)Math.Round(cy - gPitch / 2), hgt = (int)Math.Round(gPitch);
            // the name: that row alone
            string name = null;
            foreach (double sc in new double[] { 3.0, 2.0 }) {
                var one = ReadBand(x0, top, w, hgt, sc);
                Row best = null;
                foreach (var o in one) if (best == null || Math.Abs(o.Cy - cy) < Math.Abs(best.Cy - cy)) best = o;
                if (best != null) { name = best.Name(w, gNameX - x0); if (name != null) break; }
            }
            // the number: the # column alone (left of the layer-type icon and the name; pixel sizes follow the row height)
            double u = gPitch / 25.0;
            int n = double.IsNaN(gNameX) ? -1 : ReadNumber((int)Math.Round(gNameX - 80 * u), top, (int)Math.Round(48 * u), hgt);
            if (n < 1 && name == null) { lockRes = null; if (++misses >= 3) { gridWnd = IntPtr.Zero; misses = 0; } return "none|nothing"; }
            misses = 0;
            string res = (n >= 1 ? "row " + n : "name") + "|" + (name ?? "");
            lockRes = res; lockWnd = h; lockTop = top + 1; lockBot = top + hgt - 1;
            return res;
        } catch (Exception ex) { lockRes = null; return "none|err " + ex.GetType().Name; }
    }

    /* the layer number in the # column: black on white, upscaled, after the word "Layer" */
    static int ReadNumber(int nx, int top, int nw, int nh) {
        if (nw < 6 || nh < 6) return -1;
        const int S = 4;
        using (var shot = new Bitmap(nw, nh, PixelFormat.Format32bppArgb)) {
            using (var g = Graphics.FromImage(shot)) g.CopyFromScreen(nx, top, 0, 0, shot.Size);
            var bd = shot.LockBits(new Rectangle(0, 0, nw, nh), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            var px = new byte[bd.Stride * nh];
            Marshal.Copy(bd.Scan0, px, 0, px.Length);
            for (int i = 0; i < px.Length; i += 4) {   // the digits are light grey on dark: they turn black, everything else (label colours too) white
                int cB = px[i], cG = px[i + 1], cR = px[i + 2], l = (cB * 11 + cG * 59 + cR * 30) / 100, sat = Math.Max(cR, Math.Max(cG, cB)) - Math.Min(cR, Math.Min(cG, cB));
                byte v = (byte)(l > 120 && sat < 60 ? 0 : 255); px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
            }
            Marshal.Copy(px, 0, bd.Scan0, px.Length);
            shot.UnlockBits(bd);
            int pre = (int)(nh * S * 3.2), bw = nw * S + pre + 40, bh = nh * S + 40;
            using (var big = new Bitmap(bw, bh, PixelFormat.Format32bppArgb)) {
                using (var g2 = Graphics.FromImage(big)) {
                    g2.Clear(Color.White); g2.InterpolationMode = InterpolationMode.HighQualityBicubic; g2.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAlias;
                    using (var f = new Font("Arial", nh * S * 0.42f, FontStyle.Regular, GraphicsUnit.Pixel)) g2.DrawString("Layer", f, Brushes.Black, 20, bh / 2f - nh * S * 0.3f);
                    g2.DrawImage(shot, new Rectangle(20 + pre, 20, nw * S, nh * S));
                }
                foreach (var row in Ocr(big, 0, 1)) foreach (var wd in row.Words) { int v; if (int.TryParse(wd.Text, out v) && v > 0) return v; }
            }
        }
        return -1;
    }
    class Row {
        public double Cy; public List<OcrWord> Words = new List<OcrWord>(); public double S;
        void Sort() { Words.Sort((u, v) => u.BoundingRect.X.CompareTo(v.BoundingRect.X)); }
        /* x (band pixels) where the name starts: the first word of 2+ letters that isn't a number */
        public double NameX() {
            Sort();
            foreach (var wd in Words) { int v; if (wd.Text.Length >= 2 && !int.TryParse(wd.Text, out v)) return wd.BoundingRect.X / S; }
            return double.NaN;
        }
        /* the layer name: the words from the name column on (single-letter icons skipped), up to the first wide gap */
        public string Name(int w, double nameX) {
            Sort();
            var name = new List<string>();
            double end = -1;
            foreach (var wd in Words) {
                var br = wd.BoundingRect; double x = br.X / S;
                if (!double.IsNaN(nameX) && x < nameX - 8) continue;              // the number, icons and switches left of it
                if (name.Count == 0 && wd.Text.Length < 2) continue;              // the layer-type icon
                if (end >= 0 && (br.X - end) / S > 30) break;
                name.Add(wd.Text); end = br.X + br.Width;
                if (name.Count >= 8) break;
            }
            return name.Count == 0 ? null : string.Join(" ", name.ToArray());
        }
    }    /* OCR a band of the screen, words grouped into rows by their height (screen y of each row's centre) */
    static List<Row> ReadBand(int x0, int y0, int w, int bandH, double S) {
        if (bandH < 8) return new List<Row>();
        using (var shot = new Bitmap(w, bandH, PixelFormat.Format32bppArgb)) {
            using (var g = Graphics.FromImage(shot)) g.CopyFromScreen(x0, y0, 0, 0, shot.Size);
            int bw = (int)(w * S), bh = (int)(bandH * S);
            using (var big = new Bitmap(bw, bh, PixelFormat.Format32bppArgb)) {
                using (var g2 = Graphics.FromImage(big)) { g2.InterpolationMode = InterpolationMode.HighQualityBicubic; g2.DrawImage(shot, 0, 0, bw, bh); }
                return Ocr(big, y0, S);
            }
        }
    }
    /* OCR a bitmap; rows with their centre in screen y (y0 + bitmap y / S) */
    static List<Row> Ocr(Bitmap big, int y0, double S) {
        var rows = new List<Row>();
        int bw = big.Width, bh = big.Height;
        var bd = big.LockBits(new Rectangle(0, 0, bw, bh), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var bytes = new byte[bd.Stride * bh];
        Marshal.Copy(bd.Scan0, bytes, 0, bytes.Length);
        big.UnlockBits(bd);
        var sb = new SoftwareBitmap(BitmapPixelFormat.Bgra8, bw, bh, BitmapAlphaMode.Premultiplied);
        sb.CopyFromBuffer(Windows.Security.Cryptography.CryptographicBuffer.CreateFromByteArray(bytes));
        var op = ocr.RecognizeAsync(sb);
        while (op.Status == Windows.Foundation.AsyncStatus.Started) Thread.Sleep(2);
        var res = op.GetResults();
        var all = new List<KeyValuePair<double, OcrWord>>();
        foreach (var ln in res.Lines) foreach (var wd in ln.Words) all.Add(new KeyValuePair<double, OcrWord>(y0 + (wd.BoundingRect.Y + wd.BoundingRect.Height / 2) / S, wd));
        all.Sort((a1, a2) => a1.Key.CompareTo(a2.Key));
        foreach (var kv in all) {
            Row last = rows.Count > 0 ? rows[rows.Count - 1] : null;
            if (last == null || kv.Key - last.Cy > 7) { last = new Row { Cy = kv.Key, S = S }; rows.Add(last); }
            last.Words.Add(kv.Value);
            double sum = 0; int cnt = 0;
            foreach (var w2 in last.Words) { sum += y0 + (w2.BoundingRect.Y + w2.BoundingRect.Height / 2) / S; cnt++; }
            last.Cy = sum / cnt;
        }
        if (Debug) foreach (var rw in rows) { var sbd = new StringBuilder(); foreach (var dw in rw.Words) sbd.Append(dw.Text + "@" + (int)(dw.BoundingRect.X / S) + " "); Console.WriteLine("   row y " + (int)rw.Cy + ": " + sbd); }
        return rows;
    }
}