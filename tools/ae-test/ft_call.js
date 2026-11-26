// Runs in the panel (through cdp.ps1, eval of this file): the Apply call the panel makes, the same way (UK.call by evalScript), with the JSON the test page saved. Answer in window.__ftAnswer.
(function () {
    var path = "D:/Projects/Codex/tools/ae-test/out/hlref/ft_apply.json", r = window.cep.fs.readFile(path);
    if (r.err) { window.__ftAnswer = "cannot read " + r.err; return; }
    var t0 = Date.now();
    window.__ftAnswer = "waiting";
    window.__adobe_cep__.evalScript("UK.call(" + JSON.stringify("ftApply") + "," + JSON.stringify(r.data) + ")", function (res) { window.__ftAnswer = (Date.now() - t0) + " ms, payload " + r.data.length + " chars: " + res; });
})();
