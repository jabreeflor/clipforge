# ClipForge

An AI clipping app for streamers. It clips your own streams, and it clips other creators' streams through opt-in campaigns where they pay per 1k views. An agent called Cue does the work and you steer it.

## Running the app

```sh
npm install
cp .env.example .env
npm run dev
```

Set `ANTHROPIC_API_KEY` in `.env` so Cue can work, then open http://localhost:5173. Cue runs on the Claude Agent SDK; its code is in `src/server/cue/`.

| Command | What it does |
| --- | --- |
| `npm run dev` | API on :8787 and the web app on :5173 |
| `npm run check` | Typecheck, comment ban check, tests |
| `npm run evidence -- <tour>` | Record a video of the app for your PR |
| `npm run build && npm start` | Production build served by the API |

Contribution rules, including video evidence on every PR and the ban on code comments, are in [AGENTS.md](AGENTS.md).

## Design prototypes

The screens live in `design/prototypes/`. They were made on a Claude Design canvas, so each `.dc.html` file expects that canvas runtime (`support.js`) and won't render well opened on its own. `canvas.json` holds the board layout.

Current direction (Workspace palette: white, ink `#17191c`, teal `#0f766e`, Instrument Sans, no italics):

| Screen | File | What it is |
| --- | --- | --- |
| J · Pipeline | `Pipeline.dc.html` | Kanban of clips (Found, Ready, Scheduled, Posted) with Cue's notes on cards |
| J2 · Clip editor | `Clip.dc.html` | Chat with Cue on the left, multi-track clip timeline on the right |
| J3 · Results | `Results.dc.html` | Chat with Cue on the left; views, watch time, what's working, and per-clip drop-off on the right |
| K · Gallery | `Gallery.dc.html` | Cue's picks over your clips |
| L · Planner | `Planner.dc.html` | Posting week that Cue fills in |

Earlier explorations (A to I) and the concept brief (`Main.dc.html`) are kept for reference.

## Docs

- `docs/debate.md`: the streamer-tool debate that started this, including the scorecard and the v1 plan.

## Still to design

Campaigns, the publish sheet, stream setup, and phone approvals.
