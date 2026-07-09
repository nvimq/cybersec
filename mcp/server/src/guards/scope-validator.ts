import { readFileSync, existsSync } from "fs";
import { Address4, Address6 } from "ip-address";
import micromatch from "micromatch";
import { homedir } from "os";
import { join, resolve } from "path";
import { load as parseYaml } from "js-yaml";

export interface ScopeConfig {
  engagement_id: string;
  authorized_by: string;
  authorization_doc: string;
  valid_until: string;
  in_scope: string[];
  out_of_scope: string[];
  intensity: "safe" | "standard" | "aggressive";
}

let cachedScope: ScopeConfig | null = null;
let scopePath: string | null = null;

function findScopeFile(): string | null {
  const candidates = [
    resolve("mcp/scope.yaml"),
    resolve("mcp/scope.yml"),
    resolve("scope.yaml"),
    resolve("scope.yml"),
    join(homedir(), ".cybersec-mcp", "scope.yaml"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

export function loadScope(path?: string): ScopeConfig {
  const file = path ?? findScopeFile();
  if (!file) {
    throw new Error(
      "No scope.yaml found. Create one from mcp/scope-template.yaml:\n" +
        "  cp mcp/scope-template.yaml mcp/scope.yaml\n" +
        "  # then edit scope.yaml with your authorized targets"
    );
  }
  if (cachedScope && scopePath === file) return cachedScope;
  scopePath = file;
  const raw = readFileSync(file, "utf-8");
  const parsed = parseYaml(raw) as Record<string, unknown>;
  cachedScope = validateScopeConfig(parsed);
  return cachedScope;
}

export function getScopePath(): string | null {
  return scopePath;
}

function validateScopeConfig(cfg: Record<string, unknown>): ScopeConfig {
  if (!cfg.engagement_id || !cfg.authorized_by || !cfg.valid_until) {
    throw new Error("scope.yaml must contain engagement_id, authorized_by, and valid_until");
  }
  if (!Array.isArray(cfg.in_scope) || cfg.in_scope.length === 0) {
    throw new Error("scope.yaml must have at least one in_scope entry");
  }
  if (!Array.isArray(cfg.out_of_scope)) {
    cfg.out_of_scope = [];
  }
  const intensity = cfg.intensity as string;
  if (!["safe", "standard", "aggressive"].includes(intensity)) {
    cfg.intensity = "safe";
  }
  checkExpiry(cfg.valid_until as string);
  return cfg as unknown as ScopeConfig;
}

function checkExpiry(validUntil: string): void {
  const expiry = new Date(validUntil);
  if (isNaN(expiry.getTime())) {
    throw new Error(`Invalid valid_until date: "${validUntil}". Use ISO 8601 format (e.g. 2026-08-01).`);
  }
  if (expiry < new Date()) {
    throw new Error(
      `Scope file expired on ${validUntil}. Update valid_until or create a new scope file.`
    );
  }
}

function isIp(str: string): boolean {
  try {
    new Address4(str);
    return true;
  } catch {
    try {
      new Address6(str);
      return true;
    } catch {
      return false;
    }
  }
}

function isGlob(str: string): boolean {
  return str.includes("*") || str.includes("?");
}

function ipInRange(ip: string, range: string): boolean {
  try {
    if (range.includes("/")) {
      if (Address4.isValid(ip) && Address4.isValid(range.split("/")[0])) {
        const addr = new Address4(ip);
        const subnet = new Address4(range);
        return addr.isInSubnet(subnet);
      }
      if (Address6.isValid(ip)) {
        const addr = new Address6(ip);
        const subnet = new Address6(range);
        return addr.isInSubnet(subnet);
      }
    }
  } catch {
    return false;
  }
  return false;
}

export function isTargetInScope(target: string): { inScope: boolean; reason: string } {
  if (!cachedScope) {
    throw new Error("Scope not loaded. Call loadScope() first.");
  }

  const s = cachedScope;

  const outOfScopeMatch = s.out_of_scope.some((rule) => {
    if (isGlob(rule)) return micromatch.isMatch(target, rule);
    if (isIp(rule) && isIp(target)) return rule === target || ipInRange(target, rule);
    return target === rule || target.startsWith(rule + ".") || target.startsWith(rule + "/");
  });

  if (outOfScopeMatch) {
    return { inScope: false, reason: `Target explicitly excluded by out_of_scope rule` };
  }

  const inScopeMatch = s.in_scope.some((rule) => {
    if (isGlob(rule)) return micromatch.isMatch(target, rule);
    if (isIp(rule) && isIp(target)) return rule === target || ipInRange(target, rule);
    if (rule.includes("/") && !isIp(rule)) return false;
    return target === rule || target.endsWith("." + rule);
  });

  if (!inScopeMatch) {
    return {
      inScope: false,
      reason: `Target ${target} does not match any in_scope entry. Add it to scope.yaml or confirm authorization.`,
    };
  }

  return { inScope: true, reason: "Matched in_scope rule" };
}

export function getIntensityLevel(): "safe" | "standard" | "aggressive" {
  return cachedScope?.intensity ?? "safe";
}

export function clearScope(): void {
  cachedScope = null;
  scopePath = null;
}
