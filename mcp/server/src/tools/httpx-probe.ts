import { z } from "zod";
import { execFileSync } from "child_process";
import type { ToolDefinition } from "../types.js";
import { loadScope, isTargetInScope } from "../guards/scope-validator.js";
import { checkRateLimit } from "../guards/rate-limiter.js";
import { logAudit } from "../guards/audit-logger.js";

export const httpxProbeSchema = z.object({
  targets: z.array(z.string().min(1).max(500)).min(1, "At least one target required").max(100, "Max 100 targets per call"),
  follow_redirects: z.boolean().default(true),
  tech_detect: z.boolean().default(true),
});

export type HttpxProbeInput = z.infer<typeof httpxProbeSchema>;

export const httpxProbeTool: ToolDefinition = {
  name: "cybersec_httpx_probe",
  description:
    "Probe a list of hosts/URLs to identify live HTTP(S) services, status codes, titles, and detected technologies. Read-only — does not send exploit payloads.",
  inputSchema: {
    targets: z.array(z.string()).describe("List of hosts or URLs to probe (e.g. ['example.com', 'https://example.com/admin'])"),
    follow_redirects: z.boolean().optional().default(true).describe("Follow HTTP redirects"),
    tech_detect: z.boolean().optional().default(true).describe("Enable technology fingerprinting"),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async execute(input: HttpxProbeInput) {
    const params = httpxProbeSchema.parse(input);

    loadScope();

    for (const target of params.targets) {
      const cleanTarget = target.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
      const check = isTargetInScope(cleanTarget);
      if (!check.inScope) {
        const msg = `Target ${cleanTarget} is out of scope: ${check.reason}`;
        logAudit({
          tool_name: "cybersec_httpx_probe",
          input_params: params as unknown as Record<string, unknown>,
          scope_check_result: "REJECTED",
          executed: false,
          result_summary: msg,
          actor: "mcp-server",
          error: msg,
        });
        return { content: [{ type: "text", text: msg }], isError: true };
      }
    }

    const rl = checkRateLimit("httpx");
    if (!rl.allowed) {
      return {
        content: [{ type: "text", text: `Rate limit exceeded. Retry in ${Math.ceil(rl.resetAfterMs / 1000)}s.` }],
        isError: true,
      };
    }

    const args: string[] = ["-silent", "-json"];
    if (!params.follow_redirects) args.push("-no-follow-redirects");
    if (!params.tech_detect) args.push("-no-tech-detect");

    const targetList = params.targets.join("\n");

    try {
      const output = execFileSync("httpx", args, {
        input: targetList,
        encoding: "utf-8",
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const results = output
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line };
          }
        });

      logAudit({
        tool_name: "cybersec_httpx_probe",
        input_params: params as unknown as Record<string, unknown>,
        scope_check_result: "PASS",
        executed: true,
        result_summary: `Probed ${results.length} hosts`,
        actor: "mcp-server",
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ results, scope_validated: true }),
          },
        ],
      };
    } catch (err) {
      const msg = `httpx execution failed. Is httpx installed? Try: go install github.com/projectdiscovery/httpx/cmd/httpx@latest\nError: ${err instanceof Error ? err.message : String(err)}`;

      logAudit({
        tool_name: "cybersec_httpx_probe",
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
