/*  Ultimate Kit Installer - a small UXP plugin for the UXP Developer Tool (Add Plugin > this manifest.json > Load,
    in Premiere Pro). Ultimate Kit itself is an After Effects panel of the older CEP kind (payload/com.ultimatekit.panel),
    which UDT cannot load into After Effects. This panel puts it where After Effects looks for such panels:
      macOS    ~/Library/Application Support/Adobe/CEP/extensions/com.ultimatekit.panel
      Windows  %APPDATA%/Adobe/CEP/extensions/com.ultimatekit.panel
    and on macOS turns on CEP's PlayerDebugMode (After Effects only opens panels from outside Adobe Exchange with it)
    by writing the preference files ~/Library/Preferences/com.adobe.CSXS.<n>.plist, keeping what else they hold.
    Nothing is executed (no Terminal, no app), so macOS Gatekeeper has nothing to block.                             */
const ID = "com.ultimatekit.panel";
const CSXS = [9, 10, 11, 12, 13, 14, 15, 16];
let uxp = null, lfs = null, formats = null, os = null;

const T = {
    busy: "ინსტალაცია მიმდინარეობს...",
    files: function (n, all) { return "ფაილები: " + n + " / " + all; },
    done: "Ultimate Kit დაინსტალირდა!",
    open: "გახსენი After Effects -> Window -> Extensions -> Ultimate Kit",
    reopen: "თუ After Effects ღიაა, დახურე და თავიდან გახსენი.",
    restart: "ერთი რამ კიდევ: ეს Mac ერთხელ გადატვირთე (Restart), რომ macOS-მა ახალი პარამეტრი წაიკითხოს. მერე გახსენი After Effects -> Window -> Extensions -> Ultimate Kit",
    scripts: "After Effects-ში ერთხელ ჩართე: Settings -> Scripting & Expressions -> Allow Scripts to Write Files and Access Network",
    winDebug: "Windows: თუ პანელი არ გამოჩნდა, Windows-ის ინსტალერი გამოიყენე (PlayerDebugMode რეესტრშია და აქედან ვერ ჩაირთვება).",
    removed: "Ultimate Kit წაიშალა. თუ After Effects ღიაა, დახურე და თავიდან გახსენი.",
    notThere: "Ultimate Kit დაინსტალირებული არ არის.",
    noPayload: "პლაგინის ფაილები ვერ მოიძებნა (payload/com.ultimatekit.panel). გახსენი zip თავიდან და UDT-ში ეს manifest.json დაამატე.",
    failed: "ვერ მოხერხდა: "
};

function el(id) { return document.getElementById(id); }
function say(msg, kind) { const s = el("status"); if (!s) return; s.textContent = msg; s.className = kind || ""; }
function where(msg) { const w = el("where"); if (w) w.textContent = msg; }
function lock(on) { ["install", "uninstall"].forEach(function (id) { const b = el(id); if (b) { if (on) b.setAttribute("disabled", ""); else b.removeAttribute("disabled"); } }); }

/* ---------------------------------------------------------------- places */
function isMacPath(p) { return String(p).charAt(0) === "/"; }
async function homeDir() {
    try { const h = os && os.homedir ? os.homedir() : ""; if (h) return String(h).replace(/[\\/]+$/, ""); } catch (e) { }
    const p = String((await lfs.getDataFolder()).nativePath);           // .../Library/... (macOS) or ...\AppData\... (Windows)
    let i = p.indexOf("/Library/");
    if (isMacPath(p) && i > 0) return p.slice(0, i);
    i = p.search(/[\\/]AppData[\\/]/i);
    if (i > 0) return p.slice(0, i);
    throw new Error("home folder? " + p);
}
function toUrl(p) { p = String(p).replace(/\\/g, "/"); return "file:" + (p.charAt(0) === "/" ? "" : "/") + p; }
async function entryAt(p) {
    const tries = [toUrl(p), encodeURI(toUrl(p))];
    for (let k = 0; k < tries.length; k++) { try { const e = await lfs.getEntryWithUrl(tries[k]); if (e) return e; } catch (e) { } }
    return null;
}
async function child(folder, name) { try { return await folder.getEntry(name); } catch (e) { return null; } }
async function folderIn(folder, name) {
    const e = await child(folder, name);
    if (e && e.isFolder) return e;
    return await folder.createFolder(name);
}
/* the extensions folder (made when missing) */
async function extFolder(home, mac) {
    const base = mac ? home + "/Library/Application Support" : home + "\\AppData\\Roaming";
    let f = await entryAt(base);
    if (!f) throw new Error("folder not found: " + base);
    const parts = ["Adobe", "CEP", "extensions"];
    for (let k = 0; k < parts.length; k++) f = await folderIn(f, parts[k]);
    return f;
}

/* ---------------------------------------------------------------- files */
async function countFiles(folder) {
    let n = 0;
    const list = await folder.getEntries();
    for (let k = 0; k < list.length; k++) {
        if (list[k].name === ".DS_Store") continue;
        n += list[k].isFolder ? await countFiles(list[k]) : 1;
    }
    return n;
}
async function removeTree(e) {
    if (e.isFolder) { const list = await e.getEntries(); for (let k = 0; k < list.length; k++) await removeTree(list[k]); }
    await e.delete();
}
async function copyTree(src, dstParent, name, prog) {
    const d = await dstParent.createFolder(name);
    const list = await src.getEntries();
    for (let k = 0; k < list.length; k++) {
        const e = list[k];
        if (e.name === ".DS_Store") continue;
        if (e.isFolder) { await copyTree(e, d, e.name, prog); continue; }
        const data = await e.read({ format: formats.binary });
        const f = await d.createFile(e.name, { overwrite: true });
        await f.write(data, { format: formats.binary });
        prog.n++;
        if (prog.n % 5 === 0 || prog.n === prog.all) say(T.busy + "\n" + T.files(prog.n, prog.all));
    }
    return d;
}

/* ---------------------------------------------------------------- plist (PlayerDebugMode) */
/* a property list's top dictionary of simple values (binary "bplist00" or XML); unknown kinds are skipped */
function readPlist(u8) {
    const head = String.fromCharCode.apply(null, Array.prototype.slice.call(u8, 0, 8));
    if (head === "bplist00") return readBinary(u8);
    const s = utf8(u8), out = {};
    const re = /<key>([^<]*)<\/key>\s*(<string>([^<]*)<\/string>|<integer>([^<]*)<\/integer>|<real>([^<]*)<\/real>|<(true|false)\s*\/>)/g;
    let m;
    while ((m = re.exec(s))) {
        if (m[3] !== undefined) out[m[1]] = m[3];
        else if (m[4] !== undefined) out[m[1]] = parseInt(m[4], 10);
        else if (m[5] !== undefined) out[m[1]] = parseFloat(m[5]);
        else out[m[1]] = m[6] === "true";
    }
    return out;
}
function utf8(u8) {
    let p = "";
    for (let k = 0; k < u8.length; k++) p += (u8[k] < 16 ? "%0" : "%") + u8[k].toString(16);
    try { return decodeURIComponent(p); } catch (e) { let s = ""; for (let k = 0; k < u8.length; k++) s += String.fromCharCode(u8[k]); return s; }
}
function readBinary(u8) {
    const n = u8.length, uint = function (o, len) { let v = 0; for (let k = 0; k < len; k++) v = v * 256 + u8[o + k]; return v; };
    const offSize = u8[n - 26], refSize = u8[n - 25], count = uint(n - 24, 8), top = uint(n - 16, 8), table = uint(n - 8, 8);
    const at = function (i) { return uint(table + i * offSize, offSize); };
    const len = function (o) {                                    // length + where the data starts
        const low = u8[o] & 15;
        if (low !== 15) return [low, o + 1];
        const p = 1 << (u8[o + 1] & 15);
        return [uint(o + 2, p), o + 2 + p];
    };
    const obj = function (i, depth) {
        if (i >= count || depth > 2) return undefined;
        const o = at(i), m = u8[o], kind = m >> 4;
        if (m === 8) return false;
        if (m === 9) return true;
        if (kind === 1) return uint(o + 1, 1 << (m & 15));
        if (kind === 5) { const L = len(o); let s = ""; for (let k = 0; k < L[0]; k++) s += String.fromCharCode(u8[L[1] + k]); return s; }
        if (kind === 6) { const L = len(o); let s = ""; for (let k = 0; k < L[0]; k++) s += String.fromCharCode(u8[L[1] + 2 * k] * 256 + u8[L[1] + 2 * k + 1]); return s; }
        if (kind === 13) {
            const L = len(o), d = {};
            for (let k = 0; k < L[0]; k++) {
                const key = obj(uint(L[1] + k * refSize, refSize), depth + 1), val = obj(uint(L[1] + (L[0] + k) * refSize, refSize), depth + 1);
                if (typeof key === "string" && val !== undefined && typeof val !== "object") d[key] = val;
            }
            return d;
        }
        return undefined;
    };
    const d = obj(top, 0);
    return (d && typeof d === "object") ? d : {};
}
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function writePlist(d) {
    let x = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n';
    Object.keys(d).forEach(function (k) {
        const v = d[k];
        x += "\t<key>" + esc(k) + "</key>\n";
        if (typeof v === "boolean") x += "\t<" + v + "/>\n";
        else if (typeof v === "number") x += (Math.round(v) === v ? "\t<integer>" + v + "</integer>\n" : "\t<real>" + v + "</real>\n");
        else x += "\t<string>" + esc(v) + "</string>\n";
    });
    return x + "</dict>\n</plist>\n";
}
function debugOn(v) { return v === "1" || v === 1 || v === true; }
/* -> { already: [versions that had it], set: [versions written] } */
async function debugMode(home) {
    const prefs = await entryAt(home + "/Library/Preferences"), r = { already: [], set: [] };
    if (!prefs) throw new Error("folder not found: ~/Library/Preferences");
    for (let k = 0; k < CSXS.length; k++) {
        const name = "com.adobe.CSXS." + CSXS[k] + ".plist";
        let d = {};
        const e = await child(prefs, name);
        if (e && e.isFile) { try { d = readPlist(new Uint8Array(await e.read({ format: formats.binary }))); } catch (x) { d = {}; } }
        if (debugOn(d.PlayerDebugMode)) { r.already.push(CSXS[k]); continue; }
        d.PlayerDebugMode = "1";
        const f = await prefs.createFile(name, { overwrite: true });
        await f.write(writePlist(d), { format: formats.utf8 });
        r.set.push(CSXS[k]);
    }
    return r;
}

/* ---------------------------------------------------------------- actions */
async function install() {
    lock(true);
    try {
        say(T.busy);
        const plug = await lfs.getPluginFolder(), payload = await child(plug, "payload");
        const src = payload ? await child(payload, ID) : null;
        if (!src || !src.isFolder || !(await child(src, "CSXS"))) throw new Error(T.noPayload);
        const home = await homeDir(), mac = isMacPath(home), ext = await extFolder(home, mac);
        where(ext.nativePath + "/" + ID);
        const old = await child(ext, ID);
        if (old) await removeTree(old);
        const prog = { n: 0, all: await countFiles(src) };
        const dst = await copyTree(src, ext, ID, prog);
        const got = await countFiles(dst);
        if (got !== prog.all || !(await child(await child(dst, "CSXS"), "manifest.xml"))) throw new Error("copied " + got + " of " + prog.all + " files");
        let msg = T.done + "\n\n";
        if (mac) {
            const dm = await debugMode(home);
            const fresh = dm.set.indexOf(11) >= 0 || dm.set.indexOf(12) >= 0;          // the versions of After Effects 2023-2026
            msg += fresh ? T.restart : T.reopen + "\n" + T.open;
        } else msg += T.reopen + "\n" + T.open + "\n\n" + T.winDebug;
        say(msg + "\n\n" + T.scripts, "ok");
    } catch (e) {
        say(T.failed + (e && e.message ? e.message : String(e)), "err");
    }
    lock(false);
}
async function uninstall() {
    lock(true);
    try {
        const home = await homeDir(), ext = await extFolder(home, isMacPath(home)), old = await child(ext, ID);
        if (!old) say(T.notThere);
        else { await removeTree(old); say(T.removed, "ok"); }
    } catch (e) { say(T.failed + (e && e.message ? e.message : String(e)), "err"); }
    lock(false);
}

function start() {
    try {
        uxp = require("uxp"); lfs = uxp.storage.localFileSystem; formats = uxp.storage.formats;
        try { os = require("os"); } catch (e0) { os = null; }
    } catch (e) { say(T.failed + "UXP: " + e.message, "err"); return; }
    el("install").addEventListener("click", install);
    el("uninstall").addEventListener("click", uninstall);
    homeDir().then(function (h) { where((isMacPath(h) ? h + "/Library/Application Support" : h + "\\AppData\\Roaming") + "/Adobe/CEP/extensions/" + ID); }).catch(function () { });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
/* (for the tests: node loads this file with a stand-in UXP) */
if (typeof module !== "undefined" && module.exports) module.exports = { readPlist: readPlist, writePlist: writePlist, install: install, uninstall: uninstall, debugMode: debugMode };
