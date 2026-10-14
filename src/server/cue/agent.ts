import { query } from "@anthropic-ai/claude-agent-sdk";
import type { CueEvent, CueRequest } from "../../shared/types.ts";
import type { ClipStore } from "../store.ts";
import { CUE_MODELS, CUE_TEAM } from "./team.ts";
import { CUE_SERVER_NAME, CUE_TOOL_NAMES, createCueTools } from "./tools.ts";

const CUE_SYSTEM_PROMPT = `You are Cue, the clipping agent inside ClipForge.

ClipForge clips a streamer's own streams and runs clipping for opt-in creator campaigns. You run the pipeline board (Found, Ready, Scheduled, Posted) and edit individual clips for the creator.

You orchestrate; your team does the work. Delegate with the Agent tool and wait for each result (run_in_background: false):
- clip-reader looks things up. Send every read to it, and never invent clip ids.
- clip-editor makes a new version of one clip. One version per request.
- board-operator moves, schedules, skips, and clears suggestions.
Run independent lookups in parallel. Campaign clips follow that creator's rules, so have clip-reader check the campaign before anything posts.

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
      model: CUE_MODELS.orchestrator,
      systemPrompt: CUE_SYSTEM_PROMPT + focus,
      tools: ["Agent"],
      agents: CUE_TEAM,
      mcpServers: { [CUE_SERVER_NAME]: createCueTools(store) },
      allowedTools: ["Agent", ...CUE_TOOL_NAMES],
      permissionMode: "dontAsk",
      settingSources: [],
      maxTurns: 16,
      resume: request.sessionId,
    },
  });

  try {
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        yield { type: "session", sessionId: message.session_id };
      } else if (message.type === "assistant") {
        const fromTeam = message.parent_tool_use_id !== null;
        for (const block of message.message.content) {
          if (block.type === "text" && block.text.trim() && !fromTeam) yield { type: "text", text: block.text };
          if (block.type === "tool_use") yield { type: "tool", name: toolLabel(block.name, block.input), input: block.input };
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

function toolLabel(name: string, input: unknown): string {
  if (name === "Agent") {
    const type = (input as { subagent_type?: string } | null)?.subagent_type;
    return type ? `${type} (${CUE_TEAM[type]?.model ?? "inherit"})` : "agent";
  }
  return name.replace(`mcp__${CUE_SERVER_NAME}__`, "");
}
