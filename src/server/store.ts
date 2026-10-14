import { keptLength, latestVersion } from "../shared/clips.ts";
import type { BoardColumn, Clip, ClipVersion, Platform, Span, Stage } from "../shared/types.ts";
import { STAGE_LABELS, STAGES } from "../shared/types.ts";
import { sampleClips } from "./sample-data.ts";

export interface ClipEdit {
  change: string;
  trimStartSec?: number;
  trimEndSec?: number;
  caption?: string;
  captionSize?: "normal" | "xl";
  zoom?: Span | null;
  music?: Span | null;
}

export interface ClipFilter {
  stage?: Stage;
  source?: "stream" | "campaign";
}

export class ClipStore {
  private clips = new Map<string, Clip>();

  constructor(seed: Clip[] = sampleClips()) {
    for (const clip of seed) this.clips.set(clip.id, structuredClone(clip));
  }

  list(filter: ClipFilter = {}): Clip[] {
    return [...this.clips.values()].filter(
      (c) => !c.skipped && (!filter.stage || c.stage === filter.stage) && (!filter.source || c.source.kind === filter.source),
    );
  }

  get(id: string): Clip {
    const clip = this.clips.get(id);
    if (!clip) throw new Error(`No clip with id "${id}"`);
    return clip;
  }

  board(filter: Omit<ClipFilter, "stage"> = {}): BoardColumn[] {
    return STAGES.map((stage) => {
      const clips = this.list({ ...filter, stage });
      return { stage, label: STAGE_LABELS[stage], count: clips.length, cueSummary: summarize(stage, clips), clips };
    });
  }

  move(id: string, stage: Stage): Clip {
    const clip = this.get(id);
    clip.stage = stage;
    if (stage !== "scheduled" && stage !== "posted") delete clip.scheduledAt;
    return clip;
  }

  schedule(id: string, at: string, platforms?: Platform[]): Clip {
    const clip = this.get(id);
    if (Number.isNaN(Date.parse(at))) throw new Error(`"${at}" is not a valid date and time`);
    clip.stage = "scheduled";
    clip.scheduledAt = at;
    if (platforms?.length) clip.platforms = platforms;
    delete clip.cue;
    return clip;
  }

  skip(id: string): Clip {
    const clip = this.get(id);
    clip.skipped = true;
    delete clip.cue;
    return clip;
  }

  dismissSuggestion(id: string): Clip {
    const clip = this.get(id);
    delete clip.cue;
    return clip;
  }

  edit(id: string, edit: ClipEdit): ClipVersion {
    const clip = this.get(id);
    const prev = latestVersion(clip);
    const cuts: Span[] = [...prev.cuts];
    if (edit.trimStartSec && edit.trimStartSec > 0) cuts.push([0, edit.trimStartSec]);
    if (edit.trimEndSec && edit.trimEndSec > 0) cuts.push([clip.sourceLengthSec - edit.trimEndSec, clip.sourceLengthSec]);
    const merged = mergeSpans(cuts);
    const changed = (edit.zoom !== undefined ? 1 : 0) + (edit.music !== undefined ? 1 : 0) + (edit.captionSize ? 1 : 0);
    const next: ClipVersion = {
      label: `v${clip.versions.length + 1}`,
      lengthSec: keptLength(clip.sourceLengthSec, merged),
      hookScore: Math.min(99, prev.hookScore + 3 + changed * 2 + (merged.length > prev.cuts.length ? 3 : 0)),
      caption: edit.caption ?? prev.caption,
      captionSize: edit.captionSize ?? prev.captionSize,
      cuts: merged,
      zoom: edit.zoom !== undefined ? edit.zoom : prev.zoom,
      music: edit.music !== undefined ? edit.music : prev.music,
      change: edit.change,
      createdAt: new Date().toISOString(),
    };
    clip.versions.push(next);
    return next;
  }
}

function mergeSpans(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  const out: Span[] = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

function summarize(stage: Stage, clips: Clip[]): string {
  if (stage === "found") {
    const working = clips.filter((c) => c.working).length;
    return working ? `Cue is still cutting ${working} of these.` : `${clips.length} new moments to look at.`;
  }
  if (stage === "ready") return `${clips.length} clips are ready to schedule.`;
  if (stage === "scheduled") {
    const next = clips.map((c) => c.scheduledAt).filter((d): d is string => !!d).sort()[0];
    return next ? `Next post goes out ${new Date(next).toLocaleString("en-US", { weekday: "short", hour: "numeric" })}.` : "Nothing scheduled yet.";
  }
  const best = [...clips].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
  return best ? `"${best.title}" is your top clip this week.` : "Nothing posted yet.";
}

export const store = new ClipStore();
