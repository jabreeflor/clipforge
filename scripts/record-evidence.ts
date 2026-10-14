import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { chromium } from "playwright";
import { tours } from "./evidence/tours.ts";

const name = process.argv[2] ?? "scaffold";
const tour = tours[name];
if (!tour) {
  console.error(`Unknown tour "${name}". Known tours: ${Object.keys(tours).join(", ")}`);
  process.exit(1);
}

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const srv = createServer().listen(0, () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
  });
}

async function waitFor(url: string) {
  for (let i = 0; i < 100; i++) {
    if (await fetch(url).then((r) => r.ok, () => false)) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server never came up at ${url}`);
}

execFileSync("npx", ["vite", "build"], { stdio: "inherit" });
const port = await freePort();
const server = spawn(process.execPath, ["--import", "tsx", "src/server/index.ts"],{ env: { ...process.env, PORT: String(port) }, stdio: "inherit" });
const base = `http://localhost:${port}`;
const outDir = "evidence";
const rawDir = join(outDir, ".raw");

try {
  await waitFor(`${base}/api/health`);
  mkdirSync(rawDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH });
  const context = await browser.newContext({
    baseURL: base,
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: rawDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await tour(page);
  const video = page.video();
  await context.close();
  await browser.close();
  const raw = await video?.path();
  if (!raw) throw new Error("Playwright did not record a video");
  const webm = join(outDir, `${name}.webm`);
  renameSync(raw, webm);
  const mp4 = join(outDir, `${name}.mp4`);
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28", "-movflags", "+faststart", mp4]);
    rmSync(webm);
    console.log(`Evidence video: ${mp4}`);
  } catch {
    console.log(`Evidence video: ${webm} (install ffmpeg to get an mp4)`);
  }
} finally {
  rmSync(rawDir, { recursive: true, force: true });
  server.kill();
}
