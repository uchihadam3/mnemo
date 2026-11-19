#!/usr/bin/env bash
# Gera o instalador do Windows a partir do Linux (sem Wine): precisa de `makensis` (apt install nsis)
set -e
cd "$(dirname "$0")/.."
rm -rf dist/win-unpacked
npx electron-builder --win dir
node build/seticon.mjs dist/win-unpacked/MNEMO.exe assets/icon.ico
(cd build && makensis -V2 installer.nsi)
ls -la dist/*.exe
