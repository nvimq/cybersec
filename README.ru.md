# CyberSec Toolkit

Кроссплатформенный набор инструментов для пентеста и аудита безопасности. Включает скрипты установки, Docker-образ, скрипты для типовых задач и **AI-слой оркестрации** через MCP (Model Context Protocol).

## Быстрый старт

### Способ 1: Docker (работает везде)

```bash
docker build -t cybersec docker/
docker run -it --rm -v "$PWD:/workspace" cybersec
```

### Способ 2: Нативная установка

```bash
# macOS
chmod +x install/macos.sh && ./install/macos.sh

# Linux (Debian/Arch/Fedora)
chmod +x install/linux.sh && ./install/linux.sh

# Windows (PowerShell от администратора)
Set-ExecutionPolicy Bypass -Scope Process -Force
.\install\windows.ps1
```

## Инструменты

### Разведка
| Инструмент | Назначение |
|------------|------------|
| nmap | Сканер портов и сервисов |
| whatweb | Определение веб-технологий |
| gobuster | Перебор директорий и DNS |
| nikto | Сканер веб-уязвимостей |
| dirb | Сканер веб-контента |

### AI-разведка (ProjectDiscovery)
| Инструмент | Назначение |
|------------|------------|
| subfinder | Пассивная энумерация сабдоменов (Shodan/VirusTotal/Censys) |
| dnsx | Быстрый DNS-резолвинг |
| naabu | Сканирование портов |
| httpx | HTTP-пробинг, определение технологий, статус-коды |
| katana | Краулинг SPA/JS, поиск API-ендпоинтов |
| nuclei | Темплейт-сканер уязвимостей (4000+ community-темплейтов) |

### Эксплуатация
| Инструмент | Назначение |
|------------|------------|
| Metasploit | Фреймворк эксплуатации |
| sqlmap | Автоматизация SQL-инъекций |
| hydra | Брутфорс паролей |
| Burp Suite | Перехват и анализ HTTP |
| OWASP ZAP | Сканер веб-безопасности |

### Пост-эксплуатация / AD
| Инструмент | Назначение |
|------------|------------|
| impacket | Набор для AD-атак (smbexec, secretsdump, wmiexec и др.) |
| Responder | LLMNR/NBT-NS/mDNS poisoning |

### Взлом паролей
| Инструмент | Назначение |
|------------|------------|
| hashcat | Взлом хешей на GPU |
| john | Взлом хешей на CPU |

### Сеть / WiFi
| Инструмент | Назначение |
|------------|------------|
| aircrack-ng | Аудит безопасности WiFi |
| bettercap | MITM-атаки и сниффинг трафика |

### Фаззинг
| Инструмент | Назначение |
|------------|------------|
| wfuzz | Веб-фаззер |

## AI-Assisted Mode

CyberSec Toolkit теперь включает **AI-слой оркестрации** — можно запускать те же инструменты пентеста через MCP-сервер, используя естественный язык в Claude Desktop, Claude Code, Cursor или любом MCP-клиенте.

### Быстрый старт (AI-режим)

```bash
# 1. Установка MCP-сервера и ProjectDiscovery
./install/mcp.sh

# 2. Создание и редактирование scope-файла
cp mcp/scope-template.yaml mcp/scope.yaml
# Отредактируйте mcp/scope.yaml — укажите авторизованные цели

# 3. Запуск MCP-сервера
cd mcp/server && node dist/index.js
```

### MCP-инструменты

| Инструмент | Описание | Уровень риска |
|---|---|---|
| `cybersec_nmap_scan` | Сканирование портов с валидацией scope | intrusive |
| `cybersec_gobuster_dir` | Перебор директорий | intrusive |
| `cybersec_httpx_probe` | HTTP-пробинг сервисов | safe (read-only) |
| `cybersec_nuclei_scan` | Темплейт-сканер уязвимостей | intrusive |
| `cybersec_scope_check` | Проверка авторизации цели | safe (read-only) |

Каждый инструмент имеет blast-radius аннотации для безопасной работы агентов:
- **readOnlyHint** / **destructiveHint** / **idempotentHint** / **openWorldHint**
- Цель проверяется против `mcp/scope.yaml` перед каждым запуском
- Rate limiting: 100 запросов / 60 секунд с аудит-логом

### AI-пайплайн разведки

```bash
# Цепочка ProjectDiscovery: subfinder -> dnsx -> httpx -> nuclei
./scripts/recon-pd.sh target.com
```

### AI-агенты

См. [`agents/README.md`](agents/README.md) для настройки:
- **PentAGI** — мульти-агентный оркестратор (Docker-native, 14.7k★)
- **PentestGPT-legacy** — human-in-the-loop советник
- **CAI** — лёгкий фреймворк с поддержкой air-gapped LLM через Ollama

### LLM Security

См. [`llm-security/`](llm-security/) — чек-листы OWASP LLM Top 10 и тестовые payload'ы для prompt injection (только для авторизованного редтиминга).

### Guardrails (защитные механизмы)

AI-режим включает обязательную защиту:

1. **Scope-файл** (`mcp/scope.yaml`) — каждый вызов инструмента проверяется против авторизованных целей
2. **Blast-radius tiers** — safe / intrusive / destructive с явным approval для destructive
3. **Rate limiting** — 100 запросов в 60 секунд (настраивается)
4. **Audit log** — все вызовы логируются в `logs/audit-*.jsonl`
5. **AUP consent** — явное принятие условий использования при первом запуске
6. **Human-in-the-loop** — advisor-режим по умолчанию; полная автономия — opt-in

## Скрипты

```
scripts/
  quick-scan.sh      Запуск сканирования несколькими инструментами (legacy)
  recon-pd.sh        Пайплайн ProjectDiscovery (subfinder -> dnsx -> httpx -> nuclei)
  fetch-wordlists.sh Скачать популярные словари (SecLists)
install/
  macos.sh           Установщик для macOS (Homebrew)
  linux.sh           Установщик для Linux (apt/pacman/dnf)
  windows.ps1        Установщик для Windows (Scoop/Chocolatey)
  mcp.sh             Установка MCP-сервера + ProjectDiscovery + зависимостей
docker/
  Dockerfile         Docker-образ на базе Kali со всеми инструментами
  Dockerfile.ai      Kali + AI-слой (MCP-сервер + ProjectDiscovery + Ollama)
mcp/
  mcp-config.json    Пример конфига для Claude Desktop
  scope-template.yaml Шаблон scope-файла авторизации
agents/
  README.md          Инструкция по подключению AI-агентов
llm-security/
  checklists/        OWASP LLM Top 10 чек-лист
  prompts/           Prompt injection и jailbreak тестовые payload'ы
```

### Быстрое сканирование (legacy)

```bash
./scripts/quick-scan.sh target.com
./scripts/quick-scan.sh target.com ports
./scripts/quick-scan.sh target.com web
./scripts/quick-scan.sh target.com dirs
```

### AI-пайплайн разведки

```bash
./scripts/recon-pd.sh target.com
```

## Репозитории

- GitHub: https://github.com/nvimq/cybersec
- GitLab: https://gitlab.com/nvimq/cybersec

## Лицензия

Данный проект предназначен только для авторизованного тестирования безопасности. Несанкционированное использование может нарушать законодательство. Авторы не несут ответственности за неправомерное использование.
