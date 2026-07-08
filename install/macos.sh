#!/bin/bash
set -euo pipefail

if ! command -v brew &>/dev/null; then
    echo "Homebrew not found. Install from https://brew.sh"
    exit 1
fi

export HOMEBREW_NO_REQUIRE_TAP_TRUST=1

echo "[*] Installing CyberSec Toolkit on macOS..."

brew install \
    nmap \
    sqlmap \
    nikto \
    gobuster \
    wfuzz \
    whatweb \
    hashcat \
    john \
    hydra \
    aircrack-ng \
    bettercap

brew install --cask burp-suite zap

pip3 install --break-system-packages --user impacket

if [ ! -d /opt/Responder ]; then
    sudo git clone https://github.com/lgandx/Responder /opt/Responder
    sudo ln -sf /opt/Responder/Responder.py /usr/local/bin/responder
fi

echo "[*] Adding Python user scripts to PATH..."
SHELL_RC="$HOME/.zshrc"
grep -q 'Python/3.14/bin' "$SHELL_RC" 2>/dev/null || \
    echo 'export PATH="$PATH:$HOME/Library/Python/3.14/bin"' >> "$SHELL_RC"

echo "[*] Done. Open a new terminal or source your shell rc."
