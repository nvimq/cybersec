#!/bin/bash
set -euo pipefail

TARGET="${1:-}"
TYPE="${2:-all}"

if [ -z "$TARGET" ]; then
    echo "Usage: $0 <target> [type]"
    echo "  type: all, ports, web, dirs, vulns"
    exit 1
fi

OUTDIR="scan-$(echo "$TARGET" | tr -d '/' | tr ':' '-')-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTDIR"

echo "[*] Target: $TARGET"
echo "[*] Output: $OUTDIR/"
echo ""

if [ "$TYPE" = "all" ] || [ "$TYPE" = "ports" ]; then
    echo "[*] nmap -- scanning ports..."
    if command -v nmap &>/dev/null; then
        nmap -sV -sC -O "$TARGET" -oA "$OUTDIR/nmap" 2>&1 | tail -5
    else
        echo "[!] nmap not installed"
    fi
fi

if [ "$TYPE" = "all" ] || [ "$TYPE" = "web" ]; then
    echo "[*] whatweb -- fingerprinting..."
    if command -v whatweb &>/dev/null; then
        whatweb "$TARGET" --log-verbose="$OUTDIR/whatweb.log" 2>&1
    else
        echo "[!] whatweb not installed"
    fi
fi

if [ "$TYPE" = "all" ] || [ "$TYPE" = "dirs" ]; then
    echo "[*] Directory enumeration..."
    if command -v gobuster &>/dev/null; then
        gobuster dir -u "$TARGET" -w /usr/share/wordlists/dirb/common.txt \
            -o "$OUTDIR/gobuster.txt" 2>&1 | tail -5
    elif command -v dirb &>/dev/null; then
        dirb "$TARGET" /usr/share/wordlists/dirb/common.txt \
            -o "$OUTDIR/dirb.txt" 2>&1 | tail -5
    else
        echo "[!] gobuster/dirb not installed"
    fi
fi

if [ "$TYPE" = "all" ] || [ "$TYPE" = "vulns" ]; then
    echo "[*] nikto -- web vulnerabilities..."
    if command -v nikto &>/dev/null; then
        nikto -h "$TARGET" -output "$OUTDIR/nikto.html" 2>&1 | tail -5
    else
        echo "[!] nikto not installed"
    fi
fi

echo ""
echo "[*] Results saved to: $OUTDIR/"
