import { z } from "zod";
import { execFileSync } from "child_process";
import type { ToolDefinition } from "../types.js";
import { loadScope, isTargetInScope, getIntensityLevel } from "../guards/scope-validator.js";
import { checkRateLimit } from "../guards/rate-limiter.js";
import { logAudit } from "../guards/audit-logger.js";

const SEVERITY_VALUES = ["info", "low", "medium", "high", "critical"] as const;

export const nucleiScanSchema = z.object({
  target: z.string().min(1, "Target is required").max(500, "Target too long").regex(/^[a-zA-Z0-9.:\-\/]+$/, "Target contains invalid characters"),
  severity: z.array(z.enum(SEVERITY_VALUES)).default(["medium", "high", "critical"]),
  template_tags: z.array(z.string()).max(20, "Max 20 template tags").optional(),
  exclude_intrusive: z.boolean().default(true),
});

export type NucleiScanInput = z.infer<typeof nucleiScanSchema>;

export const nucleiScanTool: ToolDefinition = {
  name: "cybersec_nuclei_scan",
  description:
    "Run template-based vulnerability detection against a target using Nuclei. Templates filtered by severity; destructive/intrusive template categories excluded by default. Enable exclude_intrusive: false only with explicit authorization for DAST-style testing.",
  inputSchema: {
    target: z.string().describe("URL or hostname to scan"),
    severity: z.array(z.enum(SEVERITY_VALUES)).optional().default(["medium", "high", "critical"]).describe("Minimum severity levels to include"),
    template_tags: z.array(z.string()).optional().describe("Nuclei template tags to filter by, e.g. ['cve', 'exposed-panels']"),
    exclude_intrusive: z.boolean().optional().default(true).describe("Exclude templates tagged 'dos', 'fuzz', 'intrusive'. Set to false only with explicit authorization"),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async execute(input: NucleiScanInput) {
    const params = nucleiScanSchema.parse(input);

    loadScope();

    const cleanTarget = params.target.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
    const check = isTargetInScope(cleanTarget);
    if (!check.inScope) {
      const msg = `Target ${cleanTarget} is out of scope: ${check.reason}`;
      logAudit({
        tool_name: "cybersec_nuclei_scan",
        input_params: params as unknown as Record<string, unknown>,
        scope_check_result: "REJECTED",
        executed: false,
        result_summary: msg,
        actor: "mcp-server",
        error: msg,
      });
      return { content: [{ type: "text", text: msg }], isError: true };
    }

    const rl = checkRateLimit("nuclei");
    if (!rl.allowed) {
      return {
        content: [{ type: "text", text: `Rate limit exceeded. Retry in ${Math.ceil(rl.resetAfterMs / 1000)}s.` }],
        isError: true,
      };
    }

    const args: string[] = ["-json", "-silent"];

    args.push("-severity", params.severity.join(","));

    if (params.exclude_intrusive) {
      args.push("-exclude-tags", "dos,fuzz,intrusive");
    }

    if (params.template_tags && params.template_tags.length > 0) {
      args.push("-tags", params.template_tags.join(","));
    }

    args.push("-u", params.target);

    const intensity = getIntensityLevel();
    if (intensity === "safe") {
      args.push("-rl", "30");
      args.push("-bs", "10");
    }

    try {
      const output = execFileSync("nuclei", args, {
        encoding: "utf-8",
        timeout: 600_000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const findings = output
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

      const templatesVersion = getNucleiVersion();

      logAudit({
        tool_name: "cybersec_nuclei_scan",
        input_params: params as unknown as Record<string, unknown>,
        scope_check_result: "PASS",
        executed: true,
        result_summary: `Found ${findings.length} findings`,
        actor: "mcp-server",
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              target: params.target,
              findings,
              templates_version: templatesVersion,
            }),
          },
        ],
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes("exit code 1") && err.message.includes("No results found")) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                target: params.target,
                findings: [],
                templates_version: getNucleiVersion(),
              }),
            },
          ],
        };
      }

      const msg = `nuclei execution failed. Is nuclei installed?\nTry: go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest\nThen: nuclei -ut (update templates)\nError: ${err instanceof Error ? err.message : String(err)}`;

      logAudit({
        tool_name: "cybersec_nuclei_scan",
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

function getNucleiVersion(): string {
  try {
    const out = execFileSync("nuclei", ["-version"], { encoding: "utf-8", timeout: 5000 });
    return out.trim().split("\n")[0] ?? "unknown";
  } catch {
    return "unknown";
  }
}
