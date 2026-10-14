import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { CUE_SERVER_NAME } from "./tools.ts";

export const CUE_MODELS = {
  orchestrator: process.env.CUE_ORCHESTRATOR_MODEL ?? "claude-opus-5-5",
  implementer: process.env.CUE_IMPLEMENTER_MODEL ?? "claude-sonnet-5-5",
  fast: process.env.CUE_FAST_MODEL ?? "claude-haiku-5-5",
};

const mcp = (...names: string[]) => names.map((name) => `mcp__${CUE_SERVER_NAME}__${name}`);

export const CUE_TEAM: Record<string, AgentDefinition> = {
  "clip-reader": {
    description: "Reads the board and clips. Use for every lookup: finding clip ids, reading versions, checking what is scheduled.",
    prompt: "You read ClipForge data for Cue. Look up exactly what you were asked for and report it back as compact facts with clip ids. Never change anything.",
    model: CUE_MODELS.fast,
    tools: mcp("list_clips", "get_clip"),
    maxTurns: 6,
  },
  "clip-editor": {
    description: "Edits one clip into a new version: trims, captions, zooms, music. Give it the clip id and the creator's request.",
    prompt: "You edit one ClipForge clip for Cue. Read the clip, decide the exact edit in seconds, then make one new version with edit_clip. Describe the change in one plain sentence the creator will read. Report back the new version label and what changed.",
    model: CUE_MODELS.implementer,
    tools: mcp("get_clip", "edit_clip"),
    maxTurns: 6,
  },
  "board-operator": {
    description: "Moves, schedules, skips, and clears suggestions on clips. Give it clip ids and exact times.",
    prompt: "You carry out board changes for Cue: move, schedule, skip, or dismiss suggestions on the clips you were given. Do only what you were asked and report back each change.",
    model: CUE_MODELS.fast,
    tools: mcp("list_clips", "move_clip", "schedule_clip", "skip_clip", "dismiss_suggestion"),
    maxTurns: 8,
  },
};
