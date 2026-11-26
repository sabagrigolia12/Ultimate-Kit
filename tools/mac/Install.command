#!/bin/bash
# Ultimate Kit - install through Terminal:  bash <this file>
# (the other way, without Terminal: the UXP Developer Tool, see README.txt)
# macOS 15 / 26 block a downloaded script or app that has no paid Apple Developer signature ("Not Opened",
# "Move to Trash"), but they do not block a script that bash reads. This runs the installer script that sits in the
# "Ultimate Kit UDT" folder with the plugin files next to it: the same Install / Uninstall window.
DIR="$(cd "$(dirname "$0")" && pwd)"
UDT="$DIR/Ultimate Kit UDT"
RUN="$UDT/payload/install.sh"
if [ ! -f "$RUN" ] || [ ! -f "$UDT/payload/com.ultimatekit.panel/CSXS/manifest.xml" ]; then
    echo ""
    echo "  \"Ultimate Kit UDT\" საქაღალდე ვერ მოიძებნა ამ ფაილის გვერდით:"
    echo "  $DIR"
    echo "  გახსენი zip თავიდან და Install.command იმ საქაღალდიდან გაუშვი."
    echo ""
    exit 1
fi
xattr -dr com.apple.quarantine "$DIR" 2>/dev/null
echo "Ultimate Kit: ინსტალერი იხსნება..."
UK_SRC="$UDT/payload/com.ultimatekit.panel" UK_ICON="$UDT/payload/AppIcon.icns" exec /bin/bash "$RUN"
