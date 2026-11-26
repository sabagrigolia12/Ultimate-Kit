#!/bin/bash
# Ultimate Kit for After Effects 2024+ (macOS installer)
cd "$(dirname "$0")"
SRC="$(pwd)/UltimateKit"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.ultimatekit.panel"
if [ ! -f "$SRC/CSXS/manifest.xml" ]; then echo "Could not find the UltimateKit folder next to this installer."; exit 1; fi
echo "Allowing unsigned extensions (PlayerDebugMode)..."
for v in 9 10 11 12 13 14 15 16; do defaults write com.adobe.CSXS.$v PlayerDebugMode 1; done
echo "Copying the panel to: $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/" "$DEST/"
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null
echo ""
echo "Done. Restart After Effects, then open Window > Extensions > Ultimate Kit."
