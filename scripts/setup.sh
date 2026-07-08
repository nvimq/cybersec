#!/bin/bash
# CyberSec Toolkit — автоматическая установка всех инструментов

set -e

echo "[*] Установка CyberSec Toolkit..."
echo ""

# Homebrew
if ! command -v brew &>/dev/null; then
    echo "[!] Homebrew не найден. Установите: https://brew.sh"
    exit 1
fi

export HOMEBREW_NO_REQUIRE_TAP_TRUST=1

BREW_TOOLS="hashcat john hydra aircrack-ng bettercap nmap sqlmap nikto gobuster"
BREW_CASK_TOOLS="burp-suite zap"

echo "[+] Установка brew-пакетов..."
brew install $BREW_TOOLS

echo "[+] Установка casks..."
brew install --cask $BREW_CASK_TOOLS

echo "[+] Установка Python-тулзов..."
pip3 install --break-system-packages --user impacket
pip3 install --break-system-packages --user wfuzz || {
    cd /tmp
    git clone https://github.com/xmendez/wfuzz.git
    cd wfuzz && python3 -m venv venv
    source venv/bin/activate && pip install .
    ln -sf "$(pwd)/venv/bin/wfuzz" /opt/homebrew/bin/wfuzz
}

echo "[+] Установка whatweb..."
cd /tmp
git clone https://github.com/urbanadventurer/WhatWeb.git
cp WhatWeb/whatweb /opt/homebrew/bin/
rm -rf /tmp/WhatWeb

echo "[+] Установка Responder..."
git clone https://github.com/lgandx/Responder /opt/homebrew/opt/responder 2>/dev/null || true

echo ""
echo "[✓] CyberSec Toolkit — установка завершена!"
