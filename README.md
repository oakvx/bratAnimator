<div align="center">
  <img src="favicon.svg" alt="Brat Animator" width="56" height="56">
  <h1>Brat Animator</h1>
  <p><strong>Local-first lyric video compositor and browser-based motion editor.</strong></p>
  <a href="https://oakvx.github.io/bratAnimator/">Live application</a>
</div>

---

## Technical overview

Brat Animator is a static, client-side video composition application. It combines synchronized lyrics, deterministic motion graphics, media timing and browser-native rendering in a single editor. Project JSON and imported media are stored locally; video generation runs on the user's device.

**Runtime:** ECMAScript / HTML5 / CSS3 · **Architecture:** dependency-light, framework-free, static PWA · **Backend:** optional Supabase Auth and PostgreSQL RPC for temporary BRATCODE sharing.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Application | Vanilla JavaScript (ES modules + browser scripts), semantic HTML5, responsive CSS3 |
| UI / motion | Canvas 2D, requestAnimationFrame, deterministic seeded composition |
| Audio | Web Audio API, local media decoding, waveform/energy analysis; dashboard micro-interactions synthesized with Web Audio |
| Video | MediaRecorder, WebCodecs where supported, bundled MP4 muxer, PNG canvas export |
| Lyrics | LRC / Enhanced LRC, TTML, SRT, WebVTT, Lyricsfile YAML/JSON; LRCLIB and lrc.red integrations |
| Storage | IndexedDB (projects and media blobs), localStorage (small preferences / recovery metadata) |
| Portability | JSON project schema v5; portable .brat.zip bundles via bundled fflate |
| Identity | Optional Supabase Auth (Google OAuth, email/password, email OTP) |
| Sharing | Optional Supabase PostgreSQL RPC, time-limited BRATCODE Light snapshots |
| Delivery | Static GitHub Pages deployment, service worker, Web App Manifest |
| Validation | Node.js built-in test runner, headless Chrome CDP smoke tests, GitHub Actions |

**No npm installation, JavaScript framework, application server, video rendering server, or build pipeline is required to run the core editor.**

## Architecture

```text
Browser / PWA
├── Creator Studio
│   ├── Responsive dashboard + Frutiger Aero interface
│   ├── Local project library (20 saved + 1 temporary)
│   ├── Dashboard Web Audio interaction sounds (user-muteable)
│   └── Optional authenticated account session
├── Editor
│   ├── Lyrics parsing and timing engine
│   ├── Canvas 2D composition and deterministic animation
│   ├── Local media / audio analysis
│   └── PNG / WebM / MP4 / .brat.zip export
├── Local persistence
│   ├── IndexedDB: bratAnimator.workspace.v1  (project JSON)
│   ├── IndexedDB: bratAnimator.media.v1      (binary media)
│   └── localStorage: UI preferences and backup reminders
└── Optional remote services
    ├── Supabase Auth                         (identity only)
    └── BRATCODE PostgreSQL RPC               (JSON snapshot, TTL 24h)
```

All editing and media processing are local. No automatic cloud synchronization of projects, fonts, audio, video or images is implemented. A valid authenticated account does **not** imply cross-device project availability.

## Capabilities

- Multi-format synchronized lyrics import, native word timing, line-level editing and audio-assisted synchronization.
- Brat, Music, Cinematic and Kinetic Collage render modes with per-phrase styling, transitions and typography controls.
- Editable canvas text transforms, bilingual lyric tracks, seeded animations and undo/redo controls.
- Audio-driven effects, project-defined export intervals and aspect-ratio presets.
- Client-side MP4/WebM export, PNG frames, local audio muxing where supported.
- Portable full projects containing manifests and available media/font assets in .brat.zip.
- Creator Studio with persistent editor state, local project management, guest/account separation, recovery and backup reminders.
- Optional BRATCODE Light: multi-use share codes, 24-hour expiry, one active code per account, guest import. **Metadata and lyrics only**; recipients must reattach missing binary media.

**Planned, not shipped:** Sound Hub library and TikTok account / favorites / publishing integrations. No undocumented TikTok download or posting capability is implied.

## Data lifecycle and constraints

| Property | Behavior |
| --- | --- |
| Schema | Project JSON version 5, migrated from supported legacy versions |
| Saved projects | 20 per browser profile, shared across account and guest namespaces |
| Temporary workspace | One additional IndexedDB-backed project, never auto-evicted by the app |
| Autosave | Debounced local writes with recovery and explicit failure state |
| Media | Binary blobs stored separately in browser IndexedDB, referenced by asset IDs |
| Backup | Manual .brat.zip export with activity-based reminders |
| BRATCODE | Opaque random 128-bit code, server-enforced TTL 24 hours, multi-use |
| Cloud storage | No project/media synchronization; sharing uploads a temporary **JSON structure** only |
| Security boundary | Account libraries are logically separated, not encrypted against access to the same browser profile |

Browser storage is subject to device/browser quota and eviction. Export .brat.zip backups for long-term preservation.

## Local execution

Serve the repository over an HTTP origin (service workers and several browser APIs do not operate normally from file://).

```bash
git clone https://github.com/oakvx/bratAnimator.git
cd bratAnimator
python3 -m http.server 8000
```

Open http://localhost:8000. Authentication and temporary server sharing remain optional; the editor works in guest mode without either service.

## Optional authentication and BRATCODE backend

1. Create a Supabase project; copy its **project URL** and **publishable / anon client key** to assets/js/supabase-config.js.
2. Enable the desired Auth providers and redirect allowlist. Google OAuth requires the provider-side configuration; numeric email OTP requires an appropriate email template and a usable SMTP provider.
3. Run supabase/migrations/20261108_bratcode_light.sql in the project's SQL editor to enable the BRATCODE RPC functions and their access rules.
4. Validate owner-scoped creation/revocation and anonymous import before opening sharing publicly.

Never include the Supabase service-role key, database password, OAuth client secret, or refresh tokens in frontend files. The BRATCODE RPCs enforce ownership, expiration, and code entropy server-side. See docs/phase-2-creator-studio.md and the Phase 3 documentation for deployment details.

## Repository map

```text
index.html                 Main application + editor shell
assets/css/                Studio dashboard, Aero treatment and editor styles
assets/js/app.js           Editor controller and project lifecycle
assets/js/local-workspace.js
                           IndexedDB repository and autosave scheduler
assets/js/studio-dashboard.js
                           Dashboard, project library and account UI
assets/js/dashboard-audio.js
                           Procedural UI audio (dashboard only)
assets/js/bratcode.js      Sanitized JSON sharing client
assets/js/editor-v5.js     Advanced editor and portable package interface
assets/js/lyrics*.js       Lyrics parsing and source integrations
assets/js/timing.js        Timeline and timing utilities
assets/js/motion.js        Motion/composition utilities
assets/js/project-assets.js
                           Portable package import/export
supabase/migrations/       BRATCODE database schema and RPCs
sw.js                      Versioned PWA cache
tests/                     Unit, integration and Chrome browser smoke tests
.github/workflows/         CI and static GitHub Pages deploy
```

## Verification

```bash
node --test
node --check assets/js/app.js
node --check assets/js/local-workspace.js
node --check assets/js/studio-dashboard.js
```

Chrome smoke tests (no additional npm packages):

```bash
CHROME_PATH=/usr/bin/google-chrome node tests/studio-dashboard-browser.mjs
```

GitHub Actions runs unit/syntax checks and browser smoke checks when Chrome is available. OAuth and cross-browser storage scenarios additionally require manual QA.

## License

**All rights reserved — no license granted.** Public repository visibility does not grant permission to reuse, modify, redistribute or commercially deploy the code. See [LICENSE](LICENSE) for the full terms.

Third-party music, lyrics, media and fonts are not licensed by this repository; users must secure the appropriate rights.
