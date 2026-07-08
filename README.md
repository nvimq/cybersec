# CyberSec Toolkit

Набор инструментов для пентеста и аудита безопасности.

## Установка

```bash
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

## Инструменты

### Разведка
| Инструмент | Описание |
|------------|----------|
| nmap | Сканер портов и сервисов |
| whatweb | Определение веб-технологий |
| gobuster | Перебор директорий/DNS |
| nikto | Сканер веб-уязвимостей |

### Эксплуатация
| Инструмент | Описание |
|------------|----------|
| Metasploit | Фреймворк эксплуатации |
| sqlmap | SQL-инъекции |
| hydra | Брутфорс паролей |
| Burp Suite | Перехват и анализ HTTP |
| OWASP ZAP | Сканер веб-безопасности (GUI) |

### Пост-эксплуатация / AD
| Инструмент | Описание |
|------------|----------|
| impacket | AD-эксплуатация (smbexec, secretsdump, wmiexec) |
| Responder | LLMNR/NBT-NS poisoning |

### Пароли
| Инструмент | Описание |
|------------|----------|
| hashcat | Взлом хешей (GPU) |
| john | Взлом хешей (CPU) |

### WiFi
| Инструмент | Описание |
|------------|----------|
| aircrack-ng | Взлом WiFi |
| bettercap | MiTM/сниффинг |

### Фаззинг
| Инструмент | Описание |
|------------|----------|
| wfuzz | Веб-фаззер |

## Quick Start

```bash
# Быстрое сканирование цели
./scripts/quick-scan.sh target.com

# Или вручную:
nmap -sV -sC -O target.com
whatweb target.com
gobuster dir -u https://target.com -w wordlists/common.txt
```

## Структура

```
cybersec/
├── bin/            # Симлинки на установленные инструменты
├── scripts/        # Скрипты для автоматизации
│   ├── setup.sh    # Установка всех инструментов
│   └── quick-scan.sh # Быстрый запуск сканирования
├── wordlists/      # Словари (добавить git lfs)
└── configs/        # Конфигурации инструментов
```
