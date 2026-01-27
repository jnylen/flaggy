#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])" 2>/dev/null || echo "1.0.0")
XPI_NAME="flaggy-v${VERSION}.xpi"

echo "Building XPI..."
rm -f "$XPI_NAME"
zip -r "$XPI_NAME" manifest.json background.js popup.html popup.js popup.css icons/*.png flags/*.png

echo "XPI created: $XPI_NAME"

if [ -n "$AMO_API_KEY" ] && [ -n "$AMO_API_SECRET" ]; then
    echo "Signing with Mozilla Add-ons..."
    npx web-ext sign \
        --source-dir . \
        --api-key "$AMO_API_KEY" \
        --api-secret "$AMO_API_SECRET" \
        --artifacts-dir web-ext-artifacts \
        --ignore-files build.sh .github web-ext-artifacts
    echo "Signed XPI available in web-ext-artifacts/"
fi
