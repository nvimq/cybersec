#!/bin/bash
set -euo pipefail

WORDLIST_DIR="$(dirname "$0")/../wordlists"
mkdir -p "$WORDLIST_DIR"

echo "[*] Downloading common wordlists to $WORDLIST_DIR..."

echo "[*] rockyou (top 10k)..."
curl -sL "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/10k-most-common.txt" \
    -o "$WORDLIST_DIR/10k-most-common.txt" &

echo "[*] directories (common)..."
curl -sL "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/Web-Content/common.txt" \
    -o "$WORDLIST_DIR/web-common.txt" &

echo "[*] subdomains (top 5000)..."
curl -sL "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/DNS/subdomains-top1million-5000.txt" \
    -o "$WORDLIST_DIR/subdomains-5000.txt" &

wait

echo "[*] Done. $(wc -l < "$WORDLIST_DIR/10k-most-common.txt") passwords, \
$(wc -l < "$WORDLIST_DIR/web-common.txt") directories, \
$(wc -l < "$WORDLIST_DIR/subdomains-5000.txt") subdomains."
