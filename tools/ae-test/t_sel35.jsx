(function () { var c = app.project.activeItem; for (var i = 1; i <= c.numLayers; i++) c.layer(i).selected = (i === 3 || i === 5 || i === 2); })();
