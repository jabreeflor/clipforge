# AGENTS.md

Rules for anyone, human or agent, changing this repo. Read this before you open a pull request.

## What ClipForge is

ClipForge is an AI clipping platform for streamers. It clips the creator's own streams and runs clipping for opt-in creator campaigns. An agent called Cue is the main interface: it works the pipeline board, edits clips on request, and plans the posting week. Cue is built on the Claude Agent SDK.

The UI follows the ClipForge prototypes: the Pipeline board (J), the clip editor with Cue's chat on the left and the timeline on the right (J2), the Planner (L), and Results (J3). The prototypes are in `design/prototypes/`.

## Pull request rules

### 1. Every PR needs video evidence

A PR is not ready for review until its description shows a video of the change working in the running app. No video, no review, no merge.

- Record the real app, not a mockup or a screenshot. Show the before state when the change fixes something.
- For backend-only changes, record the behavior through the UI or a terminal session that exercises the change.
- Put the video in the PR description under a `## Video evidence` heading. Drag the file into the GitHub editor so it uploads, or, when you can't upload (an agent working through the API), commit it to `evidence/<short-name>.mp4` on your branch and link it.
- `npm run evidence -- <tour>` builds the app, starts it, drives a Playwright tour from `scripts/evidence/tours.ts`, and writes `evidence/<tour>.mp4`. Add a tour for your change when the existing ones don't cover it.
- CI fails a PR whose description has no video link.

### 2. No code comments

Code comments are banned in this repo. That covers every source file: TypeScript, JavaScript, CSS, and HTML, including JSX comments, block comments, doc comments, `TODO`s, and lint or type directives such as `@ts-expect-error`.

- Say it in code instead: clear names, small functions, and types that make the intent obvious.
- Put the "why" of a change in the PR description and commit message, where reviewers read it.
- `npm run check:comments` finds every comment and fails CI if there is one.
- `design/` and `docs/` are exempt: they hold exported design canvases and notes, not app code.

### 3. Before you push

Run `npm run check`. It typechecks, runs the comment check, and runs the tests. CI runs the same thing.

## Layout

- `src/server/cue/` holds Cue: `agent.ts` runs the Claude Agent SDK `query()` loop, `tools.ts` defines the in-process MCP tools Cue uses to read and change clips.
- `src/server/store.ts` is the clip store, seeded with sample data. `src/server/app.ts` is the HTTP API, with Cue streamed over server-sent events at `POST /api/cue`.
- `src/web/` is the React app: `pages/Pipeline.tsx`, `pages/ClipEditor.tsx`, `pages/Planner.tsx`.
- `src/shared/` holds types and helpers used on both sides.
- `scripts/` holds the comment checker and the evidence recorder.

## Running it

`npm install`, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`, then `npm run dev`. The app is on http://localhost:5173 and the API on http://localhost:8787. Without a key the app still runs and Cue says it is offline.
