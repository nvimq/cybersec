import { appendFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";

export interface AuditEntry {
  timestamp: string;
  engagement_id: string;
  tool_name: string;
  input_params: Record<string, unknown>;
  scope_check_result: string;
  executed: boolean;
  result_summary: string;
  actor: string;
  error?: string;
}

// Append-only JSONL audit log.
// Uses synchronous writes — acceptable for MVP (single-user CLI MCP server).
// For concurrent multi-agent scenarios: replace with async queue + fs.promises.appendFile.

const LOG_DIR = resolve("logs");

function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

let engagementId = "unknown";

export function setEngagementId(id: string): void {
  engagementId = id;
}

const SENSITIVE_KEYS = new Set(["password", "pass", "pwd", "secret", "token", "api_key", "hash"]);

function redactParams(params: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      redacted[key] = "***REDACTED***";
    } else if (typeof value === "string" && value.length > 200) {
      redacted[key] = value.slice(0, 200) + "... [truncated]";
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export function logAudit(entry: Omit<AuditEntry, "timestamp" | "engagement_id">): void {
  ensureLogDir();

  const fullEntry: AuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    engagement_id: engagementId,
    input_params: entry.input_params ? redactParams(entry.input_params) : {},
  };

  const filename = `audit-${engagementId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`;
  const filepath = join(LOG_DIR, filename);

  try {
    appendFileSync(filepath, JSON.stringify(fullEntry) + "\n", "utf-8");
  } catch (err) {
    console.error(`[audit-logger] Failed to write audit log: ${err}`);
  }
}
