// Captions (jsx/captions.jsx) through the real builder on an own comp WR_cap (1920 x 1080): every look as a new text
// layer in a grid, then re-apply cases on an own text. Steps by $.global.CAP_STEP: build / reapply / render (CAP_T,
// CAP_TAG) / log.  Results appended to out/cap_log.txt. Nothing of the user's is touched; no viewer, no active comp.
(function () {
    var OUT = "D:/Projects/Codex/tools/ae-test/out/", log = [];
    var J = function (v) { try { return (v instanceof Array) ? v.join(",") : String(v); } catch (e) { return "?"; } };
    var find = function (n) { for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === n) return app.project.item(i); return null; };
    var errs = function (L) {
        var out = [], n = 0;
        var walk = function (p, path) {
            for (var k = 1; k <= p.numProperties; k++) {
                var q = p.property(k);
                if (q.propertyType === PropertyType.PROPERTY) {
                    try { if (q.canSetExpression && q.expression !== "") { n++; if (!q.expressionEnabled || q.expressionError !== "") out.push(path + "/" + q.name + ": " + (q.expressionEnabled ? "" : "DISABLED ") + String(q.expressionError).replace(/[\r\n]+/g, " ").substr(0, 160)); } } catch (e) { }
                } else walk(q, path + "/" + q.name);
            }
        };
        walk(L, L.name);
        return { n: n, bad: out };
    };
    var names = function (g) { var a = []; for (var k = 1; k <= g.numProperties; k++) a.push(g.property(k).name); return a.join(", "); };
    var desel = function (C) { for (var q = 1; q <= C.numLayers; q++) if (C.layer(q).selected) C.layer(q).selected = false; };
    try {
        var step = $.global.CAP_STEP, C = find("WR_cap"), q, i;
        if (step === "build") {
            var before = {}; for (q = 1; q <= app.project.numItems; q++) before[app.project.item(q).id] = true; $.global.CAP_BEFORE = before;
            C = app.project.items.addComp("WR_cap", 1920, 1080, 1, 6, 30);
            var LK = UK_CAP.LOOKS, cols = 7, bad = 0, exprs = 0;
            for (i = 0; i < LK.length; i++) {
                desel(C); C.time = 0;
                try {
                    var r = UK.api.caption({ _comp: C, id: LK[i].id, mode: "both", inDur: 0.8, outDur: 0.6, hold: 2 });
                    var L = C.layer(1), E = errs(L);
                    L.property("ADBE Transform Group").property("ADBE Scale").setValue([30, 30]);
                    L.property("ADBE Transform Group").property("ADBE Position").setValue([140 + (i % cols) * 272, 110 + Math.floor(i / cols) * 172]);
                    exprs += E.n; bad += E.bad.length;
                    var td = L.property("ADBE Text Properties").property("ADBE Text Document").value, ex = "";
                    var A = L.property("ADBE Text Properties").property("ADBE Text Animators"), ac = A.property("Cap Accent");
                    if (ac) { var R = ac.property("ADBE Text Selectors").property(1); try { ex = " | accent units " + R.property("ADBE Text Range Advanced").property("ADBE Text Range Units").value + " idx " + R.property("ADBE Text Index Start").value + ".." + R.property("ADBE Text Index End").value + " pct " + R.property("ADBE Text Percent Start").value + ".." + R.property("ADBE Text Percent End").value; } catch (eA) { ex = " | accent read " + eA.message; } }
                    log.push(LK[i].id + " " + LK[i].name + " | font " + td.font + " size " + td.fontSize + " | fx: " + names(L.property("ADBE Effect Parade")) + " | anim: " + names(A) + ex + " | in " + L.inPoint + " out " + L.outPoint + (E.bad.length ? " | EXPR " + E.bad.join(" ; ") : ""));
                } catch (e1) { log.push(LK[i].id + " BUILD ERROR " + e1.message + " line " + e1.line); bad++; }
            }
            log.push("built " + C.numLayers + " layers, expressions " + exprs + ", problems " + bad);
        }
        if (step === "reapply") {
            // an own text off centre: look after look on the same layer; the box centre must stay, old look parts must go
            desel(C);
            var T = C.layers.addText("Hello World Test"); T.name = "WR_re";
            var d = T.property("ADBE Text Properties").property("ADBE Text Document").value; d.fontSize = 60; d.font = "ArialMT"; T.property("ADBE Text Properties").property("ADBE Text Document").setValue(d);
            T.property("ADBE Transform Group").property("ADBE Position").setValue([1500, 980]);
            var cen = function () { var rr = T.sourceRectAtTime(3, false), p = T.property("ADBE Transform Group").property("ADBE Position").value, a = T.property("ADBE Transform Group").property("ADBE Anchor Point").value; return [Math.round((p[0] - a[0] + rr.left + rr.width / 2) * 10) / 10, Math.round((p[1] - a[1] + rr.top + rr.height / 2) * 10) / 10]; };
            var c0 = cen(), cases = [{ id: "cp05" }, { id: "cp09", anim: "bounce" }, { id: "cp03", what: "style" }, { id: "cp18", what: "anim", anim: "middle" }, { id: "cp29" }, { id: "cp01", font: false }];
            log.push("reapply start centre " + J(c0));
            for (i = 0; i < cases.length; i++) {
                desel(C); T.selected = true; C.time = 1;
                var a = cases[i]; a._comp = C; a.mode = "both"; a.inDur = 0.8; a.outDur = 0.6;
                try {
                    UK.api.caption(a);
                    var E2 = errs(T), td2 = T.property("ADBE Text Properties").property("ADBE Text Document").value;
                    log.push("  " + a.id + " " + (a.what || "both") + " " + (a.anim || "") + " | centre " + J(cen()) + " | font " + td2.font + " | fx: " + names(T.property("ADBE Effect Parade")) + " | anim: " + names(T.property("ADBE Text Properties").property("ADBE Text Animators")) + (E2.bad.length ? " | EXPR " + E2.bad.join(" ; ") : " | expr ok " + E2.n));
                } catch (e2) { log.push("  " + a.id + " ERROR " + e2.message + " line " + e2.line); }
            }
        }
        if (step === "check") { var tb = 0, tn = 0; for (q = 1; q <= C.numLayers; q++) { var Ec = errs(C.layer(q)); tn += Ec.n; tb += Ec.bad.length; if (Ec.bad.length) log.push("CHECK " + Ec.bad.join(" ; ")); } log.push("check after render: expressions " + tn + ", problems " + tb + ", layers " + C.numLayers); }
        if (step === "remove") { for (q = C.numLayers; q >= 1; q--) C.layer(q).remove(); log.push("emptied WR_cap"); }
        if (step === "rebuild") {
            var LK2 = UK_CAP.LOOKS, cols2 = 7, bad2 = 0;
            for (i = 0; i < LK2.length; i++) {
                desel(C); C.time = 0;
                try {
                    UK.api.caption({ _comp: C, id: LK2[i].id, mode: "both", inDur: 0.8, outDur: 0.6, hold: 2 });
                    var Lr = C.layer(1), sc = Math.min(30, 250 / Math.max(1, Lr.sourceRectAtTime(1.6, false).width) * 100);
                    Lr.property("ADBE Transform Group").property("ADBE Scale").setValue([sc, sc]);
                    Lr.property("ADBE Transform Group").property("ADBE Position").setValue([140 + (i % cols2) * 272, 110 + Math.floor(i / cols2) * 172]);
                } catch (e3) { log.push(LK2[i].id + " BUILD ERROR " + e3.message + " line " + e3.line); bad2++; }
            }
            log.push("rebuilt " + C.numLayers + " layers, build errors " + bad2);
        }
        if (step === "render") { C.saveFrameToPng(Math.round($.global.CAP_T / C.frameDuration) * C.frameDuration, new File(OUT + "hlref/cap_" + $.global.CAP_TAG + ".png")); log.push("render " + $.global.CAP_TAG + " t " + $.global.CAP_T); }
        if (step === "log") {
            var bf = $.global.CAP_BEFORE, cfo = new File(OUT + "sb_created.txt"), m = 0; cfo.open("a");
            for (q = 1; q <= app.project.numItems; q++) if (!bf[app.project.item(q).id]) { cfo.writeln(app.project.item(q).id + "|" + app.project.item(q).name); m++; }
            cfo.close(); log.push("logged " + m);
        }
    } catch (e) { log.push("ERROR " + e.message + " line " + e.line); }
    var o = new File(OUT + "cap_log.txt"); o.encoding = "UTF-8"; o.open("a"); o.writeln(log.join("\n")); o.close();
})();
