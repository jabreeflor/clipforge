import type { BoardColumn, Clip, CueEvent, CueRequest, Platform, Stage } from "../shared/types.ts";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: res.statusText }))).error);
  return res.json() as Promise<T>;
}

const post = (url: string, body?: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });

export type SourceFilter = "all" | "stream" | "campaign";

export const api = {
  board: (source: SourceFilter) => fetch(`/api/board${source === "all" ? "" : `?source=${source}`}`).then(json<BoardColumn[]>),
  clips: () => fetch("/api/clips").then(json<Clip[]>),
  clip: (id: string) => fetch(`/api/clips/${id}`).then(json<Clip>),
  move: (id: string, stage: Stage) => post(`/api/clips/${id}/move`, { stage }).then(json<Clip>),
  schedule: (id: string, at: string, platforms?: Platform[]) => post(`/api/clips/${id}/schedule`, { at, platforms }).then(json<Clip>),
  skip: (id: string) => post(`/api/clips/${id}/skip`).then(json<Clip>),
  dismiss: (id: string) => post(`/api/clips/${id}/dismiss`).then(json<Clip>),
};

export async function* askCue(request: CueRequest): AsyncGenerator<CueEvent> {
  const res = await post("/api/cue", request);
  if (!res.ok || !res.body) {
    yield { type: "error", message: `Cue request failed (${res.status})` };
    return;
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const data = frame.split("\n").find((line) => line.startsWith("data:"));
      if (data) yield JSON.parse(data.slice(5).trim()) as CueEvent;
    }
  }
}
