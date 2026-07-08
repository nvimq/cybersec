# CyberSec Toolkit

Кроссплатформенный набор инструментов для пентеста и аудита безопасности. Включает скрипты установки, Docker-образ и полезные скрипты для типовых задач.

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

## Скрипты

```
scripts/
  quick-scan.sh      Запуск сканирования несколькими инструментами
  fetch-wordlists.sh Скачать популярные словари (SecLists)
install/
  macos.sh           Установщик для macOS (Homebrew)
  linux.sh           Установщик для Linux (apt/pacman/dnf)
  windows.ps1        Установщик для Windows (Scoop/Chocolatey)
docker/
  Dockerfile         Docker-образ на базе Kali со всеми инструментами
```

### Быстрое сканирование

```bash
./scripts/quick-scan.sh target.com
./scripts/quick-scan.sh target.com ports
./scripts/quick-scan.sh target.com web
./scripts/quick-scan.sh target.com dirs
```

## Репозитории

- GitHub: https://github.com/nvimq/cybersec
- GitLab: https://gitlab.com/nvimq/cybersec

## Лицензия

Данный проект предназначен только для авторизованного тестирования безопасности. Несанкционированное использование может нарушать законодательство. Авторы не несут ответственности за неправомерное использование.
