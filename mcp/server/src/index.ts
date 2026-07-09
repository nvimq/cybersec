import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { loadScope, getScopePath } from "./guards/scope-validator.js";
import { setEngagementId, logAudit } from "./guards/audit-logger.js";
import { ensureAupConsent } from "./guards/aup-consent.js";
import { z } from "zod";
import type { ToolDefinition } from "./types.js";
import { scopeCheckTool } from "./tools/scope-check.js";
import { httpxProbeTool } from "./tools/httpx-probe.js";
import { nmapScanTool } from "./tools/nmap-scan.js";
import { gobusterDirTool } from "./tools/gobuster-dir.js";
import { nucleiScanTool } from "./tools/nuclei-scan.js";

function zodTypeToJsonSchema(zodType: z.ZodTypeAny): Record<string, unknown> {
  const def = (zodType as any)._def;
  const description = def?.description ?? undefined;

  const unwrap = (t: z.ZodTypeAny): z.ZodTypeAny => {
    const d = (t as any)._def;
    if (d?.typeName === "ZodOptional" || d?.typeName === "ZodDefault") return unwrap(d.innerType ?? d.innerType?.innerType ?? t);
    return t;
  };

  switch (def?.typeName) {
    case "ZodString": {
      const s: Record<string, unknown> = { type: "string" };
      if (description) s.description = description;
      return s;
    }
    case "ZodNumber": {
      const n: Record<string, unknown> = { type: "number" };
      if (description) n.description = description;
      return n;
    }
    case "ZodBoolean": {
      const b: Record<string, unknown> = { type: "boolean" };
      if (description) b.description = description;
      return b;
    }
    case "ZodEnum": {
      const e: Record<string, unknown> = { type: "string", enum: def.values };
      if (description) e.description = description;
      return e;
    }
    case "ZodUnion": {
      const items = def.options.map((o: z.ZodTypeAny) => zodTypeToJsonSchema(o));
      const u: Record<string, unknown> = { oneOf: items };
      if (description) u.description = description;
      return u;
    }
    case "ZodArray": {
      const a: Record<string, unknown> = {
        type: "array",
        items: zodTypeToJsonSchema(def.type),
      };
      if (description) a.description = description;
      if (def.minLength !== null) a.minItems = def.minLength;
      if (def.maxLength !== null) a.maxItems = def.maxLength;
      return a;
    }
    case "ZodOptional": {
      return zodTypeToJsonSchema(def.innerType);
    }
    case "ZodDefault": {
      const inner = def.innerType;
      if (inner?._def?.typeName === "ZodOptional") {
        return zodTypeToJsonSchema(inner);
      }
      return zodTypeToJsonSchema(inner ?? def.innerType);
    }
    case "ZodLiteral": {
      const valType = typeof def.value === "number" ? "number" : typeof def.value === "boolean" ? "boolean" : "string";
      const l: Record<string, unknown> = { type: valType, enum: [def.value] };
      if (description) l.description = description;
      return l;
    }
    case "ZodNullable": {
      const base = zodTypeToJsonSchema(def.innerType);
      base.type = [base.type as string, "null"];
      return base;
    }
    case "ZodEffects": {
      return zodTypeToJsonSchema(def.schema ?? def.innerType);
    }
    case "ZodIntersection": {
      return { allOf: [zodTypeToJsonSchema(def.left), zodTypeToJsonSchema(def.right)] };
    }
    case "ZodRecord": {
      return { type: "object", additionalProperties: zodTypeToJsonSchema(def.valueType) };
    }
    default: {
      const r: Record<string, unknown> = {};
      if (description) r.description = description;
      return r;
    }
  }
}

function zodSchemaToJsonSchema(schema: Record<string, z.ZodTypeAny>): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, zodType] of Object.entries(schema)) {
    const def = (zodType as any)._def;
    const isOptional = def?.typeName === "ZodOptional" ||
      def?.typeName === "ZodDefault" ||
      (def?.innerType?._def?.typeName === "ZodOptional");
    if (!isOptional) required.push(key);
    properties[key] = zodTypeToJsonSchema(zodType);
  }

  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

const tools: ToolDefinition[] = [
  scopeCheckTool,
  httpxProbeTool,
  nmapScanTool,
  gobusterDirTool,
  nucleiScanTool,
];

async function initScope(): Promise<void> {
  try {
    const scope = loadScope();
    setEngagementId(scope.engagement_id);
    console.error(`[server] Scope loaded: ${scope.engagement_id} (from ${getScopePath()})`);
  } catch (err) {
    console.error(`[server] WARNING: No scope file loaded. Tools will refuse to execute.`);
    console.error(`[server] Create mcp/scope.yaml from mcp/scope-template.yaml`);
  }
}

const server = new Server(
  {
    name: "cybersec-mcp",
    version: "1.0.0",
    description: "MCP server for CyberSec Toolkit — wraps nmap, gobuster, httpx, nuclei with scope-based guardrails, rate limiting, audit logging, and blast-radius annotations.",
  },
  {
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
  }
);

function getToolAnnotations(tool: ToolDefinition): Record<string, boolean> {
  return {
    readOnlyHint: tool.annotations.readOnlyHint,
    destructiveHint: tool.annotations.destructiveHint,
    idempotentHint: tool.annotations.idempotentHint,
    openWorldHint: tool.annotations.openWorldHint,
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodSchemaToJsonSchema(t.inputSchema as Record<string, z.ZodTypeAny>),
    annotations: getToolAnnotations(t),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments ?? {};

  const tool = tools.find((t) => t.name === toolName);
  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
  }

  if (toolName !== "cybersec_scope_check" && !getScopePath()) {
    return {
      content: [
        {
          type: "text",
          text: "No scope file loaded. Create mcp/scope.yaml from mcp/scope-template.yaml first.",
        },
      ],
      isError: true,
    };
  }

  console.error(`[server] Calling ${toolName} with args:`, JSON.stringify(args).slice(0, 500));
  const result = await tool.execute(args);
  return result;
});

async function main(): Promise<void> {
  ensureAupConsent();
  await initScope();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[server] cybersec-mcp ready on stdio");
}

main().catch((err) => {
  console.error("[server] Fatal error:", err);
  process.exit(1);
});
