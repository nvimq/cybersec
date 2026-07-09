import { z } from "zod";
import { execFileSync } from "child_process";
import type { ToolDefinition } from "../types.js";
import { loadScope, isTargetInScope } from "../guards/scope-validator.js";
import { checkRateLimit } from "../guards/rate-limiter.js";
import { logAudit } from "../guards/audit-logger.js";

const PORT_RE = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;

export const nmapScanSchema = z.object({
  target: z.string().min(1, "Target is required").max(500, "Target too long").regex(/^[a-zA-Z0-9.:\-\/]+$/, "Target contains invalid characters"),
  scan_type: z.enum(["syn", "connect", "udp"]).default("connect"),
  ports: z.string().regex(PORT_RE, "Ports must be like '22,80,443' or '1-1000'").optional(),
  service_detection: z.boolean().default(false),
  timing: z.number().int().min(1).max(4).default(3),
});

export type NmapScanInput = z.infer<typeof nmapScanSchema>;

export const nmapScanTool: ToolDefinition = {
  name: "cybersec_nmap_scan",
  description:
    "Run an Nmap scan against a target within the authorized scope. Supports TCP SYN/connect scans and basic service/version detection. Target is validated against the active scope file before execution.",
  inputSchema: {
    target: z.string().describe("IP address, CIDR range, or hostname to scan"),
    scan_type: z.enum(["syn", "connect", "udp"]).optional().default("connect").describe("SYN scan requires elevated privileges (sudo)"),
    ports: z.string().optional().describe("Port range, e.g. '22,80,443' or '1-1000'. Defaults to top 1000"),
    service_detection: z.boolean().optional().default(false).describe("Enable service/version detection (-sV)"),
    timing: z.number().int().min(1).max(4).optional().default(3).describe("Nmap timing template (-T flag). T5 excluded — too aggressive for default use"),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async execute(input: NmapScanInput) {
    const params = nmapScanSchema.parse(input);

    loadScope();

    const check = isTargetInScope(params.target);
    if (!check.inScope) {
      const msg = `Target ${params.target} is not in the active scope file. Add it to scope.yaml before scanning, or confirm you have written authorization and update scope.\nReason: ${check.reason}`;
      logAudit({
        tool_name: "cybersec_nmap_scan",
        input_params: params as unknown as Record<string, unknown>,
        scope_check_result: "REJECTED",
        executed: false,
        result_summary: msg,
        actor: "mcp-server",
        error: msg,
      });
      return { content: [{ type: "text", text: msg }], isError: true };
    }

    if (params.scan_type === "syn" && process.getuid?.() !== 0) {
      const msg = "SYN scan (-sS) requires root. Use scan_type: 'connect' for TCP connect scan, or run as root.";
      return { content: [{ type: "text", text: msg }], isError: true };
    }

    const rl = checkRateLimit("nmap");
    if (!rl.allowed) {
      return {
        content: [{ type: "text", text: `Rate limit exceeded. Retry in ${Math.ceil(rl.resetAfterMs / 1000)}s.` }],
        isError: true,
      };
    }

    const args: string[] = [];

    switch (params.scan_type) {
      case "syn":
        args.push("-sS");
        break;
      case "connect":
        args.push("-sT");
        break;
      case "udp":
        args.push("-sU");
        break;
    }

    if (params.service_detection) args.push("-sV");

    args.push("-T", String(params.timing));
    args.push("--top-ports", "1000");

    if (params.ports) {
      args.pop();
      args.push("-p", params.ports);
    }

    args.push("-oX", "-");
    args.push(params.target);

    try {
      const output = execFileSync("nmap", args, {
        encoding: "utf-8",
        timeout: 600_000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const hosts = parseNmapXml(output);

      logAudit({
        tool_name: "cybersec_nmap_scan",
        input_params: params as unknown as Record<string, unknown>,
        scope_check_result: "PASS",
        executed: true,
        result_summary: `Scanned ${hosts.length} host(s)`,
        actor: "mcp-server",
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              target: params.target,
              scan_type: params.scan_type,
              hosts,
              scope_validated: true,
              raw_output_truncated: output.length > 50_000,
            }),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const hint = `nmap execution failed. Is nmap installed?`;

      const msg = `${hint}\nError: ${message}`;

      logAudit({
        tool_name: "cybersec_nmap_scan",
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

interface NmapHost {
  ip: string;
  status: "up" | "down";
  ports: Array<{
    port: number;
    protocol: string;
    state: string;
    service?: string;
    version?: string;
  }>;
}

function parseNmapXml(xml: string): NmapHost[] {
  const hosts: NmapHost[] = [];
  const hostBlocks = xml.match(/<host[^>]*>[\s\S]*?<\/host>/g) ?? [];

  for (const block of hostBlocks) {
    const addrMatch = block.match(/<address addr="([^"]+)"[^>]*\/>/);
    const statusMatch = block.match(/<status state="([^"]+)"\/>/);
    if (!addrMatch) continue;

    const host: NmapHost = {
      ip: addrMatch[1],
      status: statusMatch?.[1] === "up" ? "up" : "down",
      ports: [],
    };

    const portMatches = block.matchAll(/<port[^>]*>[\s\S]*?<\/port>/g);
    for (const pm of portMatches) {
      const portMatch = pm[0].match(/portid="(\d+)"/);
      const protocolMatch = pm[0].match(/protocol="([^"]+)"/);
      const stateMatch = pm[0].match(/<state state="([^"]+)"/);
      const serviceMatch = pm[0].match(/<service name="([^"]+)"/);
      const versionMatch = pm[0].match(/product="([^"]+)"/);

      if (portMatch) {
        host.ports.push({
          port: parseInt(portMatch[1], 10),
          protocol: protocolMatch?.[1] ?? "tcp",
          state: stateMatch?.[1] ?? "unknown",
          service: serviceMatch?.[1],
          version: versionMatch?.[1],
        });
      }
    }

    hosts.push(host);
  }

  return hosts;
}
