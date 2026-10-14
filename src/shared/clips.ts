import type { Clip, ClipSource, ClipVersion, Platform } from "./types.ts";
import { PLATFORM_LABELS } from "./types.ts";

export function latestVersion(clip: Clip): ClipVersion {
  const version = clip.versions[clip.versions.length - 1];
  if (!version) throw new Error(`Clip ${clip.id} has no versions`);
  return version;
}

export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export function sourceLabel(source: ClipSource): string {
  return source.kind === "campaign"
    ? `Campaign · ${source.creator}`
    : `Your stream · ${source.streamDate}`;
}

export function platformList(platforms: Platform[]): string {
  return platforms.map((p) => PLATFORM_LABELS[p]).join(", ");
}

export function keptLength(sourceLengthSec: number, cuts: [number, number][]): number {
  const removed = cuts.reduce((sum, [a, b]) => sum + Math.max(0, b - a), 0);
  return Math.max(0, sourceLengthSec - removed);
}
