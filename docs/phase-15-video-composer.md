# Phase 15 — Video Composer

## Scope

This phase connects the persisted `multitrack` graph from phase 14 to actual preview rendering, MP4/WebM export and still-frame PNG/preview export. The same [PR #20](https://github.com/oakvx/bratAnimator/pull/20) remains open for phases 16 and 17.

## Engine

- `assets/js/video-composer.js` is a local-first compositor. It loads imported media by `assetId` from Brat Animator's existing IndexedDB media store.
- `visualClips(graph,time,position)` orders visual clips by track z-order and maps timeline start/trim/playbackRate to source-local time.
- `createController` caches decoded local image/video resources, shares each source across clips, releases object URLs when clips are removed or project ownership changes, and rejects missing asset references during export rather than silently rendering blank output.
- For local videos, preview uses muted HTMLMediaElement playback/seek and export uses time-indexed frame seeking to the requested source timestamp. Seeking can be slower than real time; the engine prioritizes correctness, not guaranteed acceleration.
- `drawMedia` implements per-clip position, box size, cover/contain, rotation and opacity; normalized coordinates are independent of the export size. Text clips support arbitrary content as canvas overlays.
- `drawScene()` now composites the current project tracks. For legacy projects with no visual clips, the original rendering path is retained unchanged. Active clips below the lyrics track render underneath the classic lyric typography; visual tracks after Lyrics render above it.
- PNG export, three-frame export, short WebM preview and full MP4/WebM export call the same compositor and preparation hook.
- Video-only projects can preview and export without requiring LRC lyrics; project length also incorporates the end time of visual clips.

## UI

- The **Tracks** panel now accepts multiple local video and image files (512 MiB per file), persists each clip in IndexedDB and selects it on the chosen compatible lane.
- Per-clip controls permit X/Y position, width/height, rotation, cover/contain, opacity and overlay text.
- Imported media can be duplicated, trimmed, moved and split using phase 14's existing commands.
- No arbitrary remote media is fetched by this compositor. Incompatible or missing local files produce a visible export error.

## Boundaries

- **Embedded audio in imported video clips is deliberately muted and is NOT included in the export yet.** This is the focus of phase 16, which will integrate all video audio, music and SFX into the phase 13 audio mixer.
- Rendering via HTMLVideoElement seek can be slow with multiple videos and long timelines. A later VideoDecoder/worker strategy can improve throughput, memory budgeting and codec compatibility.
- Multiple simultaneously active clips are composited in track order; transformation keyframes and a drag-and-drop spatial editor will be built in phase 17.
- Local clip files and legacy backgrounds are stored in the existing IndexedDB media store. Browser quota limits and the 512 MiB per-file cap apply.
- Firefox and Safari require manual QA; external codecs like HEVC may not decode in every browser.

## Verification

- `node --test tests/video-composer.test.js`: layer ordering, geometry, normalisation, local cache disposal and missing-media failure.
- `node tests/export-format-browser.mjs`: creates a real local MP4, imports it as a clip, imports a PNG overlay, verifies the composite on the real Canvas, then tests PNG and full video export without lyrics.
- Other existing nine Chrome regressions, Node tests, PWA asset integrity, TypeScript/Deno checks.

## Roadmap within the same PR

- [x] Phase 13 — Export Engine
- [x] Phase 14 — Multitrack Core
- [x] Phase 15 — Visual Composer
- [ ] Phase 16 — Audio embedded in all videos + multitrack mixer
- [ ] Phase 17 — Pro timeline/UI, interactions and performance hardening

The PR stays in **draft**. Do not merge before final QA.