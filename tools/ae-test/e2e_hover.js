(async function () {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const host = s => new Promise(r => window.__adobe_cep__.evalScript(s, r));
  const out = [];
  await host("app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES); app.newProject(); 'ok'");
  await sleep(1000);
  await host([
    "var c = app.project.items.addComp('UI Hover', 1920, 1080, 1, 8, 30); c.openInViewer();",
    "c.layers.addSolid([0.07,0.07,0.1], 'BG', 1920, 1080, 1);",
    "var names = []; for (var i = 0; i < 3; i++) { var L = c.layers.addShape(); L.name = 'Card ' + (i+1); var g = L.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group'); g.property('ADBE Vectors Group').addProperty('ADBE Vector Shape - Rect').property('ADBE Vector Rect Size').setValue([360, 220]); L.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group').addProperty('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color').setValue([0.2,0.2,0.24,1]); L.transform.position.setValue([460 + i * 500, 540]); }",
    "var A = c.layers.addShape(); A.name = 'Mouse'; var ag = A.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group'); var sh = new Shape(); sh.vertices = [[0,0],[0,46],[12,35],[21,54],[29,50],[20,32],[36,32]]; sh.closed = true; ag.property('ADBE Vectors Group').addProperty('ADBE Vector Shape - Group').property('ADBE Vector Shape').setValue(sh); A.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group').addProperty('ADBE Vector Graphic - Fill');",
    "A.transform.anchorPoint.setValue([0,0]); A.transform.position.setValueAtTime(0, [200, 900]); A.transform.position.setValueAtTime(1.5, [960, 560]);",
    "for (var k = 1; k <= c.numLayers; k++) c.layer(k).selected = (c.layer(k).name.indexOf('Card') === 0); c.time = 1; 'ok'"
  ].join("\n"));
  await sleep(300);
  // open Hover & Cursor page
  document.getElementById('btnBack').click(); await sleep(150);
  [...document.querySelectorAll('.tile')].find(x => x.querySelector('.nm').textContent === 'Hover & Cursor').click();
  await sleep(500);
  const waitStatus = async () => { for (let i = 0; i < 120; i++) { await sleep(250); const s = document.getElementById('status').textContent; if (s && s !== 'Working...') return s; } return 'TIMEOUT'; };
  // gradient fill + stroke
  const segs = document.querySelectorAll('.fold')[0].querySelectorAll('.seg button');
  segs[2].click(); await sleep(50);
  document.querySelectorAll('.fold')[0].querySelector('.toggle').click(); await sleep(50);
  document.getElementById('status').textContent = '';
  [...document.querySelectorAll('button')].find(b => b.textContent === 'Make Layers Hover').click();
  out.push('Make Layers Hover -> ' + await waitStatus());
  // choose cursor from dropdown
  document.querySelector('.dd > button').click(); await sleep(900);
  const items = [...document.querySelectorAll('.dd .menu div')].map(d => d.textContent);
  out.push('dropdown: ' + items.join(', '));
  const m = [...document.querySelectorAll('.dd .menu div')].find(d => d.textContent.indexOf('Mouse') >= 0);
  m.click(); await sleep(100);
  [...document.querySelectorAll('.fxitem')].find(x => x.textContent.indexOf('Dot Matrix') === 0).click();
  document.getElementById('status').textContent = '';
  [...document.querySelectorAll('button')].find(b => b.textContent === 'Make Cursor').click();
  out.push('Make Cursor -> ' + await waitStatus());
  document.getElementById('status').textContent = '';
  [...document.querySelectorAll('button')].find(b => b.textContent.indexOf('Re-link') === 0).click();
  out.push('Re-link -> ' + await waitStatus());
  out.push('layers: ' + await host("var c = app.project.activeItem; var n=[]; for (var i=1;i<=c.numLayers;i++) n.push(c.layer(i).name + (c.layer(i).enabled ? '' : ' (off)')); n.join(' | ')"));
  out.push('hover at 1.6s: ' + await host("var g=null; for (var i=1;i<=app.project.numItems;i++) if (app.project.item(i).name==='Hover Group') g=app.project.item(i); var s=''; for (var k=1;k<=g.numLayers;k++){ var L=g.layer(k); try { s += L.name + '=' + Math.round(L.effect('UK Hover')(1).valueAtTime(1.6,false)) + ' '; } catch(e){} } s"));
  return out.join('\n');
})()
