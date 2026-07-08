# CyberSec Toolkit Installer for Windows
# Requires: PowerShell 5+, Administrator rights

Write-Host "[*] Installing CyberSec Toolkit on Windows..." -ForegroundColor Cyan

# Check for Scoop
if (!(Get-Command scoop -ErrorAction SilentlyContinue)) {
    Write-Host "[*] Installing Scoop..." -ForegroundColor Yellow
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
}

# Check for Chocolatey
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "[*] Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
}

Write-Host "[*] Installing tools via Scoop..." -ForegroundColor Green
$scoopTools = @(
    "nmap", "sqlmap", "nikto", "gobuster", "whatweb", "hashcat", "john", "hydra"
)
foreach ($tool in $scoopTools) {
    scoop install $tool
}

Write-Host "[*] Installing tools via Chocolatey..." -ForegroundColor Green
$chocoTools = @(
    "burp-suite-community", "zap", "aircrack-ng", "wireshark"
)
foreach ($tool in $chocoTools) {
    choco install $tool -y
}

Write-Host "[*] Installing Python tools..." -ForegroundColor Green
pip install impacket wfuzz

Write-Host "[*] Cloning Responder..." -ForegroundColor Green
git clone https://github.com/lgandx/Responder "$env:USERPROFILE\Responder"

Write-Host "[*] Done." -ForegroundColor Cyan
Write-Host "[*] Open a new terminal to ensure tools are in PATH." -ForegroundColor Yellow
