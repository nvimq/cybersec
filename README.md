# CyberSec Toolkit

Cross-platform penetration testing toolkit. Provides installation scripts, a Docker image, and utility scripts for common security assessment tasks.

## Quick Start

### Option 1: Docker (works everywhere)

```bash
docker build -t cybersec docker/
docker run -it --rm -v "$PWD:/workspace" cybersec
```

### Option 2: Native install

```bash
# macOS
chmod +x install/macos.sh && ./install/macos.sh

# Linux (Debian/Arch/Fedora)
chmod +x install/linux.sh && ./install/linux.sh

# Windows (PowerShell as Admin)
Set-ExecutionPolicy Bypass -Scope Process -Force
.\install\windows.ps1
```

## Tools

### Reconnaissance
| Tool | Purpose |
|------|---------|
| nmap | Port and service scanner |
| whatweb | Web technology fingerprinting |
| gobuster | Directory/DNS brute-force |
| nikto | Web vulnerability scanner |
| dirb | Web content scanner |

### AI-Enhanced Recon (ProjectDiscovery stack)
| Tool | Purpose |
|------|---------|
| subfinder | Passive subdomain enumeration (Shodan/VirusTotal/Censys/SecurityTrails) |
| dnsx | Fast DNS resolution |
| naabu | Port scanning |
| httpx | HTTP probing, tech detection, status codes |
| katana | SPA/JS crawling, API endpoint discovery |
| nuclei | Template-based vulnerability scanner (4000+ community templates) |

### Exploitation
| Tool | Purpose |
|------|---------|
| Metasploit | Exploitation framework |
| sqlmap | SQL injection automation |
| hydra | Login brute-force |
| Burp Suite | HTTP interception and analysis |
| OWASP ZAP | Web security scanner |

### Post-exploitation / Active Directory
| Tool | Purpose |
|------|---------|
| impacket | AD exploitation suite (smbexec, secretsdump, wmiexec, etc.) |
| Responder | LLMNR/NBT-NS/mDNS poisoning |

### Password Cracking
| Tool | Purpose |
|------|---------|
| hashcat | GPU-accelerated hash cracking |
| john | CPU-based hash cracking |

### Network / WiFi
| Tool | Purpose |
|------|---------|
| aircrack-ng | WiFi security auditing |
| bettercap | MITM attacks and network sniffing |

### Fuzzing
| Tool | Purpose |
|------|---------|
| wfuzz | Web application fuzzer |

## AI-Assisted Mode

CyberSec Toolkit now includes an **AI orchestration layer** — you can run the same pentest tools through MCP (Model Context Protocol) servers, using natural language prompts via Claude Desktop, Claude Code, Cursor, or any MCP client.

### Quick start (AI mode)

```bash
# 1. Install MCP server and ProjectDiscovery tools
./install/mcp.sh

# 2. Create and edit scope file
cp mcp/scope-template.yaml mcp/scope.yaml
# Edit mcp/scope.yaml with your authorized targets

# 3. Start MCP server
cd mcp/server && node dist/index.js
```

### MCP tools

| Tool | Description | Risk tier |
|------|-------------|-----------|
| `cybersec_nmap_scan` | Port scanning with scope validation | intrusive |
| `cybersec_gobuster_dir` | Directory brute-force | intrusive |
| `cybersec_httpx_probe` | HTTP service probing | safe (read-only) |
| `cybersec_nuclei_scan` | Template-based vulnerability scan | intrusive |
| `cybersec_scope_check` | Target authorization validation | safe (read-only) |

Each tool is annotated with blast-radius metadata for agentic safety:
- **readOnlyHint** / **destructiveHint** / **idempotentHint** / **openWorldHint**
- Target is validated against `mcp/scope.yaml` before every execution
- 100 req/60s rate limiting with audit logging

### AI Recon pipeline

```bash
# ProjectDiscovery chain: subfinder -> dnsx -> httpx -> nuclei
./scripts/recon-pd.sh target.com
```

### AI Agents

See [`agents/README.md`](agents/README.md) for setup instructions for:
- **PentAGI** — multi-agent orchestrator (Docker-native, 14.7k★)
- **PentestGPT-legacy** — human-in-the-loop advisor
- **CAI** — lightweight framework, supports air-gapped LLMs via Ollama

### LLM Security

See [`llm-security/`](llm-security/) for OWASP LLM Top 10 checklists and prompt injection test payloads (for authorized red-teaming only).

### Guardrails

AI mode enforces safety by default:

1. **Scope file** (`mcp/scope.yaml`) — every tool call validated against authorized targets
2. **Blast-radius tiers** — safe / intrusive / destructive with explicit approval for destructive
3. **Rate limiting** — 100 requests per 60 seconds (configurable)
4. **Audit log** — all calls logged to `logs/audit-*.jsonl`
5. **AUP consent** — explicit Acceptable Use Policy acceptance on first run
6. **Human-in-the-loop** — advisor mode by default; full autonomy is opt-in

## Scripts

```
scripts/
  quick-scan.sh      Run a multi-tool scan against a target (legacy)
  recon-pd.sh        ProjectDiscovery recon pipeline (subfinder -> dnsx -> httpx -> nuclei)
  fetch-wordlists.sh Download common wordlists (SecLists)
install/
  macos.sh           macOS (Homebrew) installer
  linux.sh           Linux (apt/pacman/dnf) installer
  windows.ps1        Windows (Scoop/Chocolatey) installer
  mcp.sh             Install MCP server + ProjectDiscovery tools + dependencies
docker/
  Dockerfile         Kali-based Docker image with all tools
  Dockerfile.ai      Kali + AI layer (MCP server + ProjectDiscovery + optional Ollama)
mcp/
  mcp-config.json    Claude Desktop configuration example
  scope-template.yaml Authorization scope template
agents/
  README.md          Agent orchestrator setup guide
llm-security/
  checklists/        OWASP LLM Top 10 checklist
  prompts/           Prompt injection and jailbreak test payloads
```

### Quick scan (legacy)

```bash
./scripts/quick-scan.sh target.com
./scripts/quick-scan.sh target.com ports
./scripts/quick-scan.sh target.com web
./scripts/quick-scan.sh target.com dirs
```

### AI recon pipeline

```bash
./scripts/recon-pd.sh target.com
```

## Repositories

- GitHub: https://github.com/nvimq/cybersec
- GitLab: https://gitlab.com/nvimq/cybersec

## License

This project is for authorized security testing only. Unauthorized use may violate applicable laws. The authors assume no liability for misuse.
