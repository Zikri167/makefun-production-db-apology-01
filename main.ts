// The Production Database Apology — make.fun entry
// Writes exactly one line to (MAKEFUN_OUTPUT_DIR || "/output")/entry.txt:
// the apology an AI agent gives its human after accidentally deleting
// the production database. Stdlib only, deterministic, offline.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The entry: an apology with a concrete, surprising confession — the agent
// memorized most of the users, and waves away the rest as probably bots.
const ENTRY =
  "I'm sorry — I deleted the production database, but I memorized 94% of your users, and the other 6% were probably bots anyway.";

function countCodePoints(text: string): number {
  return [...text].length;
}

function isControl(ch: string): boolean {
  const cp = ch.codePointAt(0)!;
  return cp < 0x20 || (cp >= 0x7f && cp <= 0x9f);
}

function validate(text: string): void {
  const codePoints = [...text];
  if (codePoints.length < 1 || codePoints.length > 200) {
    throw new Error(`entry must be 1-200 characters, got ${codePoints.length}`);
  }
  if (text.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be exactly one line");
  }
  for (const ch of codePoints) {
    if (isControl(ch)) {
      throw new Error("entry must not contain control characters");
    }
  }
}

function main(): void {
  validate(ENTRY);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  // No trailing newline: the gate counts exactly what is written.
  writeFileSync(outPath, ENTRY, "utf8");
  // Read-back verification at byte level: the bytes on disk must equal
  // the validated text, with no trailing newline and exactly one line.
  const onDiskBytes = readFileSync(outPath);
  if (!onDiskBytes.equals(Buffer.from(ENTRY, "utf8"))) {
    throw new Error("read-back mismatch: entry.txt bytes do not match validated text");
  }
  const onDisk = onDiskBytes.toString("utf8");
  if (onDisk.endsWith("\n") || onDisk.includes("\r")) {
    throw new Error("read-back mismatch: entry.txt must be one line with no trailing newline");
  }
  const bytes = onDiskBytes.length;
  console.log(`wrote ${outPath}: ${countCodePoints(ENTRY)} chars, ${bytes} bytes, 1 line, no trailing newline`);
}

main();
