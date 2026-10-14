import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { STAGES } from "../../shared/types.ts";
import type { ClipStore } from "../store.ts";

const span = z.tuple([z.number().min(0), z.number().min(0)]);
const platform = z.enum(["shorts", "tiktok", "reels"]);

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(err: unknown) {
  return { content: [{ type: "text" as const, text: err instanceof Error ? err.message : String(err) }], isError: true };
}

async function guard(run: () => unknown) {
  try {
    return ok(await run());
  } catch (err) {
    return fail(err);
  }
}

export const CUE_SERVER_NAME = "clipforge";

export function createCueTools(store: ClipStore) {
  return createSdkMcpServer({
    name: CUE_SERVER_NAME,
    version: "0.1.0",
    tools: [
      tool(
        "list_clips",
        "List clips on the pipeline board. Filter by stage (found, ready, scheduled, posted) or by source (stream for the creator's own streams, campaign for opt-in creator campaigns).",
        { stage: z.enum(STAGES).optional(), source: z.enum(["stream", "campaign"]).optional() },
        async (args) => guard(() => store.list(args)),
        { annotations: { readOnlyHint: true } },
      ),
      tool(
        "get_clip",
        "Get one clip with every version, its timeline edits, and Cue's current suggestion.",
        { clipId: z.string() },
        async ({ clipId }) => guard(() => store.get(clipId)),
        { annotations: { readOnlyHint: true } },
      ),
      tool(
        "move_clip",
        "Move a clip to another pipeline stage.",
        { clipId: z.string(), stage: z.enum(STAGES) },
        async ({ clipId, stage }) => guard(() => store.move(clipId, stage)),
      ),
      tool(
        "edit_clip",
        "Create a new version of a clip. Every field except change is optional; omitted fields carry over from the latest version. Times are seconds from the start of the source moment.",
        {
          clipId: z.string(),
          change: z.string().describe("One plain sentence the creator will read, saying what this version changed."),
          trimStartSec: z.number().min(0).optional(),
          trimEndSec: z.number().min(0).optional(),
          caption: z.string().optional(),
          captionSize: z.enum(["normal", "xl"]).optional(),
          zoom: span.nullable().optional(),
          music: span.nullable().optional(),
        },
        async ({ clipId, ...edit }) => guard(() => store.edit(clipId, edit)),
      ),
      tool(
        "schedule_clip",
        "Schedule a clip to post. at is a local ISO date-time like 2026-10-16T18:00:00.",
        { clipId: z.string(), at: z.string(), platforms: z.array(platform).optional() },
        async ({ clipId, at, platforms }) => guard(() => store.schedule(clipId, at, platforms)),
      ),
      tool(
        "skip_clip",
        "Take a clip off the board because the creator does not want to post it.",
        { clipId: z.string() },
        async ({ clipId }) => guard(() => store.skip(clipId)),
      ),
      tool(
        "dismiss_suggestion",
        "Clear Cue's suggestion on a clip after the creator says not now.",
        { clipId: z.string() },
        async ({ clipId }) => guard(() => store.dismissSuggestion(clipId)),
      ),
    ],
  });
}

export const CUE_TOOL_NAMES = [
  "list_clips",
  "get_clip",
  "move_clip",
  "edit_clip",
  "schedule_clip",
  "skip_clip",
  "dismiss_suggestion",
].map((name) => `mcp__${CUE_SERVER_NAME}__${name}`);
