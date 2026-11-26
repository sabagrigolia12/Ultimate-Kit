var UK_ROOT = 'C:/Users/user/AppData/Roaming/Adobe/CEP/extensions/com.ultimatekit.panel'; $.evalFile(new File(UK_ROOT + '/jsx/host.jsx'));
var f = new File('D:/Projects/Codex/tools/ae-test/out/t_inst_out.txt'); f.open('w');
var c = app.project.items.addComp('Install Check', 1920, 1080, 1, 10, 30); c.openInViewer();
var r = UK.call('cinematic', UK.json({ id: 'cb19', fullComp: true }));
f.writeln('load=' + UK_LOAD_ERROR + '| ' + r);
var L = c.layer(1), fx = []; for (var i = 1; i <= L.property('ADBE Effect Parade').numProperties; i++) fx.push(L.property('ADBE Effect Parade').property(i).name);
f.writeln('effects: ' + fx.join(', ')); f.close();
c.saveFrameToPng(4, new File('D:/Projects/Codex/tools/ae-test/out/install_check.png'));
