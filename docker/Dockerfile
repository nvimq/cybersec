FROM kalilinux/kali-rolling:latest AS base

LABEL maintainer="nvimq"
LABEL description="CyberSec Toolkit — universal penetration testing environment"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    nmap \
    sqlmap \
    metasploit-framework \
    nikto \
    gobuster \
    wfuzz \
    whatweb \
    hashcat \
    john \
    hydra \
    aircrack-ng \
    bettercap \
    dirb \
    python3-pip \
    git \
    curl \
    wget \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages impacket

RUN git clone https://github.com/lgandx/Responder /opt/Responder && \
    ln -sf /opt/Responder/Responder.py /usr/local/bin/responder

RUN wfuzz --version 2>/dev/null; \
    echo "Burp Suite: install manually from https://portswigger.net/burp"; \
    echo "OWASP ZAP: install manually from https://www.zaproxy.org/download/"

WORKDIR /workspace

CMD ["/bin/bash"]
