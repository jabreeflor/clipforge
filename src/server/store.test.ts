import assert from "node:assert/strict";
import { test } from "node:test";
import { ClipStore } from "./store.ts";

test("board groups clips into the four pipeline stages", () => {
  const board = new ClipStore().board();
  assert.deepEqual(board.map((c) => c.stage), ["found", "ready", "scheduled", "posted"]);
  assert.equal(board.reduce((n, c) => n + c.count, 0), new ClipStore().list().length);
});

test("source filter keeps only campaign clips", () => {
  const clips = new ClipStore().list({ source: "campaign" });
  assert.ok(clips.length > 0);
  assert.ok(clips.every((c) => c.source.kind === "campaign"));
});

test("edit_clip adds a version that carries over earlier cuts", () => {
  const store = new ClipStore();
  const version = store.edit("the-1v3", { change: "Ended on the reaction.", trimEndSec: 5, music: [20, 36] });
  assert.equal(version.label, "v3");
  assert.deepEqual(version.cuts, [[0, 4], [36, 41]]);
  assert.equal(version.lengthSec, 32);
  assert.deepEqual(version.music, [20, 36]);
});

test("schedule moves a clip to Scheduled and clears Cue's suggestion", () => {
  const store = new ClipStore();
  const clip = store.schedule("the-1v3", "2026-10-14T18:00:00", ["shorts"]);
  assert.equal(clip.stage, "scheduled");
  assert.equal(clip.cue, undefined);
  assert.deepEqual(clip.platforms, ["shorts"]);
});

test("schedule rejects a bad date", () => {
  assert.throws(() => new ClipStore().schedule("the-1v3", "someday"));
});

test("skip takes a clip off the board", () => {
  const store = new ClipStore();
  store.skip("outfit-roast");
  assert.ok(!store.list().some((c) => c.id === "outfit-roast"));
});
