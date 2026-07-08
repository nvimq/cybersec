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

## Scripts

```
scripts/
  quick-scan.sh      Run a multi-tool scan against a target
  fetch-wordlists.sh Download common wordlists (SecLists)
install/
  macos.sh           macOS (Homebrew) installer
  linux.sh           Linux (apt/pacman/dnf) installer
  windows.ps1        Windows (Scoop/Chocolatey) installer
docker/
  Dockerfile         Kali-based Docker image with all tools
```

### Quick scan

```bash
./scripts/quick-scan.sh target.com
./scripts/quick-scan.sh target.com ports
./scripts/quick-scan.sh target.com web
./scripts/quick-scan.sh target.com dirs
```

## Repositories

- GitHub: https://github.com/nvimq/cybersec
- GitLab: https://gitlab.com/nvimq/cybersec

## License

This project is for authorized security testing only. Unauthorized use may violate applicable laws. The authors assume no liability for misuse.
