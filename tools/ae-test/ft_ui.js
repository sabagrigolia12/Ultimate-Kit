// Runs in the real panel (through cdp.ps1, eval of this file): from the page it is on to Fill Trim, lets it read the selected layer (read only, no Apply, no Split), reports what it shows, saves the preview, then back to the page it was on. Answer in window.__ftUi.
(function () {
    window.__ftUi = "waiting";
    var back = document.getElementById("btnBack"), first = document.body.innerText.split("\n")[0];
    var tileOf = function (name) { return Array.prototype.filter.call(document.querySelectorAll(".tile"), function (t) { return t.title === name; })[0]; };
    var openIt = function () {
        var tile = tileOf("Fill Trim");
        if (!tile) { window.__ftUi = "no tile; tiles " + document.querySelectorAll(".tile").length; return; }
        tile.click();
        var tries = 0;
        var look = function () {
            var info = document.querySelector(".p2s-info"), st = document.querySelector(".status");
            if (++tries < 40 && info && !info.textContent && !(st && st.className.indexOf("err") >= 0)) { setTimeout(look, 300); return; }
            var rows = Array.prototype.map.call(document.querySelectorAll(".row .name"), function (n) { return n.textContent; });
            var btns = Array.prototype.map.call(document.querySelectorAll(".row .btn"), function (b) { return b.textContent; });
            var cv = document.querySelector("canvas.preview");
            setTimeout(function () {
                var ok = "";
                try { var url = cv.toDataURL("image/png"); var w = window.cep.fs.writeFile("D:/Projects/Codex/tools/ae-test/out/hlref/ft_ui.png", url.split(",")[1], window.cep.encoding.Base64); ok = "saved " + w.err; } catch (e) { ok = "not saved " + e.message; }
                window.__ftUi = JSON.stringify({ was: first, info: info && info.textContent, status: st && st.textContent, statusClass: st && st.className, rows: rows, buttons: btns, canvas: cv && [cv.width, cv.height], preview: ok });
                back.click();
                setTimeout(function () { var t = tileOf(first); if (t) t.click(); }, 200);
            }, 900);
        };
        setTimeout(look, 500);
    };
    if (back && !back.hidden && !tileOf("Fill Trim")) { back.click(); setTimeout(openIt, 300); } else openIt();
})();
