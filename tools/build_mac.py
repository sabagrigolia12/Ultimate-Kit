#!/usr/bin/env python3
"""Builds export/UltimateKit-mac.zip: the folder 'Ultimate Kit UDT' = a small UXP plugin (tools/mac/udt) that the UXP Developer Tool
loads into Premiere Pro (Add Plugin > its manifest.json > Load); its Install button copies the After Effects panel from payload/ into the
user's CEP extensions folder. Next to it Install.command (Terminal way: bash Install.command, runs payload/install.sh) and a README.
(The old 'Ultimate Kit Installer.app' is no longer built: macOS 26 refuses to open it.) Runs on Windows: the Unix permissions are written into the zip, so the script stays executable when macOS unpacks it.
The Windows-only helper (UltimateKit/bin) stays out. Prints what it checked; exits with an error if anything is wrong."""
import hashlib, json, os, stat, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLUGIN, MAC, OUT = os.path.join(ROOT, "UltimateKit"), os.path.join(ROOT, "tools", "mac"), os.path.join(ROOT, "export", "UltimateKit-mac.zip")
TOP = "UltimateKit-mac/"
UDT = TOP + "Ultimate Kit UDT/"
PAY = UDT + "payload/"
SKIP_DIRS, SKIP_FILES = {"bin"}, {".debug", "Thumbs.db", "desktop.ini", ".DS_Store"}
FIXED = (2026, 11, 18, 12, 0, 0)


def add(z, name, data, mode):
    i = zipfile.ZipInfo(name, FIXED)
    i.create_system = 3                                    # Unix: macOS reads the mode from here
    i.external_attr = (mode & 0xFFFF) << 16
    if name.endswith("/"):
        i.external_attr |= 0x10                            # (the DOS directory bit)
        z.writestr(i, b"")
    else:
        i.compress_type = zipfile.ZIP_DEFLATED
        z.writestr(i, data, compresslevel=9)


def lf(path):
    with open(path, "rb") as f:
        return f.read().replace(b"\r\n", b"\n")


def plugin_files():
    res = []
    for d, sub, files in os.walk(PLUGIN):
        sub[:] = sorted(s for s in sub if s not in SKIP_DIRS and not s.startswith("."))
        for n in sorted(files):
            if n in SKIP_FILES or n.startswith("."):
                continue
            p = os.path.join(d, n)
            res.append((os.path.relpath(p, PLUGIN).replace(os.sep, "/"), p))
    return res


def build():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    made = set()
    with zipfile.ZipFile(OUT, "w") as z:
        def dirs(path):
            parts = path.split("/")[:-1]
            for k in range(1, len(parts) + 1):
                d = "/".join(parts[:k]) + "/"
                if d not in made:
                    made.add(d)
                    add(z, d, b"", stat.S_IFDIR | 0o755)
        def put(name, data, mode=0o644):
            dirs(name)
            add(z, name, data, stat.S_IFREG | mode)
        put(TOP + "README.txt", lf(os.path.join(MAC, "README.txt")))
        put(TOP + "Install.command", lf(os.path.join(MAC, "Install.command")), 0o755)     # run as: bash Install.command
        for n in ("manifest.json", "index.html", "index.js"):
            put(UDT + n, lf(os.path.join(MAC, "udt", n)))
        for n in sorted(os.listdir(os.path.join(MAC, "udt", "icons"))):
            with open(os.path.join(MAC, "udt", "icons", n), "rb") as f:
                put(UDT + "icons/" + n, f.read())
        put(PAY + "install.sh", lf(os.path.join(MAC, "installer")), 0o755)
        with open(os.path.join(MAC, "AppIcon.icns"), "rb") as f:
            put(PAY + "AppIcon.icns", f.read())
        for rel, p in plugin_files():
            with open(p, "rb") as f:
                put(PAY + "com.ultimatekit.panel/" + rel, f.read())


def check():
    bad = []
    with zipfile.ZipFile(OUT) as z:
        if z.testzip():
            bad.append("corrupt entry " + z.testzip())
        names = {i.filename: i for i in z.infolist()}
        if any(i.create_system != 3 for i in names.values()):
            bad.append("an entry is not marked Unix")
        script = names[PAY + "install.sh"]
        if stat.S_IMODE(script.external_attr >> 16) != 0o755:
            bad.append("install.sh is not executable")
        s = z.read(script)
        if not s.startswith(b"#!/bin/bash\n") or b"\r" in s or b'SRC="${UK_SRC:-' not in s:
            bad.append("install.sh: first line, line ends or UK_SRC are wrong")
        cmd = names.get(TOP + "Install.command")
        if cmd is None:
            bad.append("Install.command is missing")
        else:
            c = z.read(cmd)
            if stat.S_IMODE(cmd.external_attr >> 16) != 0o755 or not c.startswith(b"#!/bin/bash\n") or b"\r" in c:
                bad.append("Install.command: mode, first line or line ends are wrong")
            if b'UDT="$DIR/Ultimate Kit UDT"' not in c or b'RUN="$UDT/payload/install.sh"' not in c or b'UK_SRC="$UDT/payload/com.ultimatekit.panel"' not in c:
                bad.append("Install.command does not point at the UDT folder")
        m = json.loads(z.read(UDT + "manifest.json"))
        if m.get("manifestVersion") != 5 or m.get("main") != "index.html" or m.get("requiredPermissions", {}).get("localFileSystem") != "fullAccess":
            bad.append("manifest.json: version / main / fullAccess")
        if not any(h.get("app") == "premierepro" for h in m.get("host", [])):
            bad.append("manifest.json: no premierepro host")
        for ic in m.get("icons", []) + [i for e in m.get("entrypoints", []) for i in e.get("icons", [])]:
            for sc in ic.get("scale", [1]):
                q = ic["path"] if sc == 1 else ic["path"].replace(".png", "@%dx.png" % sc)
                if UDT + q not in names:
                    bad.append("icon missing: " + q)
        if b'src="index.js"' not in z.read(UDT + "index.html") or b'"com.ultimatekit.panel"' not in z.read(UDT + "index.js"):
            bad.append("index.html / index.js")
        prefix = PAY + "com.ultimatekit.panel/"
        same = 0
        for rel, p in plugin_files():
            with open(p, "rb") as f:
                if prefix + rel not in names or hashlib.sha256(z.read(prefix + rel)).digest() != hashlib.sha256(f.read()).digest():
                    bad.append("differs: " + rel)
                else:
                    same += 1
        extra = [n for n in names if n.startswith(prefix) and any(x in n for x in ("/bin/", ".exe", ".ps1", ".debug"))]
        if extra:
            bad.append("Windows files inside: " + ", ".join(extra))
        for need in ("CSXS/manifest.xml", "index.html", "jsx/host.jsx", "jsx/filltrim.jsx", "js/filltrim.js", "js/trace.js", "assets/saasbg/saasbg.aep", "lib/depth/depth_anything_v2_small_q8.onnx"):
            if prefix + need not in names:
                bad.append("missing: " + need)
        print("entries", len(names), "| plugin files identical to the source", same, "| zip MB", round(os.path.getsize(OUT) / 1048576, 1))
    return bad


if __name__ == "__main__":
    build()
    problems = check()
    for p in problems:
        print("PROBLEM:", p)
    print("OK" if not problems else "FAILED", OUT)
    sys.exit(1 if problems else 0)
