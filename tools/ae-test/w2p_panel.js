// Panel side of the Word to Path test (eval'd through cdp): step 1 in AE (t_w2p_make.jsx), the centre lines here,
// step 3 (UK.api.w2pBuild) in AE, then a report of the new layers (names, points, stroke widths) and a frame.
(function () {
    var ev = function (s) { return new Promise(function (res) { window.__adobe_cep__.evalScript(s, res); }); };
    return ev("$.evalFile(new File('D:/Projects/Codex/tools/ae-test/t_w2p_make.jsx')); $.global.W2P_TEST").then(function (txt) {
        var r = JSON.parse(txt), items = r.items, info = [];
        items.forEach(function (it) { it.pieces.forEach(function (pc) { pc.comps = UKCenter.piece(pc); info.push(pc.name + ":" + pc.comps.map(function (c) { return c.paths.map(function (p) { return p.v.length; }).join("+") + " w" + Math.round(c.width); }).join(",")); delete pc.paths; }); });
        var arg = JSON.stringify(JSON.stringify({ comp: r.comp, items: items }));
        return ev("var __r = UK.call('w2pBuild', " + arg + "); var __c = null; for (var i = 1; i <= app.project.numItems; i++) if (app.project.item(i).id === " + r.comp + ") __c = app.project.item(i); var __s = []; for (var j = 1; j <= __c.numLayers; j++) { var L = __c.layer(j), w = ''; try { var g = L.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group'); for (var k = 1; k <= g.numProperties; k++) if (g.property(k).matchName === 'ADBE Vector Graphic - Stroke') w += ' sw ' + Math.round(g.property(k).property('ADBE Vector Stroke Width').value) + ' col ' + g.property(k).property('ADBE Vector Stroke Color').value.join(',').replace(/(\\.\\d\\d)\\d+/g, '$1'); } catch (e) {} __s.push(L.name + (L.enabled ? '' : ' (off)') + ' anchor ' + L.property('ADBE Transform Group').property('ADBE Anchor Point').value.join(',').replace(/(\\.\\d)\\d+/g, '$1') + w); } __c.saveFrameToPng(1, new File('D:/Projects/Codex/tools/ae-test/out/w2p_frame.png')); __r + ' || ' + __s.join(' | ')").then(function (b) { return info.join("  ") + " ##AE## " + b; });
    });
})();
