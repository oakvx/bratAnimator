<p align="center">
  <img src="./favicon.svg" alt="Brat Animator" width="52" height="52">
</p>

# Brat Animator

**Client-side lyric-video compositor and timeline editor.** Static, framework-independent web application with deterministic Canvas rendering, browser-native media processing, and a local-first project model.

**Application:** https://oakvx.github.io/bratAnimator/

## Technology stack

| Layer | Implementation |
| --- | --- |
| Runtime | Browser-native ECMAScript (ES2022+); HTML5; CSS3 |
| UI | Vanilla DOM; full 7.css v0.21.0 (MIT, locally bundled); native windows, ARIA tabs, Explorer navigation and taskbar |
| Rendering | Canvas 2D; deterministic frame compositor; timestamp-driven scene evaluation |
| Media | Web Audio API; HTMLMediaElement; MediaRecorder; browser codec support |
| Export | MP4/WebM pipelines; local video recording; PNG frame export; bundled mp4-muxer |
| Persistence | IndexedDB (project snapshots and binary media); localStorage (light preferences/fallback) |
| Project interchange | Versioned JSON snapshots; portable .brat.zip archives via bundled fflate |
| Authentication | Optional Supabase Auth: email/password, email OTP, Google OAuth |
| External OAuth | Optional TikTok Login Kit for Web: Supabase Edge Function (Deno/TypeScript), OAuth 2.0, server-side token vault |
| Delivery | GitHub Pages; static assets; service worker / Progressive Web App |
| Tests | Node.js native test runner; browser smoke tests using Chrome DevTools Protocol |
| Build | No application bundler, JavaScript framework, Node.js server, or required npm install |

## Architecture

The browser owns the application state and performs video rendering locally. Project snapshots reference media blobs in IndexedDB; the application does **not** upload audio or video as part of editing or exporting.

    UI / Controller (index.html, studio-dashboard.js, sound-hub-ui.js, app.js)
          |
          +-- Timeline / lyrics (core.js, lyrics.js, timing.js)
          |
          +-- Visual motion (kinetic.js, motion.js, editor-v5.js)
          |
          +-- Render / export (Canvas 2D, export.js, media.js)
          |
          +-- Local storage (local-workspace.js, IndexedDB)
          |
          +-- Sound Hub (sound-hub.js, Web Crypto SHA-256, IndexedDB)
          |
          +-- Portable archives (project-assets.js, fflate)
          |
          +-- Optional identity (auth-client.js, Supabase Auth)
          |
          +-- Optional TikTok link (tiktok-link.js, Supabase Edge Function)

Key properties:

- **Deterministic frame evaluation:** visual geometry is derived from project state, media timestamp, and persisted seed rather than accumulated animation state.
- **Local-first:** workspace JSON and media binaries are browser-resident. Account identity does not imply cloud project synchronization.
- **Separated identities:** guest and authenticated users have logically separate local project libraries within one browser profile.
- **Portable project format:** .brat.zip includes project metadata and available local assets. Plain JSON is metadata-only and is not a complete multimedia backup.
- **Resilient editing:** debounced autosave, recovery state, legacy JSON migrations, and explicit error reporting. Browser storage can still be evicted.
- **Client-only media export:** output quality and supported codecs depend on the browser and device.
- **Local Sound Hub:** imported audio is SHA-256 deduplicated within a shared local media database; favorites, recents and playlists are metadata scoped to the local owner. The editor is modified only by explicit insertion.

## Input formats

Synchronized lyrics: LRC, enhanced LRC, TTML, SRT, WebVTT, and supported Lyricsfile YAML/JSON data. Timing can be imported, estimated, and adjusted manually.

Media: locally supplied audio, images, video backgrounds, and custom font files supported by the browser. Remote media are subject to CORS, source availability, and licensing restrictions.

## Visual pipeline

Brat Animator implements multiple text-rendering modes, including Brat, Music, Cinematic, and **Kinetic Collage**.

Kinetic Collage uses resolution-independent two-dimensional word packing: deterministic, compact typography with different font sizes, adjacency constraints and safe canvas margins. Words are progressively revealed without text opacity crossfades. The preview and media export use the same scene compositor.

Canvas layout and source timestamps are evaluated independently of dashboard effects. Dashboard click sounds use synthesized Web Audio and are never mixed into exported video.

## Local project storage

- Primary database: bratAnimator.workspace.v1; object store: projects.
- Media database: bratAnimator.media.v1; blobs referenced by asset IDs.
- Sound Hub index: bratAnimator.soundhub.v1; tracks and collections metadata. File data remains in the existing shared media database.
- Project IDs and owner IDs define logical workspace boundaries.
- Shared browser-profile target capacity: **20 permanent projects + 1 recoverable temporary project**.
- Storage limits are enforced by IndexedDB transactions and the browser's available quota.
- Automatic cloud project synchronization is intentionally absent.
- Export complete .brat.zip archives regularly; browser eviction and user-cleared site data cannot be prevented by the application.

## Dashboard and Windows 7 UI

The app ships the full, unmodified upstream `vendor/7css/7.scoped.css`
(v0.21.0, MIT). The only dashboard-specific CSS is
`assets/css/studio-win7.css`, which owns layout without repainting native
7.css buttons, title controls, inputs or tabs. No runtime CDN is required.
Video-editor CSS remains independent.

All confirmation and authentication windows use JavaScript-controlled
visibility: the accessible dialog role is on the overlay, **not** on the
inner `.window`. 7.css hides `.window[role=dialog]` unless activated through
the URL `:target`; that rule is incompatible with our event-driven dialogs.

## Authentication and backend

The editor is fully usable as a guest. Supabase Auth is optional for account-based workspaces and future server-backed sharing.

To enable authentication, configure the **project URL** and **public publishable key** in assets/js/supabase-config.js, then enable the corresponding providers and redirect allowlists in Supabase. Google OAuth requires provider-side setup; public email OTP delivery requires a configured mail transport.

Never place a Supabase secret/service_role key or OAuth client secret in browser source code.

**BRATCODE** is designed as an optional short-lived, server-backed exchange of project structure, **not** a cloud synchronization mechanism. Media binaries and credentials must never be included. Back-end deployment and access-control configuration are required before public code generation can operate.

The optional **TikTok account-link flow** is implemented but remains disabled until official Login Kit authorization, Supabase Edge Function deployment, and provider configuration are completed. Music favorites and publishing are not part of this phase. See docs/phase-5-windows7-tiktok-link.md.

## Development

Prerequisites: a modern browser; Node.js 22+ for tests.

Serve the repository root using a static HTTP server (for example Python http.server or a local VS Code static-server extension) and open the root index.html. Do not use file:// for production-equivalent testing because browser storage, service workers, and media APIs require a secure or valid local origin.

Automated checks:

    node --test
    node --check assets/js/app.js
    node --check assets/js/kinetic.js
    node --check assets/js/sound-hub.js
    node --check assets/js/sound-hub-ui.js
    node --check assets/js/win7-shell.js
    node --check assets/js/tiktok-link.js

Optional Chrome browser audit:

    CHROME_PATH=/usr/bin/google-chrome node tests/studio-dashboard-browser.mjs

CI runs Node.js unit tests, syntax verification, and available Chrome smoke checks. A green test suite does not substitute for manual checks of browser media codecs, mobile touch, and authenticated redirect flows.

## Repository structure

    assets/js/                 Core editor, media, timeline, storage, auth, UI
    assets/css/                Editor CSS and isolated Win7 dashboard layout (studio-win7.css)
    vendor/7css/               Complete upstream scoped 7.css distribution + MIT license
    vendor/                    Bundled external JS dependencies
    tests/                     Node unit tests and browser automation
    docs/                      Architecture notes and rollout instructions
    index.html                 Main application entry point
    sw.js                      PWA caching and lifecycle
    .github/workflows/         Continuous integration and static deployment

## Constraints and security

The app depends on browser storage retention, available device memory, and supported codecs. Large exports can be constrained by mobile resources. Browser-backed local data are not encrypted by the application and are not a substitute for archival backups.

Server-side authentication and sharing must enforce authorization, expiration, rate limits, and payload limits independently from browser UI. Content owners are responsible for rights and permissions in any media they import or publish.

## License

**All rights reserved.** Public repository visibility does not grant a reuse, redistribution, or modification license. Refer to [LICENSE](./LICENSE) for the applicable terms. Third-party dependencies retain their respective licenses.
