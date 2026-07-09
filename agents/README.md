# AI Agents for CyberSec Toolkit

Этот раздел документирует, как подключить agentic-фреймворки поверх MCP-слоя и существующих тулз.

## Принципиальная архитектура

```
Человек (LLM-чат / Claude Desktop / Cursor)
    |
    v
MCP-клиент (Claude Code / Claude Desktop / любой MCP client)
    |
    +--> cybersec-mcp (наш MCP-сервер)
    |       - nmap, gobuster, httpx, nuclei
    |       - scope validation, rate limiting, audit log
    |
    +--> pd-tools-mcp (ProjectDiscovery)
    |       - subfinder -> dnsx -> naabu -> httpx -> katana -> nuclei
    |
    +--> PentAGI (Docker-based оркестратор)
            - multi-agent planning + execution
            - LLM-agnostic (LiteLLM)
            - полная изоляция в Docker-песочницах
```

## Варианты использования

### 1. Прямой вызов через MCP-клиент (рекомендуется для начала)

Самый простой путь — подключить `cybersec-mcp` к Claude Desktop / Claude Code:

1. Установить зависимости: `./install/mcp.sh`
2. Создать scope-файл: `cp mcp/scope-template.yaml mcp/scope.yaml`
3. Отредактировать `mcp/scope.yaml` под свою авторизованную цель
4. Добавить конфиг в Claude Desktop (см. `mcp/mcp-config.json`)

После этого можно писать промпты вида:

```
"Запусти nmap-скан цели из scope на top-100 портов"
"Проверь, входит ли staging.internal в авторизованный scope"
"Запусти nuclei-скан с severity medium,high,critical"
```

**Важно:** все вызовы проходят через scope-валидацию, rate limiting и audit log.

### 2. PentAGI (multi-agent оркестратор)

[PentAGI](https://github.com/vxcontrol/pentagi) — самый популярный open-source AI-pentest фреймворк (~14.7k★). Запускается в Docker, использует 4 суб-агента (Searcher/Coder/Installer/Pentester) в изолированных песочницах.

```bash
# Клонирование и запуск
git clone https://github.com/vxcontrol/pentagi.git
cd pentagi

# Настройка .env с LLM-провайдером
cp .env.example .env
# Отредактировать .env — указать API-ключ (OpenAI/Anthropic/любой через LiteLLM)

# Запуск
docker compose up -d
# Открыть http://localhost:8080
```

**Когда использовать:** нужен multi-step, multi-agent пайплайн с планированием и автоматическим переключением между тулзами. Требует Postgres.

**Когда НЕ использовать:** для быстрых ad-hoc запросов к одной тулзе — для этого достаточно прямого MCP-доступа (вариант 1).

### 3. PentestGPT-legacy (human-in-the-loop)

[PentestGPT](https://github.com/GreyDGL/PentestGPT) — академический проект (USENIX 2024), режим `pentestgpt-legacy` — три кооперирующие LLM-сессии (reasoning/generation/parsing) с human-in-the-loop по дизайну.

```bash
pip install pentestgpt
pentestgpt --mode pentestgpt-legacy --model gpt-4o
```

**Когда использовать:** нужен advisor-режим без Docker/Postgres. Лучше всего работает как "AI-напарник", который анализирует вывод тулз и предлагает следующий шаг.

**Когда НЕ использовать:** для полностью автономного выполнения — этого режима в PentestGPT-legacy нет по дизайну.

### 4. CAI (Cybersecurity AI) — lightweight альтернатива

[CAI](https://github.com/cai-project/cai) — лёгкий фреймворк с поддержкой 300+ моделей, включая локальные (Ollama, llama.cpp). Хорош для air-gapped сценариев.

```bash
pip install cai-framework
cai --model ollama:llama3.2 --toolkit cybersec
```

---

## Выбор режима

| Сценарий | Рекомендация |
|---|---|
| Быстрый ad-hoc вызов nmap/gobuster/nuclei | Прямой MCP (вариант 1) |
| Многошаговый engagement с планированием | PentAGI (вариант 2) |
| Advisor-режим, human-in-the-loop | PentestGPT-legacy (вариант 3) |
| Air-gapped, только локальные LLM | CAI + Ollama (вариант 4) |
| CI/CD pipeline, автоматизация | Прямой MCP + env var AUP-consent |

---

## Безопасность

Независимо от выбранного режима:

1. **Все вызовы проходят через scope-валидацию** — любой tool из `cybersec-mcp` проверяет target против `mcp/scope.yaml` перед выполнением.
2. **Rate limiting** — 100 запросов в 60 секунд, конфигурируется.
3. **Audit log** — каждый вызов логируется в `logs/audit-*.jsonl`.
4. **Blast-radius tiers** — destructive-операции (sqlmap, hydra) требуют явного approval.
5. **Kill switch** — прерывание выполнения через Ctrl+C (×2 для принудительного завершения всех дочерних процессов).

**Интеграция с PentAGI:** чтобы PentAGI использовал `cybersec-mcp` как backend, настройте его MCP-клиент на `node mcp/server/dist/index.js` в качестве tool-провайдера (см. документацию PentAGI по custom tool integration).
