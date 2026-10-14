import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { STAGES } from "../shared/types.ts";
import { cueAvailable, runCue } from "./cue/agent.ts";
import type { ClipStore } from "./store.ts";

const sourceFilter = z.enum(["stream", "campaign"]).optional();

export function createApp(store: ClipStore) {
  const app = new Hono();

  app.onError((err, c) => c.json({ error: err.message }, 400));

  app.get("/api/health", (c) => c.json({ ok: true, cue: cueAvailable() }));

  app.get("/api/board", (c) => c.json(store.board({ source: sourceFilter.parse(c.req.query("source") || undefined) })));

  app.get("/api/clips", (c) => c.json(store.list({ source: sourceFilter.parse(c.req.query("source") || undefined) })));

  app.get("/api/clips/:id", (c) => c.json(store.get(c.req.param("id"))));

  app.post("/api/clips/:id/move", async (c) => {
    const { stage } = z.object({ stage: z.enum(STAGES) }).parse(await c.req.json());
    return c.json(store.move(c.req.param("id"), stage));
  });

  app.post("/api/clips/:id/schedule", async (c) => {
    const body = z
      .object({ at: z.string(), platforms: z.array(z.enum(["shorts", "tiktok", "reels"])).optional() })
      .parse(await c.req.json());
    return c.json(store.schedule(c.req.param("id"), body.at, body.platforms));
  });

  app.post("/api/clips/:id/skip", (c) => c.json(store.skip(c.req.param("id"))));

  app.post("/api/clips/:id/dismiss", (c) => c.json(store.dismissSuggestion(c.req.param("id"))));

  app.post("/api/cue", async (c) => {
    const request = z
      .object({ prompt: z.string().min(1), clipId: z.string().optional(), sessionId: z.string().optional() })
      .parse(await c.req.json());
    return streamSSE(c, async (sse) => {
      for await (const event of runCue(store, request)) {
        await sse.writeSSE({ event: event.type, data: JSON.stringify(event) });
      }
    });
  });

  return app;
}
