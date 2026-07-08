#!/bin/bash
# quick-scan.sh — быстрый запуск сканирования
# Использование: ./quick-scan.sh <target> [type]

TARGET="${1:-}"
TYPE="${2:-all}"

if [ -z "$TARGET" ]; then
    echo "Usage: $0 <target> [type]"
    echo "  type: all, ports, web, dirs, vulns"
    exit 1
fi

OUTDIR="scan-$(echo $TARGET | tr -d '/' | tr ':' '-')-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTDIR"

echo "[*] Target: $TARGET"
echo "[*] Output: $OUTDIR/"
echo ""

if [ "$TYPE" = "all" ] || [ "$TYPE" = "ports" ]; then
    echo "[*] nmap — сканирование портов..."
    nmap -sV -sC -O "$TARGET" -oA "$OUTDIR/nmap" 2>&1 | tail -5
fi

if [ "$TYPE" = "all" ] || [ "$TYPE" = "web" ]; then
    echo "[*] whatweb — веб-фреймворки..."
    whatweb "$TARGET" --log-verbose="$OUTDIR/whatweb.log" 2>&1
fi

if [ "$TYPE" = "all" ] || [ "$TYPE" = "dirs" ]; then
    echo "[*] gobuster — перебор директорий..."
    gobuster dir -u "$TARGET" -w /usr/share/wordlists/dirb/common.txt \
        -o "$OUTDIR/gobuster.txt" 2>&1 | tail -5
fi

if [ "$TYPE" = "all" ] || [ "$TYPE" = "vulns" ]; then
    echo "[*] nikto — веб-уязвимости..."
    nikto -h "$TARGET" -output "$OUTDIR/nikto.html" 2>&1 | tail -5
fi

echo ""
echo "[✓] Результаты: $OUTDIR/"
