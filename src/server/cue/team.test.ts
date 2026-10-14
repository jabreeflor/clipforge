import assert from "node:assert/strict";
import { test } from "node:test";
import { CUE_MODELS, CUE_TEAM } from "./team.ts";

test("Opus orchestrates, Sonnet edits, Haiku reads and operates the board", () => {
  assert.equal(CUE_MODELS.orchestrator, "claude-opus-5-5");
  assert.equal(CUE_TEAM["clip-editor"]?.model, "claude-sonnet-5-5");
  assert.equal(CUE_TEAM["clip-reader"]?.model, "claude-haiku-5-5");
  assert.equal(CUE_TEAM["board-operator"]?.model, "claude-haiku-5-5");
});

test("only clip-editor can write versions and the reader cannot change anything", () => {
  const writers = Object.entries(CUE_TEAM).filter(([, a]) => a.tools?.some((t) => t.endsWith("__edit_clip"))).map(([n]) => n);
  assert.deepEqual(writers, ["clip-editor"]);
  assert.ok(CUE_TEAM["clip-reader"]?.tools?.every((t) => /__(list_clips|get_clip)$/.test(t)));
});
