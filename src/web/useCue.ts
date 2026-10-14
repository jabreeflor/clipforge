import { useCallback, useRef, useState } from "react";
import { askCue } from "./api.ts";

export interface ChatMessage {
  from: "cue" | "you";
  text: string;
  tools?: string[];
  error?: boolean;
}

export function useCue(options: { clipId?: string; greeting?: string; onDone?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(options.greeting ? [{ from: "cue", text: options.greeting }] : []);
  const [busy, setBusy] = useState(false);
  const session = useRef<string | undefined>(undefined);

  const send = useCallback(
    async (prompt: string) => {
      const text = prompt.trim();
      if (!text || busy) return;
      setBusy(true);
      setMessages((m) => [...m, { from: "you", text }, { from: "cue", text: "", tools: [] }]);
      const patchLast = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((all) => [...all.slice(0, -1), fn(all[all.length - 1] as ChatMessage)]);
      for await (const event of askCue({ prompt: text, clipId: options.clipId, sessionId: session.current })) {
        if (event.type === "session") session.current = event.sessionId;
        if (event.type === "text") patchLast((m) => ({ ...m, text: m.text ? `${m.text}\n\n${event.text}` : event.text }));
        if (event.type === "tool") patchLast((m) => ({ ...m, tools: [...(m.tools ?? []), event.name] }));
        if (event.type === "error") patchLast((m) => ({ ...m, text: event.message, error: true }));
      }
      setBusy(false);
      options.onDone?.();
    },
    [busy, options],
  );

  return { messages, busy, send };
}
