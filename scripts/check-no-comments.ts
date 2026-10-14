import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parse } from "@babel/parser";

const SCRIPT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const CSS = /\.css$/;
const HTML = /\.html$/;
const EXEMPT = /^(design|docs)\//;

interface Hit {
  file: string;
  line: number;
  text: string;
}

function scriptComments(file: string, text: string): Hit[] {
  const ast = parse(text, {
    sourceType: "module",
    errorRecovery: true,
    plugins: [file.endsWith("x") ? "jsx" : null, "typescript"].filter((p): p is "jsx" | "typescript" => p !== null),
  });
  return (ast.comments ?? []).map((c) => ({ file, line: c.loc?.start.line ?? 0, text: c.value.trim().split("\n")[0] ?? "" }));
}

function patternComments(file: string, text: string, pattern: RegExp): Hit[] {
  return [...text.matchAll(pattern)].map((m) => ({
    file,
    line: text.slice(0, m.index).split("\n").length,
    text: m[0].split("\n")[0] ?? "",
  }));
}

function trackedFiles(): string[] {
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" });
  return out.split("\n").filter((f) => f && !f.startsWith("node_modules/") && !EXEMPT.test(f));
}

const hits = trackedFiles().flatMap((file) => {
  if (SCRIPT.test(file)) return scriptComments(file, readFileSync(file, "utf8"));
  if (CSS.test(file)) return patternComments(file, readFileSync(file, "utf8"), /\/\*[\s\S]*?\*\//g);
  if (HTML.test(file)) return patternComments(file, readFileSync(file, "utf8"), /<!--[\s\S]*?-->/g);
  return [];
});

if (hits.length) {
  console.error(`Code comments are banned in this repo (see AGENTS.md). Found ${hits.length}:`);
  for (const h of hits) console.error(`  ${h.file}:${h.line}  ${h.text}`);
  process.exit(1);
}
console.log("No code comments found.");
