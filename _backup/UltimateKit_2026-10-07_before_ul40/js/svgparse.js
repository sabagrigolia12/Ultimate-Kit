/*  Ultimate Kit - SVG -> shape data
    Parses an SVG document into { w, h, groups:[{ name, fill, fillOpacity, stroke, strokeWidth,
    strokeOpacity, cap, join, evenOdd, opacity, paths:[{v,i,o,c}] }] } with every curve
    converted to cubic beziers in AE's vertex / tangent format.                           */
var UKSvg = (function () {
    var KAPPA = 0.5522847498;
    var NAMED = { black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000", blue: "#0000ff", yellow: "#ffff00",
        orange: "#ffa500", purple: "#800080", gray: "#808080", grey: "#808080", silver: "#c0c0c0", navy: "#000080", teal: "#008080",
        maroon: "#800000", olive: "#808000", lime: "#00ff00", aqua: "#00ffff", cyan: "#00ffff", fuchsia: "#ff00ff", magenta: "#ff00ff",
        pink: "#ffc0cb", gold: "#ffd700", indigo: "#4b0082", violet: "#ee82ee", brown: "#a52a2a", coral: "#ff7f50", crimson: "#dc143c",
        darkgray: "#a9a9a9", lightgray: "#d3d3d3", whitesmoke: "#f5f5f5", tomato: "#ff6347", skyblue: "#87ceeb", royalblue: "#4169e1" };

    /* ------------------------------------------------------------ matrices */
    function mul(m, n) {
        return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
            m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
    }
    function ap(m, p) { return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]; }
    var I = [1, 0, 0, 1, 0, 0];
    function parseTransform(s) {
        var m = I.slice(), re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g, r;
        if (!s) return m;
        while ((r = re.exec(s))) {
            var a = r[2].split(/[\s,]+/).filter(function (x) { return x !== ""; }).map(parseFloat), t;
            switch (r[1]) {
                case "matrix": t = a.length >= 6 ? a.slice(0, 6) : I; break;
                case "translate": t = [1, 0, 0, 1, a[0] || 0, a[1] || 0]; break;
                case "scale": t = [a[0], 0, 0, a.length > 1 ? a[1] : a[0], 0, 0]; break;
                case "rotate":
                    var c = Math.cos(a[0] * Math.PI / 180), sn = Math.sin(a[0] * Math.PI / 180);
                    t = [c, sn, -sn, c, 0, 0];
                    if (a.length >= 3) t = mul(mul([1, 0, 0, 1, a[1], a[2]], t), [1, 0, 0, 1, -a[1], -a[2]]);
                    break;
                case "skewX": t = [1, 0, Math.tan(a[0] * Math.PI / 180), 1, 0, 0]; break;
                case "skewY": t = [1, Math.tan(a[0] * Math.PI / 180), 0, 1, 0, 0]; break;
            }
            m = mul(m, t);
        }
        return m;
    }

    /* -------------------------------------------------------------- colours */
    function hex2(n) { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? "0" : "") + n.toString(16); }
    function parseColor(v, doc, current) {
        if (!v) return null;
        v = String(v).trim();
        if (v === "none" || v === "transparent") return null;
        if (v === "currentColor") return parseColor(current || "#000000", doc);
        var m;
        if ((m = /^url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/.exec(v))) {
            var g = doc.getElementById(m[1]);
            var c = gradientColor(g, doc);
            return c || "#888888";
        }
        if (v.charAt(0) === "#") {
            var h = v.substr(1);
            if (h.length === 3 || h.length === 4) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
            return "#" + h.substr(0, 6).toLowerCase();
        }
        if ((m = /^rgba?\(([^)]*)\)/i.exec(v))) {
            var p = m[1].split(/[\s,\/]+/).filter(function (x) { return x !== ""; });
            var ch = function (s) { return s.indexOf("%") > 0 ? parseFloat(s) * 2.55 : parseFloat(s); };
            return "#" + hex2(ch(p[0])) + hex2(ch(p[1])) + hex2(ch(p[2]));
        }
        if ((m = /^hsla?\(([^)]*)\)/i.exec(v))) {
            var q = m[1].split(/[\s,\/]+/).filter(function (x) { return x !== ""; }).map(parseFloat);
            var hh = (q[0] % 360) / 360, ss = q[1] / 100, ll = q[2] / 100;
            var f = function (n) { var k = (n + hh * 12) % 12, a = ss * Math.min(ll, 1 - ll); return ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
            return "#" + hex2(f(0) * 255) + hex2(f(8) * 255) + hex2(f(4) * 255);
        }
        return NAMED[v.toLowerCase()] || null;
    }
    function gradientColor(g, doc) {
        var guard = 0;
        while (g && guard++ < 5) {
            var stops = g.getElementsByTagName("stop");
            if (stops.length) {
                // average of the stops so the solid colour matches the overall look
                var r = 0, gg = 0, b = 0, n = 0;
                for (var i = 0; i < stops.length; i++) {
                    var st = styleOf(stops[i]);
                    var c = parseColor(st["stop-color"] || stops[i].getAttribute("stop-color") || "#000", doc);
                    if (!c) continue;
                    r += parseInt(c.substr(1, 2), 16); gg += parseInt(c.substr(3, 2), 16); b += parseInt(c.substr(5, 2), 16); n++;
                }
                if (n) return "#" + hex2(r / n) + hex2(gg / n) + hex2(b / n);
            }
            var href = g.getAttribute("xlink:href") || g.getAttribute("href");
            g = href ? doc.getElementById(href.replace("#", "")) : null;
        }
        return null;
    }

    /* --------------------------------------------------------------- styles */
    var PROPS = ["fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "fill-rule", "stroke-linecap", "stroke-linejoin", "display", "visibility", "color"];
    var INHERIT = { fill: 1, stroke: 1, "stroke-width": 1, "fill-opacity": 1, "stroke-opacity": 1, "fill-rule": 1, "stroke-linecap": 1, "stroke-linejoin": 1, visibility: 1, color: 1 };
    function parseDecls(s) {
        var o = {};
        if (!s) return o;
        s.split(";").forEach(function (d) {
            var k = d.indexOf(":");
            if (k > 0) o[d.substr(0, k).trim().toLowerCase()] = d.substr(k + 1).trim().replace(/\s*!important$/, "");
        });
        return o;
    }
    var CSS = [];
    function parseCss(text) {
        text = text.replace(/\/\*[\s\S]*?\*\//g, "");
        var re = /([^{}]+)\{([^}]*)\}/g, m;
        while ((m = re.exec(text))) {
            var decl = parseDecls(m[2]);
            m[1].split(",").forEach(function (sel) { CSS.push({ sel: sel.trim(), decl: decl }); });
        }
    }
    function matches(el, sel) {
        if (sel.charAt(0) === ".") { var cls = (el.getAttribute("class") || "").split(/\s+/); return cls.indexOf(sel.substr(1)) >= 0; }
        if (sel.charAt(0) === "#") return el.getAttribute("id") === sel.substr(1);
        var m = /^([a-zA-Z]+)\.([\w-]+)$/.exec(sel);
        if (m) return el.localName === m[1] && (el.getAttribute("class") || "").split(/\s+/).indexOf(m[2]) >= 0;
        return el.localName === sel;
    }
    function styleOf(el) {
        var s = {};
        PROPS.concat(["stop-color"]).forEach(function (p) { var v = el.getAttribute(p); if (v !== null) s[p] = v; });
        for (var i = 0; i < CSS.length; i++) if (matches(el, CSS[i].sel)) for (var k in CSS[i].decl) s[k] = CSS[i].decl[k];
        var inl = parseDecls(el.getAttribute("style"));
        for (var j in inl) s[j] = inl[j];
        return s;
    }

    /* ----------------------------------------------------------- path data */
    function tokenize(d) {
        var out = [], i = 0, n = d.length;
        while (i < n) {
            var c = d.charAt(i);
            if (/[MmLlHhVvCcSsQqTtAaZz]/.test(c)) { out.push(c); i++; continue; }
            if (/[\s,]/.test(c)) { i++; continue; }
            var m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(d.substr(i));
            if (!m) { i++; continue; }
            out.push(parseFloat(m[0]));
            i += m[0].length;
        }
        return out;
    }
    /* arc flags may be packed ("a1 1 0 0010 10"), so arcs read their flags digit by digit */
    function tokenizeArcAware(d) {
        var toks = [], re = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g, m, cmd = "", argi = 0;
        while ((m = re.exec(d))) {
            if (m[1]) { cmd = m[1]; argi = 0; toks.push(cmd); continue; }
            var s = m[2];
            if ((cmd === "a" || cmd === "A") && (argi % 7 === 3 || argi % 7 === 4) && s.length > 1 && /^[01]/.test(s)) {
                toks.push(parseFloat(s.charAt(0))); argi++;
                re.lastIndex = m.index + 1;
                continue;
            }
            toks.push(parseFloat(s)); argi++;
        }
        return toks;
    }
    function arcToCubics(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
        var out = [];
        if (rx === 0 || ry === 0) return [[x1, y1, x2, y2, x2, y2]];
        var sinp = Math.sin(phi * Math.PI / 180), cosp = Math.cos(phi * Math.PI / 180);
        var dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
        var x1p = cosp * dx + sinp * dy, y1p = -sinp * dx + cosp * dy;
        rx = Math.abs(rx); ry = Math.abs(ry);
        var lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
        if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
        var num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
        var den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
        var co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
        var cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx;
        var cx = cosp * cxp - sinp * cyp + (x1 + x2) / 2, cy = sinp * cxp + cosp * cyp + (y1 + y2) / 2;
        function ang(ux, uy, vx, vy) { var a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; }
        var t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
        var dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
        if (!fs && dt > 0) dt -= 2 * Math.PI;
        if (fs && dt < 0) dt += 2 * Math.PI;
        var segs = Math.ceil(Math.abs(dt) / (Math.PI / 2)), d = dt / segs;
        var k = 4 / 3 * Math.tan(d / 4);
        for (var i = 0; i < segs; i++) {
            var a1 = t1 + i * d, a2 = a1 + d;
            var p1 = [Math.cos(a1) - k * Math.sin(a1), Math.sin(a1) + k * Math.cos(a1)];
            var p2 = [Math.cos(a2) + k * Math.sin(a2), Math.sin(a2) - k * Math.cos(a2)];
            var p3 = [Math.cos(a2), Math.sin(a2)];
            var tf = function (p) { var x = p[0] * rx, y = p[1] * ry; return [cosp * x - sinp * y + cx, sinp * x + cosp * y + cy]; };
            var c1 = tf(p1), c2 = tf(p2), e = tf(p3);
            out.push([c1[0], c1[1], c2[0], c2[1], e[0], e[1]]);
        }
        return out;
    }
    /* returns subpaths: [{ pts:[[x,y]..], cs:[[c1x,c1y,c2x,c2y]..], closed }] */
    function parsePath(d) {
        var t = tokenizeArcAware(d), i = 0, cmd = "", subs = [], cur = null;
        var x = 0, y = 0, sx = 0, sy = 0, lcx = null, lcy = null, lqx = null, lqy = null;
        function start(px, py) { cur = { pts: [[px, py]], cs: [], closed: false }; subs.push(cur); }
        function cubic(c1x, c1y, c2x, c2y, ex, ey) {
            if (!cur) start(x, y);
            cur.cs.push([c1x, c1y, c2x, c2y]); cur.pts.push([ex, ey]); x = ex; y = ey;
        }
        function line(ex, ey) { cubic(x, y, ex, ey, ex, ey); }
        function nxt() { return t[i++]; }
        while (i < t.length) {
            if (typeof t[i] === "string") cmd = t[i++];
            else if (cmd === "") { i++; continue; }
            var rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
            var ox = rel ? x : 0, oy = rel ? y : 0;
            if (C !== "C" && C !== "S") lcx = lcy = null;
            if (C !== "Q" && C !== "T") lqx = lqy = null;
            switch (C) {
                case "M": var mx = nxt() + ox, my = nxt() + oy; x = mx; y = my; sx = mx; sy = my; start(mx, my); cmd = rel ? "l" : "L"; break;
                case "L": line(nxt() + ox, nxt() + oy); break;
                case "H": line(nxt() + ox, y); break;
                case "V": line(x, nxt() + oy); break;
                case "C":
                    var c1x = nxt() + ox, c1y = nxt() + oy, c2x = nxt() + ox, c2y = nxt() + oy, ex = nxt() + ox, ey = nxt() + oy;
                    cubic(c1x, c1y, c2x, c2y, ex, ey); lcx = c2x; lcy = c2y; break;
                case "S":
                    var r1x = lcx === null ? x : 2 * x - lcx, r1y = lcy === null ? y : 2 * y - lcy;
                    var s2x = nxt() + ox, s2y = nxt() + oy, sex = nxt() + ox, sey = nxt() + oy;
                    cubic(r1x, r1y, s2x, s2y, sex, sey); lcx = s2x; lcy = s2y; break;
                case "Q":
                    var qx = nxt() + ox, qy = nxt() + oy, qex = nxt() + ox, qey = nxt() + oy;
                    cubic(x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y), qex + 2 / 3 * (qx - qex), qey + 2 / 3 * (qy - qey), qex, qey);
                    lqx = qx; lqy = qy; break;
                case "T":
                    var tqx = lqx === null ? x : 2 * x - lqx, tqy = lqy === null ? y : 2 * y - lqy, tex = nxt() + ox, tey = nxt() + oy;
                    cubic(x + 2 / 3 * (tqx - x), y + 2 / 3 * (tqy - y), tex + 2 / 3 * (tqx - tex), tey + 2 / 3 * (tqy - tey), tex, tey);
                    lqx = tqx; lqy = tqy; break;
                case "A":
                    var arx = nxt(), ary = nxt(), rot = nxt(), fa = nxt(), fs = nxt(), aex = nxt() + ox, aey = nxt() + oy;
                    var cs = arcToCubics(x, y, arx, ary, rot, fa ? 1 : 0, fs ? 1 : 0, aex, aey);
                    for (var k = 0; k < cs.length; k++) cubic(cs[k][0], cs[k][1], cs[k][2], cs[k][3], cs[k][4], cs[k][5]);
                    break;
                case "Z":
                    if (cur) {
                        cur.closed = true;
                        if (Math.abs(x - sx) > 1e-6 || Math.abs(y - sy) > 1e-6) line(sx, sy);
                    }
                    x = sx; y = sy; cur = null;
                    break;
                default: i++;
            }
            if (i < t.length && typeof t[i] !== "string" && C === "Z") i++;
        }
        return subs;
    }

    /* basic shapes as path data */
    function ellipseD(cx, cy, rx, ry) {
        return "M" + (cx + rx) + "," + cy + "A" + rx + "," + ry + " 0 1 1 " + (cx - rx) + "," + cy + "A" + rx + "," + ry + " 0 1 1 " + (cx + rx) + "," + cy + "Z";
    }
    function rectD(x, y, w, h, rx, ry) {
        if (!rx && !ry) return "M" + x + "," + y + "H" + (x + w) + "V" + (y + h) + "H" + x + "Z";
        rx = Math.min(rx || ry, w / 2); ry = Math.min(ry || rx, h / 2);
        return "M" + (x + rx) + "," + y + "H" + (x + w - rx) + "A" + rx + "," + ry + " 0 0 1 " + (x + w) + "," + (y + ry) +
            "V" + (y + h - ry) + "A" + rx + "," + ry + " 0 0 1 " + (x + w - rx) + "," + (y + h) + "H" + (x + rx) +
            "A" + rx + "," + ry + " 0 0 1 " + x + "," + (y + h - ry) + "V" + (y + ry) + "A" + rx + "," + ry + " 0 0 1 " + (x + rx) + "," + y + "Z";
    }

    /* subpaths -> AE vertex format, with a transform applied */
    function toAE(subs, m) {
        var out = [];
        subs.forEach(function (s) {
            if (s.pts.length < 2) return;
            var P = s.pts.map(function (p) { return ap(m, p); });
            var CS = s.cs.map(function (c) { var a = ap(m, [c[0], c[1]]), b = ap(m, [c[2], c[3]]); return [a[0], a[1], b[0], b[1]]; });
            var n = P.length, v = [], ii = [], oo = [], k;
            var closed = s.closed;
            var last = n - 1;
            if (closed && Math.abs(P[last][0] - P[0][0]) < 1e-4 && Math.abs(P[last][1] - P[0][1]) < 1e-4) last = n - 2;
            for (k = 0; k <= last; k++) { v.push([P[k][0], P[k][1]]); ii.push([0, 0]); oo.push([0, 0]); }
            for (k = 0; k < CS.length; k++) {
                var a = k, b = k + 1;
                if (b > last) b = 0;
                if (a > last) continue;
                oo[a] = [CS[k][0] - P[k][0], CS[k][1] - P[k][1]];
                ii[b] = [CS[k][2] - P[k + 1][0], CS[k][3] - P[k + 1][1]];
            }
            if (v.length >= 2) out.push({ v: v, i: ii, o: oo, c: closed });
        });
        return out;
    }

    function parse(text) {
        CSS = [];
        var doc = new DOMParser().parseFromString(text, "image/svg+xml");
        var svg = doc.documentElement;
        if (!svg || svg.localName !== "svg") throw new Error("Not an SVG file");
        var styles = doc.getElementsByTagName("style");
        for (var si = 0; si < styles.length; si++) parseCss(styles[si].textContent || "");
        var vb = (svg.getAttribute("viewBox") || "").split(/[\s,]+/).map(parseFloat);
        var W = parseFloat(svg.getAttribute("width")), H = parseFloat(svg.getAttribute("height"));
        var root = I.slice(), w, h;
        if (vb.length === 4 && !isNaN(vb[2])) { root = [1, 0, 0, 1, -vb[0], -vb[1]]; w = vb[2]; h = vb[3]; }
        else { w = W || 512; h = H || 512; }
        var groups = [], counter = 0;
        var SKIP = { defs: 1, clipPath: 1, mask: 1, symbol: 1, title: 1, desc: 1, metadata: 1, style: 1, linearGradient: 1, radialGradient: 1, pattern: 1, filter: 1, marker: 1, text: 1, image: 1, script: 1, foreignObject: 1 };
        function inherit(parent, own) {
            var o = {}, k;
            for (k in parent) if (INHERIT[k]) o[k] = parent[k];
            for (k in own) o[k] = own[k];
            return o;
        }
        function emit(el, d, st, m, op) {
            if (st.display === "none" || st.visibility === "hidden") return;
            var fill = st.fill === undefined ? "#000000" : st.fill;
            var fc = parseColor(fill, doc, st.color), sc = parseColor(st.stroke, doc, st.color);
            var tag = el.localName;
            if (tag === "line" || tag === "polyline") fc = (st.fill === undefined) ? null : fc;
            if (!fc && !sc) return;
            var subs = parsePath(d), paths = toAE(subs, m);
            if (!paths.length) return;
            var scale = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;
            counter++;
            groups.push({
                name: (el.getAttribute("id") || (tag + " " + counter)),
                fill: fc, fillOpacity: st["fill-opacity"] !== undefined ? parseFloat(st["fill-opacity"]) : 1,
                stroke: sc, strokeWidth: sc ? (st["stroke-width"] !== undefined ? parseFloat(st["stroke-width"]) : 1) * scale : 0,
                strokeOpacity: st["stroke-opacity"] !== undefined ? parseFloat(st["stroke-opacity"]) : 1,
                cap: st["stroke-linecap"], join: st["stroke-linejoin"], evenOdd: st["fill-rule"] === "evenodd",
                opacity: op, paths: paths
            });
        }
        function walk(el, m, st, op) {
            var tag = el.localName;
            if (!tag || SKIP[tag]) return;
            var own = styleOf(el);
            var s = inherit(st, own);
            var o = op * (own.opacity !== undefined ? parseFloat(own.opacity) : 1);
            var mm = mul(m, parseTransform(el.getAttribute("transform")));
            var a = function (n, d) { var v = parseFloat(el.getAttribute(n)); return isNaN(v) ? d : v; };
            switch (tag) {
                case "svg": case "g": case "a": case "switch":
                    if (tag === "svg" && el !== svg) mm = mul(mm, [1, 0, 0, 1, a("x", 0), a("y", 0)]);
                    for (var c = el.firstElementChild; c; c = c.nextElementSibling) walk(c, mm, s, o);
                    break;
                case "path": emit(el, el.getAttribute("d") || "", s, mm, o); break;
                case "rect":
                    var rw = a("width", 0), rh = a("height", 0);
                    if (rw > 0 && rh > 0) emit(el, rectD(a("x", 0), a("y", 0), rw, rh, a("rx", 0), a("ry", 0)), s, mm, o);
                    break;
                case "circle": var r = a("r", 0); if (r > 0) emit(el, ellipseD(a("cx", 0), a("cy", 0), r, r), s, mm, o); break;
                case "ellipse": if (a("rx", 0) > 0 && a("ry", 0) > 0) emit(el, ellipseD(a("cx", 0), a("cy", 0), a("rx", 0), a("ry", 0)), s, mm, o); break;
                case "line": emit(el, "M" + a("x1", 0) + "," + a("y1", 0) + "L" + a("x2", 0) + "," + a("y2", 0), s, mm, o); break;
                case "polyline": case "polygon":
                    var pts = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(parseFloat), dd = "";
                    for (var p = 0; p + 1 < pts.length; p += 2) dd += (p ? "L" : "M") + pts[p] + "," + pts[p + 1];
                    if (tag === "polygon") dd += "Z";
                    emit(el, dd, s, mm, o);
                    break;
                case "use":
                    var href = el.getAttribute("href") || el.getAttribute("xlink:href");
                    var ref = href ? doc.getElementById(href.replace("#", "")) : null;
                    if (ref) {
                        var um = mul(mm, [1, 0, 0, 1, a("x", 0), a("y", 0)]);
                        if (ref.localName === "symbol") { for (var cc = ref.firstElementChild; cc; cc = cc.nextElementSibling) walk(cc, um, inherit(s, styleOf(ref)), o); }
                        else walk(ref, um, s, o);
                    }
                    break;
            }
        }
        walk(svg, root, {}, 1);
        if (!groups.length) throw new Error("No drawable shapes found in this SVG (text and images are not supported).");
        return { w: w, h: h, groups: groups };
    }
    return { parse: parse, parsePath: parsePath };
})();
