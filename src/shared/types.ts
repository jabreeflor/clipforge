export const STAGES = ["found", "ready", "scheduled", "posted"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  found: "Found",
  ready: "Ready",
  scheduled: "Scheduled",
  posted: "Posted",
};

export type Platform = "shorts" | "tiktok" | "reels";

export const PLATFORM_LABELS: Record<Platform, string> = {
  shorts: "Shorts",
  tiktok: "TikTok",
  reels: "Reels",
};

export type ClipSource =
  | { kind: "stream"; streamDate: string; timestamp: string }
  | { kind: "campaign"; creator: string; deadline?: string };

export type Span = [number, number];

export interface ClipVersion {
  label: string;
  lengthSec: number;
  hookScore: number;
  caption: string;
  captionSize: "normal" | "xl";
  cuts: Span[];
  zoom: Span | null;
  music: Span | null;
  change: string;
  createdAt: string;
}

export interface CueSuggestion {
  note: string;
  action?: string;
}

export interface Clip {
  id: string;
  title: string;
  source: ClipSource;
  stage: Stage;
  sourceLengthSec: number;
  versions: ClipVersion[];
  cue?: CueSuggestion;
  working?: boolean;
  skipped?: boolean;
  scheduledAt?: string;
  platforms: Platform[];
  views?: number;
  foundAt: string;
}

export interface BoardColumn {
  stage: Stage;
  label: string;
  count: number;
  cueSummary: string;
  clips: Clip[];
}

export type CueEvent =
  | { type: "session"; sessionId: string }
  | { type: "text"; text: string }
  | { type: "tool"; name: string; input: unknown }
  | { type: "done"; costUsd?: number }
  | { type: "error"; message: string };

export interface CueRequest {
  prompt: string;
  clipId?: string;
  sessionId?: string;
}
