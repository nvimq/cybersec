import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import * as readline from "readline";

const CONSENT_DIR = join(homedir(), ".cybersec-mcp");
const CONSENT_FILE = join(CONSENT_DIR, "aup-consent.txt");

const AUP_TEXT = `
╔══════════════════════════════════════════════════════════════╗
║               CYBERSEC MCP — ACCEPTABLE USE POLICY          ║
╠══════════════════════════════════════════════════════════════╣
║  By using this tool, you confirm that:                      ║
║                                                              ║
║  1. You have WRITTEN AUTHORIZATION to test EVERY target     ║
║     you add to the scope file.                              ║
║                                                              ║
║  2. You are solely responsible for compliance with          ║
║     applicable laws (CFAA, Computer Misuse Act, GDPR        ║
║     Art. 32, and equivalents in your jurisdiction).         ║
║                                                              ║
║  3. This tool is for AUTHORIZED SECURITY TESTING ONLY.      ║
║     Unauthorized use may violate criminal laws.             ║
║                                                              ║
║  4. You will not use this tool against any target without   ║
║     explicit prior authorization.                           ║
║                                                              ║
║  The authors assume NO LIABILITY for misuse.                ║
╚══════════════════════════════════════════════════════════════╝
`;

export function ensureAupConsent(): void {
  if (process.env.CYBERSEC_MCP_AUP_ACCEPTED === "1") {
    return;
  }

  if (existsSync(CONSENT_FILE)) {
    const stored = readFileSync(CONSENT_FILE, "utf-8").trim();
    if (stored === "accepted") return;
  }

  console.log(AUP_TEXT);
  console.log("");
  console.log("Type 'yes' to accept and continue, or anything else to exit.");

  if (!process.stdin.isTTY) {
    console.error("Non-TTY environment: set CYBERSEC_MCP_AUP_ACCEPTED=1 if you have organizational approval.");
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const onSigint = (): void => {
    rl.close();
    console.log("\nConsent not given. Exiting.");
    process.exit(1);
  };

  process.on("SIGINT", onSigint);

  rl.question("> ", (answer: string) => {
    process.removeListener("SIGINT", onSigint);
    rl.close();
    if (answer.trim().toLowerCase() === "yes") {
      if (!existsSync(CONSENT_DIR)) {
        mkdirSync(CONSENT_DIR, { recursive: true });
      }
      writeFileSync(CONSENT_FILE, "accepted\n", "utf-8");
      console.log("Consent recorded. Starting server...\n");
    } else {
      console.log("Consent not given. Exiting.");
      process.exit(1);
    }
  });
}
