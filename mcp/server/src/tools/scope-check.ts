import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import { isTargetInScope, loadScope, getScopePath } from "../guards/scope-validator.js";

export const scopeCheckSchema = z.object({
  target: z.string().min(1, "Target is required").max(500, "Target too long"),
});

export type ScopeCheckInput = z.infer<typeof scopeCheckSchema>;

export const scopeCheckTool: ToolDefinition = {
  name: "cybersec_scope_check",
  description:
    "Validate whether a target (IP/CIDR/hostname/URL) is within the currently loaded authorization scope. All other tools call this internally before executing; also exposed directly so an agent can pre-check a target before planning a multi-step scan.",
  inputSchema: {
    target: z.string().describe("IP address, CIDR range, or hostname to validate"),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  async execute(input: ScopeCheckInput) {
    const { target } = scopeCheckSchema.parse(input);

    try {
      loadScope();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              target,
              in_scope: false,
              scope_file: null,
              matched_rule: null,
              reason: message,
            }),
          },
        ],
        isError: true,
      };
    }

    const result = isTargetInScope(target);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            target,
            in_scope: result.inScope,
            scope_file: getScopePath(),
            matched_rule: result.inScope ? result.reason : null,
            reason: result.inScope ? null : result.reason,
          }),
        },
      ],
    };
  },
};
