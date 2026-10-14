import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatDuration, platformList, sourceLabel } from "../../shared/clips.ts";
import { STAGE_LABELS, type Clip, type ClipVersion, type Span } from "../../shared/types.ts";
import { api } from "../api.ts";
import { CueDot, SampleBadge } from "../components/Shell.tsx";
import { useCue } from "../useCue.ts";

const SUGGESTIONS = ["Cut the slow start and make the captions bigger", "Zoom in on the last kill", "End it on my reaction and add some hype music"];

interface Block {
  span: Span;
  label: string;
  kind: "video" | "cam" | "cap" | "fx" | "music" | "audio";
  changed?: boolean;
}

function pos([a, b]: Span, total: number) {
  return { left: `${(a / total) * 100}%`, width: `${((b - a) / total) * 100}%` };
}

function overlaps(span: Span, hi: Span | null) {
  return !!hi && span[0] < hi[1] && span[1] > hi[0];
}

function changedSpan(prev: ClipVersion | undefined, cur: ClipVersion): Span | null {
  if (!prev) return null;
  if (JSON.stringify(prev.zoom) !== JSON.stringify(cur.zoom) && cur.zoom) return cur.zoom;
  if (JSON.stringify(prev.music) !== JSON.stringify(cur.music) && cur.music) return cur.music;
  const newCut = cur.cuts.find((c) => !prev.cuts.some((p) => p[0] === c[0] && p[1] === c[1]));
  return newCut ?? null;
}

function tracks(clip: Clip, v: ClipVersion, hi: Span | null): { name: string; blocks: Block[] }[] {
  const total = clip.sourceLengthSec;
  const capCount = 4;
  const words = v.caption.split(" ");
  const per = Math.ceil(words.length / capCount);
  const caps: Block[] = Array.from({ length: capCount }, (_, i) => {
    const span: Span = [1 + (i * (total - 2)) / capCount, 1 + ((i + 1) * (total - 2)) / capCount - 0.5];
    return { span, label: words.slice(i * per, (i + 1) * per).join(" ") || "...", kind: "cap" };
  });
  const fx: Block[] = [];
  if (v.captionSize === "xl") fx.push({ span: [4, 6], label: "Captions XL", kind: "fx" });
  if (v.zoom) fx.push({ span: v.zoom, label: "Zoom 1.6x", kind: "fx" });
  const mark = (b: Block): Block => ({ ...b, changed: b.span[1] - b.span[0] < total && overlaps(b.span, hi) });
  return [
    { name: "Gameplay", blocks: [{ span: [0, total], label: `${sourceLabel(clip.source)}`, kind: "video" }] },
    { name: "Facecam", blocks: [{ span: [0, total], label: "Top 38%", kind: "cam" }] },
    { name: "Captions", blocks: caps.map(mark) },
    { name: "Effects", blocks: fx.map(mark) },
    { name: "Music", blocks: v.music ? [mark({ span: v.music, label: "Hype track, low", kind: "music" })] : [] },
    { name: "Audio", blocks: [{ span: [0, total], label: "Stream audio", kind: "audio" }] },
  ];
}

export function ClipEditor() {
  const { id = "" } = useParams();
  const [clip, setClip] = useState<Clip | null>(null);
  const [view, setView] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const refresh = useCallback(() => api.clip(id).then((c) => { setClip(c); setView(null); }), [id]);
  const cueOptions = useMemo(
    () => ({ clipId: id, onDone: refresh, greeting: "I pulled this from your stream. Chat spammed for 40 seconds after it, so I think it is your best clip this week. What do you want to change?" }),
    [id, refresh],
  );
  const cue = useCue(cueOptions);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!clip) return <div className="page loading">Loading clip...</div>;

  const index = view ?? clip.versions.length - 1;
  const cur = clip.versions[index] as ClipVersion;
  const hi = changedSpan(clip.versions[index - 1], cur);
  const total = clip.sourceLengthSec;
  const ticks = Array.from({ length: Math.floor(total / 5) + 1 }, (_, i) => i * 5);
  const meta = clip.source.kind === "stream" ? `From your stream on ${clip.source.streamDate} at ${clip.source.timestamp}` : sourceLabel(clip.source);

  return (
    <div className="page">
      <header className="topbar">
        <strong className="brand">ClipForge</strong>
        <nav aria-label="Breadcrumb" className="crumbs">
          <Link to="/">Pipeline</Link>
          <span aria-hidden="true">/</span>
          <span>{STAGE_LABELS[clip.stage]}</span>
          <span aria-hidden="true">/</span>
          <strong>{clip.title}</strong>
        </nav>
        <SampleBadge />
        <div className="row gap8 push">
          <button type="button" className="btn">Export</button>
          <Link to="/planner" className="btn-primary">Schedule</Link>
        </div>
      </header>

      <div className="editor">
        <section aria-label="Chat with Cue about this clip" className="chat">
          <div className="chat-head">
            <CueDot size={26} />
            <div className="col"><strong>Cue</strong><span className="muted small">Working on this clip only</span></div>
          </div>
          <div role="log" aria-live="polite" className="chat-log">
            {cue.messages.map((m, i) => (
              <div key={i} className={m.from === "cue" ? "msg cue" : "msg you"}>
                <div className={m.error ? "bubble error" : "bubble"}>{m.text || (cue.busy ? "Working on it..." : "")}</div>
                {m.tools && m.tools.length > 0 && <span className="muted small">Used {m.tools.join(", ")}</span>}
              </div>
            ))}
          </div>
          <div className="chat-foot">
            <div className="chips">
              <span className="muted small full">Try</span>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => cue.send(s)} disabled={cue.busy}>{s}</button>
              ))}
            </div>
            <form
              className="ask"
              onSubmit={(e) => {
                e.preventDefault();
                cue.send(draft);
                setDraft("");
              }}
            >
              <label htmlFor="clip-ask" className="sr-only">Ask Cue to change this clip</label>
              <input id="clip-ask" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={'Ask for a change, like "zoom on my face at the end"'} />
              <button type="submit" className="btn-dark" disabled={cue.busy}>Send</button>
            </form>
          </div>
        </section>

        <section aria-label="Clip timeline" className="workbench">
          <div className="row wrap gap24 start">
            <div aria-label="Preview" className="preview">
              <div className="preview-cam"><span>Facecam</span></div>
              <div className={cur.zoom ? "preview-game zoomed" : "preview-game"}><span>{cur.zoom ? "Gameplay, zoomed 1.6x" : "Gameplay"}</span></div>
              <div className={cur.captionSize === "xl" ? "preview-cap xl" : "preview-cap"}>{cur.caption}</div>
              <div className="preview-len">{formatDuration(cur.lengthSec)}</div>
            </div>
            <div className="clip-info">
              <h1>{clip.title}</h1>
              <span className="muted">{meta} · 9:16 · {platformList(clip.platforms)}</span>
              <div role="tablist" aria-label="Versions" className="row wrap gap6">
                {clip.versions.map((v, i) => (
                  <button key={v.label} type="button" role="tab" aria-selected={i === index} className={i === index ? "tab on" : "tab"} onClick={() => setView(i)}>
                    {v.label}
                  </button>
                ))}
              </div>
              <div className="changed">
                <span className="eyebrow">WHAT {cur.label.toUpperCase()} CHANGED</span>
                <span>{cur.change}</span>
              </div>
              <div className="row wrap gap22">
                <div className="stat"><span>Length</span><strong>{formatDuration(cur.lengthSec)}</strong></div>
                <div className="stat"><span>Cue's hook score</span><strong>{cur.hookScore}</strong></div>
                <div className="stat"><span>Edits</span><strong>{index}</strong></div>
              </div>
            </div>
          </div>

          <div className="timeline">
            <div className="row wrap gap12 center">
              <strong>Timeline</strong>
              <span className="muted small">Showing {cur.label}. Gray stripes are cut. The teal outline is what {cur.label} changed.</span>
            </div>
            <div className="timeline-scroll">
              <div className="timeline-grid">
                <div className="track-names">
                  <div className="ruler-pad" />
                  {tracks(clip, cur, hi).map((t) => <div key={t.name} className="track-name">{t.name}</div>)}
                </div>
                <div className="tracks">
                  <div className="ruler">
                    {ticks.map((s) => <span key={s} style={{ left: `calc(${(s / total) * 100}% - ${s ? 12 : 0}px)` }}>{formatDuration(s)}</span>)}
                  </div>
                  {tracks(clip, cur, hi).map((t) => (
                    <div key={t.name} className="track">
                      {t.blocks.map((b, i) => (
                        <div key={i} className={`block ${b.kind}${b.changed ? " changed" : ""}`} style={pos(b.span, total)}>{b.label}</div>
                      ))}
                    </div>
                  ))}
                  {cur.cuts.map((c, i) => <div key={i} className="cut" style={pos(c, total)} />)}
                  <div aria-hidden="true" className="playhead" style={{ left: "60%" }}><span /></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
