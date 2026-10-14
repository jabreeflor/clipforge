# Streamer Tool Debate

Which streamer tool should Jabree build for their own use? Opus proposed four scenarios, a Sonnet advocate argued for each one (including what we'd do better than existing products) and attacked the rivals, and an Opus judge picked the winner.

## Part 1: The scenarios (Opus)

### Scenario 1: Stream Prep Copilot (pre-stream)

**What it does:** A small desktop or web app you open 20 to 30 minutes before going live. It drafts a stream title, category, and tags from a short note ("ranked grind, trying the new patch") and from your recent stream history, then pushes them to Twitch, YouTube, and Kick together through their APIs. It runs a go-live checklist over obs-websocket (OBS scenes, mic, capture sources, bitrate and encoder), posts "going live" messages to Discord, X, and Bluesky from templates, and keeps a schedule with reminders.

**Core problem:** Pre-stream setup is repetitive and easy to get wrong: a stale title, the wrong category, a muted mic or dead source, three platforms and several socials updated by hand right before going live.

**Build scope:** About 2 to 4 weekends. OAuth for Twitch Helix, YouTube Data API v3, and Kick (newer, less complete API); obs-websocket v5; Discord webhook and social posting; optional LLM for titles. Tauri/Electron or a small web app with SQLite.

**Existing products:** Restream, Streamlabs, StreamElements, Pulsaar, MEE6/Pingcord, OBS and Twitch Studio info panels. None combine an OBS health check with cross-platform metadata sync in one step.

### Scenario 2: Unified Live Chat and Moderation Console (live)

**What it does:** One window merging Twitch, YouTube, and Kick chat. It highlights first-time chatters, questions, subs and donations, and returning regulars with notes like "last seen 3 weeks ago, talked about Elden Ring." One-key moderation (timeout, ban, delete) on any platform, a "questions only" OBS browser source, and local auto-flagging of spam and slurs.

**Core problem:** A solo streamer can't watch three chats, play, and moderate at once. Questions get buried, regulars feel ignored, and smaller platforms go unmoderated.

**Build scope:** About 4 to 6 weeks. Twitch IRC/EventSub, YouTube Live Chat API polling (quota costs), Kick chat websocket (can break), normalized message model, SQLite viewer memory, per-platform mod actions, keyboard-driven UI.

**Existing products:** Nightbot, Moobot, Fossabot, StreamElements/Streamlabs bots, Chatterino, Chatty, Restream Chat, Social Stream Ninja, Twitch AutoMod. Merged chat exists; cross-platform viewer memory plus moderation from one console mostly doesn't.

### Scenario 3: Auto-Clipper and Short-Form Pipeline (post-stream)

**What it does:** After a stream it takes the VOD or local OBS recording and finds highlights from chat velocity spikes, emote bursts, audio loudness and laughter, and markers dropped live with a hotkey or `!clip`. It cuts candidates, transcribes with Whisper, burns in styled captions, reframes to 9:16 (facecam top, gameplay bottom), and puts them in a review queue. Approved clips upload to Shorts and TikTok or save for manual posting.

**Core problem:** Short-form is the main growth channel for most streamers, but scrubbing a 4-hour VOD and editing vertical clips takes hours per stream, so most solo streamers skip it.

**Build scope:** About 4 to 8 weeks; an MVP of markers plus chat spikes plus captioned vertical export is about 2 to 3 weeks. ffmpeg, whisper.cpp or faster-whisper, ASS captions, layout templates, review UI, uploads.

**Existing products:** Eklipse, Powder, Medal, StreamLadder, Opus Clip, Vizard, Cross Clip, Twitch clip-to-vertical. Mostly cloud subscriptions; a local pipeline tuned to your own chat signals and markers is the advantage.

### Scenario 4: Personal Stream Analytics and Growth Journal (analytics)

**What it does:** A self-hosted dashboard collecting viewer counts over time, chatters, follows and subs, raids, category, title, start time, duration, OBS scene changes, and short post-stream notes. It answers which titles and categories hold viewers, best start times, where viewers drop off, whether regulars are churning, and how raids performed. A weekly report flags trends and suggests experiments.

**Core problem:** Platform analytics are split across services, keep limited history, and aren't tied to the decisions a streamer actually makes.

**Build scope:** About 3 to 5 weeks. Polling collector (Twitch Helix, EventSub, YouTube Analytics/Live), obs-websocket event logging, Postgres or SQLite, Grafana/Metabase or custom UI, optional LLM weekly summary. Twitch first.

**Existing products:** TwitchTracker, SullyGnome, StreamsCharts, StreamElements/Streamlabs analytics, Twitch Stream Summary, YouTube Studio, StreamHatchet. None tie cross-platform data to the streamer's own notes, scenes, and experiments.

## Part 2: The advocates (Sonnet)

### Advocate for Scenario 1: Stream Prep Copilot

#### Opening case

Scenario 1 attacks the only problem that hits this streamer before every single stream, with a failure mode that is cheap to prevent and expensive to hit live. The failures are a stale title from last week's game, a muted mic, a dead capture source, the wrong encoder or bitrate, or one platform that never got updated. None of these is a hard problem. They are boring, repetitive and easy to forget, so a solo streamer who runs the same routine 3-5 times a week gets reliably burned by them. Fixing it removes friction and risk on every session, so the benefit compounds from the first week.

It is also the best-scoped build of the four: about 2-4 weekends, with well-documented APIs (Twitch Helix, YouTube Data API v3, obs-websocket v5, Discord webhooks). Nothing in it needs real-time ingestion, ML pipelines or fragile reverse-engineered sockets, so the person ends up with a tool they actually ship and use.

#### What we do better than existing products

Restream, Streamlabs and StreamElements can push a title to several platforms. Pulsaar, MEE6 and Pingcord handle go-live pings. Nobody connects these steps, and none of them checks that the stream is ready to go live.

- **Preflight against OBS, not just metadata.** The checklist reads the actual state through obs-websocket: is the mic muted or at -inf, is the right scene active, are the sources live, is the encoder and bitrate what was intended? Hosted multistream tools don't see your local OBS.
- **One flow, one click.** Title, category and tags go to three platforms, the Discord/X/Bluesky announcement posts, and the schedule updates, all from a single short note.
- **History-aware drafting.** It pulls from the streamer's own past titles and tags, so it knows that last week's title still says "Day 3".
- **Fits the person's own setup.** Presets for their games, scenes and Discord format, no upsell or subscription, and Kick support, which many commercial tools cover poorly.
- **Honest limit:** Kick's API is the weakest link; treat it as best-effort.

#### Rebuttals to rivals

**Scenario 2 (Chat Console).** The largest and most fragile build: 4-6 weeks, YouTube quota, a fragile Kick websocket, and mature free competitors (Chatterino, Chatty, Social Stream Ninja, Restream Chat, AutoMod). Its value only shows up live, when a half-working console is worse than none. A solo streamer with modest chat may not have three busy chats to merge.

**Scenario 3 (Auto-Clipper).** A real growth lever, but the most crowded space, where funded teams lead on detection, captions and reframing. The 2-3 week MVP hides review UI, uploads and platform approvals.

**Scenario 4 (Analytics Journal).** Useful only after months of data, and small audiences give noisy signals. TwitchTracker, SullyGnome and platform dashboards cover much of it. Its differentiator, tying results to decisions, is something Scenario 1 captures at the source.

#### Closing

Scenario 1 is the cheapest to build, the surest to be used every stream, and prevents mistakes instead of reporting on them. Its logged go-live data could feed Scenario 4 later, and its OAuth connections are reusable by Scenarios 2 and 3.

### Advocate for Scenario 2: Unified Live Chat and Moderation Console

#### Opening case

Scenario 2 is the only scenario that works while the stream is running. The live hour is when attention is scarcest, and it's where the streamer's real problem sits: a solo person playing, talking and moderating across up to three chats. Questions get buried, first-timers get no greeting, and regulars go unrecognized. Those failures directly cost retention, and retention is what makes the other three scenarios matter.

The value is felt every minute of every stream. S1 saves a few minutes per session; S2 changes the quality of the whole session. The streamer's taste in keybindings, highlight rules and viewer notes is exactly what no vendor can ship.

#### What we do better than existing products

Chatterino, Chatty, Nightbot, Fossabot and Social Stream Ninja each solve a slice. None solve the combination.

- **Per-viewer memory across platforms.** Bots keep per-platform points or counts, not your own notes, and can't tie the same person on Twitch and YouTube together. Local SQLite with manual identity linking does, and the data stays yours.
- **Attention triage, not a merged feed.** First-timers, questions, subs and donations, and returning regulars surface as separate lanes.
- **One-key cross-platform moderation.** One hotkey to time out or ban on all three platforms. (The advocate flags this as the claim to verify first.)
- **"Questions only" OBS browser source** tailored to your layout.
- **Local spam and slur flagging** tuned to your community, alongside AutoMod.

#### Rebuttals to rivals

**S1, Prep Copilot.** An annoying but short task done once per stream at a calm moment. Restream, Streamlabs and StreamElements already do much of it. Most OAuth surface for the least payoff.

**S3, Auto-Clipper.** The most crowded category, with polished funded tools. It amplifies engagement rather than creating it. Its distinctive piece, live hotkey markers, could be a small add-on to S2.

**S4, Analytics Journal.** A rear-view mirror. Public trackers already show viewer curves; its differentiator pays off only after weeks, on a small noisy sample.

#### Closing

S2 is the riskiest build (fragile Kick, YouTube quota, 4-6 weeks), but manageable: ship Twitch first, add YouTube, treat Kick as best-effort. It is the only option that directly improves the live experience for viewers, holds data no competitor has (your relationships with viewers), and its pieces become a foundation for S3 and S4.

### Advocate for Scenario 3: Auto-Clipper and Short-Form Pipeline

#### Opening case

Scenario 3 is the only one that attacks the streamer's actual bottleneck: growth. Short-form is the main growth channel, and the cost is hours of VOD scrubbing and vertical editing per stream. Every other scenario optimizes something that already works or is cheap to do by hand.

A finished stream turns into a queue of captioned 9:16 clips to approve: a visible asset. The work is post-stream, so a bug costs a bad clip, not a broken broadcast. The MVP (markers, chat spikes, captioned vertical export) is about 2-3 weeks with mature tools, and each stage can be built and checked alone.

#### What we do better than existing products

1. **Signals from the streamer's own data.** Fuse live `!clip`/hotkey markers, chat velocity and emote bursts, OBS scene changes, and audio loudness. A marker the streamer pressed is the strongest signal, and cloud tools can't see it.
2. **Local, unlimited, no per-minute fees.** Whisper on your own GPU/CPU, ffmpeg free, no watermarks, export caps or tiers.
3. **Exact layout and caption style** tuned to one channel's brand, instead of generic AI reframing that can crop the wrong region.
4. **Learning loop (later).** Log approvals, rejections and performance, then re-weight signals for this one channel.
5. **Keyboard-driven review queue**, publishing to your own accounts; the raw recording never leaves the machine.

#### Rebuttals to rivals

**Scenario 1.** A small annoyance that takes minutes; multi-platform title updates already exist; three-platform OAuth upkeep to save minutes; nothing for growth.

**Scenario 2.** Riskiest and longest build, live-path bugs hurt broadcasts, crowded category, and three simultaneous chats is a niche situation. It improves running the stream, not finding new audience.

**Scenario 4.** Small samples make "best start time" mostly noise; trackers cover most read-outs; notes-to-decisions can be a spreadsheet. It produces insight, not output.

#### Closing

Scenario 3 turns stream hours into publishable shorts, uses private signals SaaS clippers can't reach, runs offline where failure is cheap, and has a 2-3 week MVP. Caveats: the market is crowded and clip selection is the hard part, so the human review queue is essential.

### Advocate for Scenario 4: Personal Stream Analytics and Growth Journal

#### Opening case

Scenario 4 is the only one that compounds. Prep, chat and clipping save time on a given night; analytics makes every later decision better, and it needs history that can't be recovered afterward. Platform data is short-lived and fragmented, and none of it records what you decided. Start collecting today and in six months you hold something no competitor can sell you.

For a solo streamer, growth is mostly guesses (title, category, start time, format). This turns each guess into a logged experiment with an outcome. It is also low-risk: a polling job plus obs-websocket logging, with Grafana or Metabase as UI, and no live-path failure mode.

#### What we do better than existing products

- **Joins your decisions to outcomes.** Scene changes, title edits, raids and post-stream notes on the same timeline as viewer counts.
- **Spans platforms and keeps your history** as long as you want.
- **Metrics about you:** drop-off by scene segment, regular churn from your own chatter history, raid performance as retention of raided viewers.
- **Private and self-hosted,** no paywall.
- **Closes the loop:** the weekly report proposes one experiment and evaluates it the next week.

Honest caveat: raw viewer-count collection isn't novel; the value is the joins and the experiment loop, so build those first.

#### Rebuttals to rivals

**Scenario 1.** Automates a task that takes minutes; Restream and Streamlabs cover much of it. Without analytics, the copilot generates titles with nothing to check them against, so S4 is a prerequisite for doing S1 well.

**Scenario 2.** Most expensive and riskiest; live-path bugs hurt in real time; mature free competitors. Per-viewer memory is really a chatter database, which S4 collects at lower risk.

**Scenario 3.** Most crowded category, subjective clip quality, heaviest plumbing, least certain estimate. It optimizes output, not decisions; analytics can tell you whether short-form even drives your viewers.

#### Closing

Build the one whose value grows with time and whose failure costs nothing on stream. It is the only scenario where delay permanently loses data. Start the collector this week, even before the dashboard exists.

## Part 3: The verdict (Opus judge)

### Winner

**Scenario 1: Stream Prep Copilot.** Add one small piece from Scenario 4: a per-stream session log.

### Why it wins

Scenario 1 is the only option that pays off on every stream from the first week, and it is the one most likely to get finished. A solo streamer going live 3 to 5 times a week runs the same pre-stream routine every time. The failures it prevents (a muted mic, a dead capture source, a stale "Day 3" title, a platform left un-updated) are cheap to catch beforehand and embarrassing to discover live. No rival disputed that these failures happen; they only argued the task takes "minutes." That's true, but the payoff is avoiding mistakes, not saving time. A muted first 10 minutes costs more than the setup time.

Its differentiation is narrower than its advocate claimed, but it holds up. "Nobody connects these steps" overreaches: Restream and Streamlabs already push titles to several platforms. The OBS preflight is different, though. It reads the real local OBS state over obs-websocket (mic level, active scene, live sources, encoder and bitrate), which no hosted multistream tool can see. No rival rebutted this point.

It has the lowest build risk by a wide margin: 2 to 4 weekends, documented APIs, no real-time ingestion or ML. Its advocate was also the most honest about its weak spot, conceding Kick is best-effort. For someone building alone in spare time, the odds of finishing should carry real weight; S2 and S3 both risk being left half-built.

Fold-in: Scenario 4's strongest argument was that history you don't collect now is lost for good. Since S1 already holds the Twitch token and runs at every go-live, logging each session costs very little: title, category, tags, start time, duration, and a viewer-count poll every few minutes into the same SQLite file. That keeps the S4 option open and makes S1's history-aware drafting real.

### Scorecard

Scores run 1 to 5, higher is better. For build risk, 5 means the lowest risk.

| Scenario | Value | Differentiation | Build risk | Time to payoff | Total |
|---|---|---|---|---|---|
| 1. Stream Prep Copilot | 4 | 3 | 5 | 5 | **17** |
| 2. Unified Chat and Mod Console | 3 | 3 | 1 | 2 | **9** |
| 3. Auto-Clipper and Short-Form | 4 | 3 | 2 | 3 | **12** |
| 4. Analytics and Growth Journal | 3 | 3 | 4 | 1 | **11** |

### Why the others lost

**Scenario 2 (Chat Console):** Its advocate conceded it is the riskiest build (4 to 6 weeks, YouTube quota, fragile Kick socket) and flagged its headline feature, one-key cross-platform moderation, as unverified. "Felt every minute" assumes three busy chats, which a solo streamer may not have; three rivals made that point and it went unanswered. Bugs show up live, and Chatterino, Social Stream Ninja and AutoMod are free and mature.

**Scenario 3 (Auto-Clipper):** The strongest runner-up, since growth is a real need and failures are cheap after the stream. But "the only one that attacks growth" overreaches, the 2-to-3-week MVP leaves out review UI, uploads and platform approvals, and the advocate conceded the market is crowded and clip picking is the hard part. The one signal no cloud tool sees, the hotkey or `!clip` marker, can be logged cheaply now and the clipper built later on that data.

**Scenario 4 (Analytics Journal):** It pays off last: months of data before insight, on a small noisy sample, a rebuttal its advocate never answered. "S4 is a prerequisite for S1" overreached. Its one decisive point, collect history now, is captured by the session log folded into S1.

### Suggested first milestone

- **OBS preflight (build first):** obs-websocket v5 checks that the mic isn't muted or at -inf, the expected scene is active, key capture sources are rendering, and encoder and bitrate match a saved profile. A red/green checklist blocks the "Go" button until checks pass or you override.
- **Twitch metadata, then YouTube:** Set title, category and tags through Helix with per-game presets and a warning when the title is unchanged from last stream. YouTube Data API v3 second. Kick stays out of v1.
- **One announcement channel:** A Discord webhook post from a template when you click Go. X and Bluesky later.
- **Session log (from S4):** Write each go-live (metadata, start and end, viewer count every 5 minutes) to SQLite. Add a "drop marker" hotkey that logs a timestamp, so a future clipper has the one signal no cloud tool has.
- **Out of scope for v1:** LLM title drafting, schedule reminders, Kick, and any dashboard UI. Revisit after 2 to 3 weeks of real use.
