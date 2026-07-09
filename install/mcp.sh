#!/bin/bash
set -euo pipefail

echo "=== CyberSec MCP + AI Toolkit Installer ==="
echo ""

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Darwin)  PKG_MGR="brew" ;;
    Linux)   PKG_MGR="apt" ;;
    *)       echo "[!] Unsupported OS: $OS"; exit 1 ;;
esac

# 1. Node.js (for MCP server)
echo "[*] Installing Node.js..."
if command -v node &>/dev/null; then
    echo "      Node.js $(node --version) already installed"
else
    case "$PKG_MGR" in
        brew) brew install node ;;
        apt)  echo "      Installing via NodeSource (https://github.com/nodesource/distributions)..."
              curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodejs-setup.sh
              echo "[!] Verify the script at https://github.com/nodesource/distributions"
              echo "[!] Expected SHA: check https://deb.nodesource.com/setup_22.x.sha256"
              sudo -E bash /tmp/nodejs-setup.sh && sudo apt-get install -y nodejs ;;
    esac
fi

# 2. Go (for ProjectDiscovery tools)
echo "[*] Installing Go..."
if command -v go &>/dev/null; then
    echo "      Go $(go version | grep -oP 'go\S+' || echo 'already installed')"
else
    case "$PKG_MGR" in
        brew) brew install go ;;
        apt)  sudo apt-get install -y golang-go ;;
    esac
fi

# 3. ProjectDiscovery tools
echo "[*] Installing ProjectDiscovery tools..."
TOOLS=(
    "github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest"
    "github.com/projectdiscovery/dnsx/cmd/dnsx@latest"
    "github.com/projectdiscovery/httpx/cmd/httpx@latest"
    "github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest"
)

for tool in "${TOOLS[@]}"; do
    name=$(echo "$tool" | awk -F'/' '{print $(NF-1)}')
    if command -v "$name" &>/dev/null; then
        echo "      $name already installed"
    else
        echo "      Installing $name..."
        go install -v "$tool" 2>/dev/null || echo "      [!] Failed to install $name (try manual: go install $tool)"
    fi
done

# Ensure Go binaries are in PATH
if command -v go &>/dev/null; then
    GOPATH=$(go env GOPATH 2>/dev/null || echo "$HOME/go")
    if [[ ":$PATH:" != *":$GOPATH/bin:"* ]]; then
        echo ""
        echo "[!] Add Go bin directory to your PATH:"
        echo "    export PATH=\"\$PATH:$GOPATH/bin\""
        echo "    # Add this to ~/.bashrc, ~/.zshrc, or equivalent"
    fi
fi

# 4. Install MCP server dependencies
echo ""
echo "[*] Installing MCP server dependencies..."
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MCP_DIR="$SCRIPT_DIR/mcp/server"
if [ -f "$MCP_DIR/package.json" ]; then
    cd "$MCP_DIR" && npm install && npm run build
    echo "      MCP server built successfully"
else
    echo "      [!] mcp/server/package.json not found at $MCP_DIR"
fi

# 5. Ollama (optional, for air-gapped LLM)
echo ""
echo "[*] Ollama (optional, for local LLM)..."
if command -v ollama &>/dev/null; then
    echo "      Ollama already installed"
else
    echo "      Not installed. To install for air-gapped mode:"
    echo "        brew install ollama       # macOS"
    echo "        curl -fsSL https://ollama.com/install.sh | sh  # Linux"
fi

# Done
echo ""
echo "=== Installation Complete ==="
echo ""
echo "Next steps:"
echo "  1. Create a scope file:"
echo "       cp mcp/scope-template.yaml mcp/scope.yaml"
echo "       # Edit mcp/scope.yaml with your authorized targets"
echo ""
echo "  2. Start the MCP server:"
echo "       cd mcp/server && node dist/index.js"
echo ""
echo "  3. Add to Claude Desktop config (mcp/mcp-config.json):"
echo "       See mcp/mcp-config.json for the configuration"
echo ""
echo "  4. Or run the recon pipeline:"
echo "       ./scripts/recon-pd.sh example.com"
echo ""
echo "  5. For air-gapped LLM:"
echo "       ollama pull llama3.2"
echo "       # Then configure the agent to use local Ollama endpoint"
echo ""
