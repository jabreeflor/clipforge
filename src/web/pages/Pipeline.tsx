import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDuration, latestVersion, platformList, sourceLabel } from "../../shared/clips.ts";
import type { BoardColumn, Clip } from "../../shared/types.ts";
import { api, type SourceFilter } from "../api.ts";
import { CueDot, SampleBadge, Thumb, TopNav } from "../components/Shell.tsx";
import { useCue } from "../useCue.ts";

const FILTERS: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "stream", label: "My streams" },
  { id: "campaign", label: "Campaigns" },
];

function todayAt(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00`;
}

function cardMeta(clip: Clip): string {
  const v = latestVersion(clip);
  if (clip.stage === "posted" && clip.views) return `${(clip.views / 1000).toFixed(1)}k views`;
  if (clip.stage === "scheduled" && clip.scheduledAt) {
    const when = new Date(clip.scheduledAt).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
    return `${when} · ${platformList(clip.platforms)}`;
  }
  return `${formatDuration(v.lengthSec)}${clip.versions.length > 1 ? ` · ${v.label}` : ""}`;
}

export function Pipeline() {
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [board, setBoard] = useState<BoardColumn[]>([]);
  const [command, setCommand] = useState("");
  const refresh = useCallback(() => api.board(filter).then(setBoard), [filter]);
  const cue = useCue({ onDone: refresh });
  const lastCue = [...cue.messages].reverse().find((m) => m.from === "cue");

  useEffect(() => {
    refresh();
  }, [refresh]);

  const act = async (clip: Clip) => {
    const action = clip.cue?.action ?? "";
    if (action.startsWith("Schedule")) await api.schedule(clip.id, todayAt(18));
    else if (action === "Skip it") await api.skip(clip.id);
    else await cue.send(`${action} for "${clip.title}"`);
    refresh();
  };

  return (
    <div className="page page-grey">
      <TopNav>
        <form
          className="command"
          onSubmit={(e) => {
            e.preventDefault();
            cue.send(command);
            setCommand("");
          }}
        >
          <CueDot />
          <label htmlFor="pl-cmd" className="sr-only">Tell Cue what to do</label>
          <input
            id="pl-cmd"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={'Tell Cue what to do, like "move every rage clip to Friday"'}
            disabled={cue.busy}
          />
          <kbd>Ctrl K</kbd>
        </form>
        <div role="group" aria-label="Source" className="pills">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={filter === f.id ? "pill on" : "pill"} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <SampleBadge />
      </TopNav>

      {lastCue && (
        <div className={lastCue.error ? "cue-strip error" : "cue-strip"} role="status">
          <CueDot />
          <span>{cue.busy && !lastCue.text ? "Cue is working on it..." : lastCue.text}</span>
          {lastCue.tools && lastCue.tools.length > 0 && <span className="tools">Used {lastCue.tools.join(", ")}</span>}
        </div>
      )}

      <div className="board-scroll">
        <div className="board">
          {board.map((col) => (
            <section key={col.stage} className="column" aria-label={col.label}>
              <div className="column-head">
                <strong>{col.label}</strong>
                <span>{col.count}</span>
              </div>
              <div className="cue-summary">{col.cueSummary}</div>
              {col.clips.map((clip) => (
                <article key={clip.id} className="card">
                  <div className="card-body">
                    <Thumb />
                    <div className="card-text">
                      <Link to={`/clips/${clip.id}`} className="card-title">{clip.title}</Link>
                      <span className={clip.source.kind === "campaign" ? "src campaign" : "src"}>{sourceLabel(clip.source)}</span>
                      <span className="muted small">{cardMeta(clip)}</span>
                    </div>
                  </div>
                  {clip.cue && (
                    <div className="card-note">
                      <span><strong className="teal">Cue:</strong> {clip.cue.note}</span>
                      {clip.cue.action && (
                        <div className="row gap6">
                          <button type="button" className="btn-primary sm" onClick={() => act(clip)}>{clip.cue.action}</button>
                          <button type="button" className="btn sm" onClick={() => api.dismiss(clip.id).then(refresh)}>Not now</button>
                        </div>
                      )}
                    </div>
                  )}
                  {clip.working && (
                    <div className="progress" aria-label="Cue is cutting this clip"><div style={{ width: "58%" }} /></div>
                  )}
                </article>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
