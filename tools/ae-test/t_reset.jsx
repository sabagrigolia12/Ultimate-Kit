// Starts a new empty project for tests. Refuses if the open project is a saved file or has
// unsaved changes, so a real project is never closed by the test harness.
(function () {
    var p = app.project;
    var risky = (p.file !== null) || (p.dirty && p.numItems > 0 && !(p.item(1) && /^(CN_|CX_|HOST|H_|H3_|HV_|CK_|RV_|A_|E2E|BN_|UI Hover|ST_|GB_|Solids|Ultimate Kit)/.test(p.item(1).name)));
    if (risky) throw new Error("t_reset refused: a real project is open (" + (p.file ? p.file.fsName : "unsaved work") + "). Save/close it yourself first.");
    p.close(CloseOptions.DO_NOT_SAVE_CHANGES);
    app.newProject();
})();

