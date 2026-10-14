import { query } from "@anthropic-ai/claude-agent-sdk";
import type { CueEvent, CueRequest } from "../../shared/types.ts";
import type { ClipStore } from "../store.ts";
import { CUE_SERVER_NAME, CUE_TOOL_NAMES, createCueTools } from "./tools.ts";

const CUE_SYSTEM_PROMPT = `You are Cue, the clipping agent inside ClipForge.

ClipForge clips a streamer's own streams and runs clipping for opt-in creator campaigns. You work the pipeline board (Found, Ready, Scheduled, Posted) and edit individual clips for the creator.

Use the clipforge tools to read and change clips. Never invent clip ids; look them up. When you edit a clip, make one new version per request and describe the change in one plain sentence. Campaign clips follow that creator's rules, so check the campaign before posting.

Reply like a teammate in chat: short, plain sentences, no markdown headings, and say what you changed.`;

export function cueAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN);
}

export async function* runCue(store: ClipStore, request: CueRequest): AsyncGenerator<CueEvent> {
  if (!cueAvailable()) {
    yield { type: "error", message: "Cue is offline. Set ANTHROPIC_API_KEY on the server to talk to Cue." };
    return;
  }

  const focus = request.clipId ? `\n\nThe creator has clip "${request.clipId}" open in the editor. Work on that clip only unless they say otherwise.` : "";

  const stream = query({
    prompt: request.prompt,
    options: {
      model: process.env.CUE_MODEL ?? "claude-opus-5-5",
      systemPrompt: CUE_SYSTEM_PROMPT + focus,
      tools: [],
      mcpServers: { [CUE_SERVER_NAME]: createCueTools(store) },
      allowedTools: CUE_TOOL_NAMES,
      permissionMode: "dontAsk",
      settingSources: [],
      maxTurns: 12,
      resume: request.sessionId,
    },
  });

  try {
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        yield { type: "session", sessionId: message.session_id };
      } else if (message.type === "assistant") {
        for (const block of message.message.content) {
          if (block.type === "text" && block.text.trim()) yield { type: "text", text: block.text };
          if (block.type === "tool_use") yield { type: "tool", name: block.name.replace(`mcp__${CUE_SERVER_NAME}__`, ""), input: block.input };
        }
      } else if (message.type === "result") {
        if (message.subtype === "success") yield { type: "done", costUsd: message.total_cost_usd };
        else yield { type: "error", message: `Cue stopped: ${message.subtype}` };
      }
    }
  } catch (err) {
    yield { type: "error", message: err instanceof Error ? err.message : String(err) };
  }
}
