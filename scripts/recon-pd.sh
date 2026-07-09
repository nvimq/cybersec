#!/bin/bash
set -euo pipefail

TARGET="${1:-}"
OUTDIR="${2:-recon-pd-$(date +%Y%m%d-%H%M%S)}"

if [ -z "$TARGET" ]; then
    echo "Usage: $0 <target> [output-dir]"
    echo ""
    echo "Runs ProjectDiscovery recon chain: subfinder -> dnsx -> httpx -> nuclei"
    echo "Requires: subfinder, dnsx, httpx, nuclei (install via install/mcp.sh)"
    exit 1
fi

mkdir -p "$OUTDIR"
echo "[*] Target: $TARGET"
echo "[*] Output: $OUTDIR/"
echo ""

# Step 1: Passive subdomain enumeration
echo "[*] subfinder -- passive subdomain enumeration..."
if command -v subfinder &>/dev/null; then
    subfinder -d "$TARGET" -silent -o "$OUTDIR/subdomains.txt" 2>/dev/null
    echo "      Found $(wc -l < "$OUTDIR/subdomains.txt") subdomains"
else
    echo "[!] subfinder not installed. Skipping passive enum."
    echo "$TARGET" > "$OUTDIR/subdomains.txt"
fi

# Step 2: DNS resolution
echo "[*] dnsx -- resolving discovered hosts..."
if command -v dnsx &>/dev/null; then
    dnsx -l "$OUTDIR/subdomains.txt" -silent -o "$OUTDIR/resolved.txt" 2>/dev/null
    echo "      Resolved $(wc -l < "$OUTDIR/resolved.txt") hosts"
    INPUT_FILE="$OUTDIR/resolved.txt"
else
    echo "[!] dnsx not installed. Skipping resolution."
    INPUT_FILE="$OUTDIR/subdomains.txt"
fi

# Step 3: HTTP probing
echo "[*] httpx -- probing HTTP services..."
if command -v httpx &>/dev/null; then
    httpx -l "$INPUT_FILE" -silent -status-code -title -tech-detect -json \
        -o "$OUTDIR/httpx.json" 2>/dev/null
    echo "      Probed live hosts"
else
    echo "[!] httpx not installed. Skipping HTTP probe."
fi

# Step 4: Vulnerability scanning with nuclei
echo "[*] nuclei -- scanning for vulnerabilities..."
if command -v nuclei &>/dev/null; then
    if [ -f "$OUTDIR/httpx.json" ]; then
        cat "$OUTDIR/httpx.json" | jq -r '.url // empty' 2>/dev/null > "$OUTDIR/live-urls.txt" \
            || echo "$TARGET" > "$OUTDIR/live-urls.txt"
    fi
    if [ -s "$OUTDIR/live-urls.txt" ]; then
        nuclei -l "$OUTDIR/live-urls.txt" -severity low,medium,high,critical \
            -json -silent -o "$OUTDIR/nuclei-results.json" 2>/dev/null || true
        echo "      Scan complete. Results in $OUTDIR/nuclei-results.json"
    else
        echo "[!] No live URLs to scan with nuclei."
    fi
else
    echo "[!] nuclei not installed. Skipping vulnerability scan."
fi

# Summary
echo ""
echo "=== Recon Complete ==="
echo "  Target:      $TARGET"
echo "  Subdomains:  $(wc -l < "$OUTDIR/subdomains.txt" 2>/dev/null || echo 0)"
echo "  Resolved:    $(wc -l < "$OUTDIR/resolved.txt" 2>/dev/null || echo 0)"
echo "  Nuclei hits: $(wc -l < "$OUTDIR/nuclei-results.json" 2>/dev/null || echo 0)"
echo "  Output:      $OUTDIR/"
echo ""
echo "[*] Quick summary:"
if [ -f "$OUTDIR/nuclei-results.json" ]; then
    echo "  Critical: $(grep -c '"critical"' "$OUTDIR/nuclei-results.json" 2>/dev/null || echo 0)"
    echo "  High:     $(grep -c '"high"' "$OUTDIR/nuclei-results.json" 2>/dev/null || echo 0)"
    echo "  Medium:   $(grep -c '"medium"' "$OUTDIR/nuclei-results.json" 2>/dev/null || echo 0)"
fi
