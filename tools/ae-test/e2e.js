(async function () {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const host = s => new Promise(r => window.__adobe_cep__.evalScript(s, r));
  const out = [];
  await host("app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES); app.newProject(); 'ok'");
  await sleep(800);
  await host("var c = app.project.items.addComp('E2E Main', 1920, 1080, 1, 12, 30); var s = c.layers.addSolid([0.1,0.1,0.13], 'BG', 1920, 1080, 1); c.openInViewer(); c.time = 3; 'ok'");
  await sleep(500);
  async function waitStatus() {
    for (let i = 0; i < 120; i++) { await sleep(250); const s = document.getElementById('status').textContent; if (s && s !== 'Working...' && !/^(Reading|Tracing|Swapping|Importing)/.test(s)) return s; }
    return 'TIMEOUT: ' + document.getElementById('status').textContent;
  }
  async function openCat(name) {
    document.getElementById('btnBack').click(); await sleep(150);
    const t = [...document.querySelectorAll('.tile')].find(x => x.querySelector('.nm').textContent === name);
    t.click(); await sleep(400);
  }
  async function applyPreset(cat, idx) {
    await openCat(cat);
    const tiles = document.querySelectorAll('.preset');
    if (idx !== undefined) { tiles[idx].click(); await sleep(100); }
    document.getElementById('status').textContent = '';
    document.getElementById('btnApply').click();
    const s = await waitStatus();
    out.push(cat + (idx !== undefined ? ' #' + (idx + 1) : '') + ' -> ' + s);
  }
  await host("app.project.activeItem.time = 3; for (var i = 1; i <= app.project.activeItem.numLayers; i++) app.project.activeItem.layer(i).selected = false; 'ok'");
  await applyPreset('Transitions', 6);
  await applyPreset('SaaS Transitions', 0);
  await host("var c = app.project.activeItem; for (var i = 1; i <= c.numLayers; i++) c.layer(i).selected = false; 'ok'");
  await applyPreset('SaaS Text', 0);
  await host("var c = app.project.activeItem; for (var i = 1; i <= c.numLayers; i++) c.layer(i).selected = false; 'ok'");
  await applyPreset('Text', 3);
  await applyPreset('Halftone BG', 0);
  await applyPreset('Gradient BG', 14);
  await applyPreset('3D Icons', 0);
  // depth reveal on the gradient background layer
  await host("var c = app.project.activeItem; for (var i = 1; i <= c.numLayers; i++) c.layer(i).selected = (c.layer(i).name.indexOf('BG Gradient') === 0); 'ok'");
  await applyPreset('SaaS Transitions', 11);
  // glass with nothing selected
  await host("var c = app.project.activeItem; for (var i = 1; i <= c.numLayers; i++) c.layer(i).selected = false; 'ok'");
  await applyPreset('Glass');
  // bounce: select the glass panel, add scale keys first
  await host("var c = app.project.activeItem; var P = null; for (var i = 1; i <= c.numLayers; i++) { c.layer(i).selected = false; if (c.layer(i).name === 'Glass Panel') P = c.layer(i); } P.transform.scale.setValueAtTime(1, [0,0]); P.transform.scale.setValueAtTime(1.6, [100,100]); P.selected = true; 'ok'");
  await applyPreset('Bounce');
  // SVG import through the parser (simulate a file read)
  await openCat('SVG Import');
  out.push('pages ok');
  const comps = await host("var n=[]; for (var i=1;i<=app.project.numItems;i++){ var it=app.project.item(i); if (it instanceof CompItem) n.push(it.name); } n.join(' | ')");
  out.push('comps: ' + comps);
  const layers = await host("var c = app.project.activeItem; var n=[]; for (var i=1;i<=c.numLayers;i++) n.push(c.layer(i).name); n.join(' | ')");
  out.push('main layers: ' + layers);
  return out.join('\n');
})()
