import { z } from "zod";
import { execFileSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { resolve } from "path";
import type { ToolDefinition } from "../types.js";
import { loadScope, isTargetInScope } from "../guards/scope-validator.js";
import { checkRateLimit } from "../guards/rate-limiter.js";
import { logAudit } from "../guards/audit-logger.js";

const WORDLIST_DIR = resolve("wordlists");

let cachedWordlists: string[] | null = null;

function getAvailableWordlists(): string[] {
  if (cachedWordlists) return cachedWordlists;
  if (!existsSync(WORDLIST_DIR)) {
    cachedWordlists = ["/usr/share/wordlists/dirb/common.txt"];
    return cachedWordlists;
  }
  const entries: string[] = [];
  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) entries.push(full);
    }
  }
  walk(WORDLIST_DIR);
  cachedWordlists = entries.length > 0 ? entries : ["/usr/share/wordlists/dirb/common.txt"];
  return cachedWordlists;
}

export const gobusterDirSchema = z.object({
  target_url: z.string().url("Must be a valid URL (http:// or https://)").regex(/^https?:\/\//, "Must start with http:// or https://"),
  wordlist: z.string().default("/usr/share/wordlists/dirb/common.txt"),
  extensions: z.string().regex(/^[a-zA-Z0-9,]+$/, "Extensions must be comma-separated, e.g. 'php,html,txt'").optional(),
  threads: z.number().int().min(1).max(50).default(10),
  status_codes: z.string().optional(),
});

export type GobusterDirInput = z.infer<typeof gobusterDirSchema>;

export const gobusterDirTool: ToolDefinition = {
  name: "cybersec_gobuster_dir",
  description:
    "Run directory/file brute-force enumeration against a web target using gobuster's dir mode with a wordlist from the repo's wordlists/ directory.",
  inputSchema: {
    target_url: z.string().describe("Full URL to enumerate (must include http:// or https://)"),
    wordlist: z.string().optional().describe("Path to wordlist. Defaults to dirb common.txt"),
    extensions: z.string().optional().describe("File extensions to append, e.g. 'php,html,txt'"),
    threads: z.number().int().min(1).max(50).optional().default(10).describe("Number of concurrent threads (max 50)"),
    status_codes: z.string().optional().describe("Status code filter, e.g. '200,204,301,302'"),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async execute(input: GobusterDirInput) {
    const params = gobusterDirSchema.parse(input);

    loadScope();

    const hostname = new URL(params.target_url).hostname;
    const check = isTargetInScope(hostname);
    if (!check.inScope) {
      const msg = `Target ${hostname} is out of scope: ${check.reason}`;
      logAudit({
        tool_name: "cybersec_gobuster_dir",
        input_params: params as unknown as Record<string, unknown>,
        scope_check_result: "REJECTED",
        executed: false,
        result_summary: msg,
        actor: "mcp-server",
        error: msg,
      });
      return { content: [{ type: "text", text: msg }], isError: true };
    }

    const rl = checkRateLimit("gobuster");
    if (!rl.allowed) {
      return {
        content: [{ type: "text", text: `Rate limit exceeded. Retry in ${Math.ceil(rl.resetAfterMs / 1000)}s.` }],
        isError: true,
      };
    }

    if (!existsSync(params.wordlist)) {
      const msg = `Wordlist not found: ${params.wordlist}. Run scripts/fetch-wordlists.sh or specify an existing wordlist path.`;
      return { content: [{ type: "text", text: msg }], isError: true };
    }

    const args: string[] = [
      "dir",
      "-u", params.target_url,
      "-w", params.wordlist,
      "-t", String(params.threads),
    ];

    if (params.extensions) args.push("-x", params.extensions);
    if (params.status_codes) args.push("-s", params.status_codes);

    try {
      const output = execFileSync("gobuster", args, {
        encoding: "utf-8",
        timeout: 300_000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const results = parseGobusterOutput(output);

      logAudit({
        tool_name: "cybersec_gobuster_dir",
        input_params: params as unknown as Record<string, unknown>,
        scope_check_result: "PASS",
        executed: true,
        result_summary: `Found ${results.length} paths`,
        actor: "mcp-server",
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              target_url: params.target_url,
              found: results,
              wordlist_used: params.wordlist,
              truncated: results.length > 500,
            }),
          },
        ],
      };
    } catch (err) {
      const msg = `gobuster execution failed. Is gobuster installed?\nError: ${err instanceof Error ? err.message : String(err)}`;

      logAudit({
        tool_name: "cybersec_gobuster_dir",
        input_params: params as unknown as Record<string, unknown>,
        scope_check_result: "PASS",
        executed: false,
        result_summary: "FAILED",
        actor: "mcp-server",
        error: msg,
      });

      return { content: [{ type: "text", text: msg }], isError: true };
    }
  },
};

interface GobusterResult {
  path: string;
  status_code: number;
  size?: number;
}

function parseGobusterOutput(output: string): GobusterResult[] {
  const results: GobusterResult[] = [];
  for (const line of output.split("\n")) {
    const match = line.match(/^(\/.+?)\s+\(Status:\s*(\d+)\)(?:.*\[Size:\s*(\d+)\])?/);
    if (match) {
      results.push({
        path: match[1],
        status_code: parseInt(match[2], 10),
        size: match[3] ? parseInt(match[3], 10) : undefined,
      });
    }
  }
  return results;
}
