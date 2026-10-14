import { useCallback, useEffect, useState } from "react";
import { latestVersion, platformList, sourceLabel } from "../../shared/clips.ts";
import type { Clip } from "../../shared/types.ts";
import { api } from "../api.ts";
import { CueDot, SampleBadge, TopNav } from "../components/Shell.tsx";
import { useCue } from "../useCue.ts";

const DAY = 24 * 60 * 60 * 1000;

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined });

export function Planner() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const refresh = useCallback(() => api.clips().then(setClips), []);
  const cue = useCue({ onDone: refresh });
  const lastCue = [...cue.messages].reverse().find((m) => m.from === "cue");

  useEffect(() => {
    refresh();
  }, [refresh]);

  const days = Array.from({ length: 7 }, (_, i) => new Date(week.getTime() + i * DAY));
  const placed = clips.filter((c) => c.scheduledAt && (c.stage === "scheduled" || c.stage === "posted"));
  const tray = clips.filter((c) => c.stage === "ready" || c.stage === "found");
  const goal = days.filter((d) => placed.some((c) => sameDay(new Date(c.scheduledAt as string), d))).length;
  const deadlines = [...new Map(clips.flatMap((c) => (c.source.kind === "campaign" && c.source.deadline ? [[c.source.creator, c.source.deadline] as const] : []))).entries()];

  return (
    <div className="page">
      <TopNav><SampleBadge /></TopNav>
      <div className="planner">
        <aside aria-label="Clips to place" className="tray">
          <div className="col gap4">
            <strong>Not scheduled yet</strong>
            <span className="muted small">Drag onto a day, or let Cue place them.</span>
          </div>
          {tray.map((c) => (
            <div key={c.id} className="tray-item">
              <div className="tray-thumb" />
              <div className="col gap2">
                <strong className="small">{c.title}</strong>
                <span className={c.source.kind === "campaign" ? "src campaign" : "src"}>{c.source.kind === "campaign" ? sourceLabel(c.source) : "Your stream"}</span>
              </div>
            </div>
          ))}
          <div className="deadlines">
            <span className="eyebrow muted">CAMPAIGN DEADLINES</span>
            {deadlines.map(([creator, date]) => (
              <div key={creator} className="row between"><span>{creator}</span><strong className="amber">{fmtDay(new Date(`${date}T00:00:00`))}</strong></div>
            ))}
          </div>
        </aside>

        <main className="week">
          <div className="row wrap center gap18">
            <h1>{fmtDay(days[0] as Date)} to {fmtDay(days[6] as Date)}</h1>
            <div className="row gap4">
              <button type="button" aria-label="Previous week" className="icon-btn" onClick={() => setWeek(new Date(week.getTime() - 7 * DAY))}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L4 7l5 5" /></svg>
              </button>
              <button type="button" aria-label="Next week" className="icon-btn" onClick={() => setWeek(new Date(week.getTime() + 7 * DAY))}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2l5 5-5 5" /></svg>
              </button>
            </div>
            <div className="row center gap10 push">
              <span className="muted">Goal: 1 post a day</span>
              <div aria-hidden="true" className="meter"><div style={{ width: `${(goal / 7) * 100}%` }} /></div>
              <strong>{goal} of 7</strong>
            </div>
          </div>

          <div className="cue-banner">
            <CueDot />
            <span className="grow">{lastCue?.text || (cue.busy ? "Cue is planning your week..." : `${7 - goal} days have no post yet. Cue can fill them with your best unscheduled clips.`)}</span>
            <button type="button" className="btn-primary" disabled={cue.busy} onClick={() => cue.send("Fill the empty days this week with my best unscheduled clips. Respect campaign deadlines.")}>
              Let Cue fill the week
            </button>
          </div>

          <div className="days-scroll">
            <div className="days">
              {days.map((d) => {
                const posts = placed
                  .filter((c) => sameDay(new Date(c.scheduledAt as string), d))
                  .sort((a, b) => (a.scheduledAt as string).localeCompare(b.scheduledAt as string));
                const today = sameDay(d, new Date());
                return (
                  <div key={d.toISOString()} className="day">
                    <div className={today ? "day-head today" : "day-head"}>
                      <strong>{d.toLocaleDateString("en-US", { weekday: "short" })}</strong>
                      <span className="muted">{d.getDate()}</span>
                    </div>
                    {posts.map((c) => (
                      <div key={c.id} className={c.stage === "posted" ? "post done" : "post"}>
                        <span className="post-time">{c.stage === "posted" ? "Posted" : fmtTime(new Date(c.scheduledAt as string))}</span>
                        <strong className="small">{c.title}</strong>
                        <span className="muted small">{c.stage === "posted" && c.views ? `${(c.views / 1000).toFixed(1)}k views` : platformList(c.platforms)}</span>
                        <span className="muted small">Hook {latestVersion(c).hookScore}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
