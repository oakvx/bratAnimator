# Phase 17 — Professional Timeline and QA

## Release scope

Phase 17 closes the 13–17 development roadmap in [PR #20](https://github.com/oakvx/bratAnimator/pull/20). It retains the original Windows 7/7.css styling and the restructured inspector documented in [the UI audit](phase-17-editor-layout-audit.md). It does not require a backend, hosted media or new persistence formats.

### User-facing features

- A full-width multitrack timeline **below the canvas**, available on desktop and mobile, with separate lanes for video, overlays, lyrics and audio.
- Drag clips horizontally to move them or vertically onto compatible, unlocked tracks. Handles trim the left/right edges; left trims advance the source in-point based on clip playback speed.
- Snap to the playhead and other clip boundaries (toggleable), adjustable time scale, zoom +/− and fit-to-project, with an adaptive time ruler.
- Import local media by dropping files on a compatible lane; reuse the same IndexedDB asset pipeline used by the Tracks tab.
- Keyboard ArrowLeft/ArrowRight nudge the focused clip by 1/30 s, Shift+Arrow moves by 1 s. Delete removes an unlocked clip. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y perform history actions when the timeline has keyboard focus.
- Split the selected clip at the playhead. Select tracks/clips directly in timeline; the existing properties inspector remains authoritative for all attributes.
- Bounded project undo/redo history now includes timeline edits, including imports; selection changes do not create history entries. Each pointer gesture is committed only once on release.
- Visible-area culling: the timeline renders only clips near the horizontal viewport instead of creating thousands of clip elements offscreen. Project data remains complete.

### Implementation

- `assets/js/timeline-core.js`: pure, Node-testable coordinate handling, snapping, trim/move plans and source time constraints.
- `assets/js/timeline-editor.js`: pointer and keyboard interaction, scroll/ruler rendering and DOM lifecycle.
- `assets/css/timeline-editor.css`: responsive preview/timeline proportions, track and clip presentation, selected/locked states, handles, guide and playhead. Scoped to the editor; 7.css remains the underlying window UI.
- `assets/js/app.js`: links multitrack host operations with existing bounded project history. Undo/redo restores the complete project payload and writes autosave.
- `sw.js`: precaches new timeline assets for offline use.

### Automated verification

- `tests/timeline-core.test.js`: timecode, ruler scale, clip moves across tracks, snapping, source offsets during trims, incompatible/locked targets.
- `tests/editor-layout-playwright.mjs`: actual Playwright mouse drag, undo, redo, zoom, screenshots on desktop 1440×900 and mobile 390×844, all 7 tabs, inspector and document overflow checks, 180-clip virtualized timeline, and English/Italian localized SEO pages.
- `tests/seo-metadata.test.js`: English/Italian titles, meaningful descriptions, canonical, locale alternates, sitemap and JSON-LD WebApplication offer constraints.
- The existing CI regression matrix still tests lyrics, editor-v5, media import, project bundle, animation, export format, audio, dashboard and PWA.

## Search discoverability

Search emphasis: **Brat video editing** remains central, with natural supporting queries: English *Free Brat Video Editor Online*, *Brat Video Maker*; Italian *Editor video Brat gratis online*, *editor video gratuito*. HTML titles, descriptions, Open Graph/Twitter, visible prose, FAQ, app schema and sitemap were updated. Italian has its own `/it/` informational page and reciprocal hreflang. Usage is free; publishing/redistribution remains governed by the Terms. The changes improve indexable content; no rankings are guaranteed.

## Review / constraints

- The PR remains a draft and **will not be merged without explicit approval**.
- Chrome is covered by CI. Safari/iOS, Firefox, screen readers and unsupported codecs still require hands-on checks on real devices before a public release.
- Browser memory and hardware set practical limits on project size and export throughput. A full production transcoding backend and cross-browser codec conversion are intentionally out of scope.
- Automated screenshots are uploaded as `playwright-editor-layout` artifacts from the GitHub Actions run.
