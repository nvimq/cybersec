#!/bin/bash
set -euo pipefail

DISTRO=""
if command -v apt-get &>/dev/null; then
    DISTRO="debian"
elif command -v pacman &>/dev/null; then
    DISTRO="arch"
elif command -v dnf &>/dev/null; then
    DISTRO="fedora"
else
    echo "Unsupported distro. Use the Dockerfile for a universal setup."
    exit 1
fi

echo "[*] Installing CyberSec Toolkit on Linux ($DISTRO)..."

case "$DISTRO" in
    debian)
        sudo apt-get update
        sudo apt-get install -y \
            nmap sqlmap metasploit-framework nikto gobuster wfuzz whatweb \
            hashcat john hydra aircrack-ng bettercap dirb \
            python3-pip python3-venv git curl wget
        ;;
    arch)
        sudo pacman -Sy --noconfirm \
            nmap sqlmap metasploit nikto gobuster wfuzz whatweb \
            hashcat john hydra aircrack-ng bettercap dirb \
            python-pip git curl wget
        ;;
    fedora)
        sudo dnf install -y \
            nmap sqlmap metasploit-framework nikto gobuster wfuzz whatweb \
            hashcat john hydra aircrack-ng bettercap dirb \
            python3-pip git curl wget
        ;;
esac

sudo pip3 install --break-system-packages impacket

if [ ! -d /opt/Responder ]; then
    sudo git clone https://github.com/lgandx/Responder /opt/Responder
    sudo ln -sf /opt/Responder/Responder.py /usr/local/bin/responder
fi

echo "[*] Done."
