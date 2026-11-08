# Phase 4 — Sound Hub + Classic Desktop

## Delivery

The Phase 4 branch introduces a local Sound Hub and reworks the dashboard
as a restrained, Windows 7-era desktop application. It removes the previous
marketing hero and placeholder slogans, while keeping the actual video
editor, canvas, timeline and export implementation intact.

### UI

- Main window, title bar and dialog chrome use semantic 7.css constructs and
  the **scoped** \`7.scoped.css\` stylesheet inside \`.win7\` wrappers.
- \`assets/css/classic-desktop.css\` contains application-specific Explorer-like
  navigation panes, toolbars and file rows. These overrides are scoped to the
  dashboard and do **not** style the video editor.
- Navigation shows functional Home / Editor / Projects / Sound Hub / BRATCODE /
  Settings sections without a promotional header or tier labels.
- Dashboard interaction sounds remain optional; editor sounds remain excluded.
- Responsive mobile layout uses the existing fullscreen editor and compact
  dashboard navigation.

### Sound Hub architecture

- \`assets/js/sound-hub.js\` is dependency-free and uses IndexedDB databases:
  - \`bratAnimator.soundhub.v1\`, \`tracks\` and \`collections\`: metadata, favorites,
    usage timestamps, playlist membership and logical account ownership.
  - \`bratAnimator.media.v1\`, \`media\`: audio bytes, shared with the existing
    editor and portable archive exporter.
- SHA-256 over the entire file content provides deterministic binary IDs and
  prevents duplicate blobs. Reimporting the same audio in the same owner library
  does not reset favorites or collection membership.
- Collections store references to sound IDs only; adding a sound to multiple
  playlists does **not** duplicate the audio file.
- The number of tracks is not capped. Per-file safety limit: 256 MiB. Actual
  capacity depends on browser quota and device storage.
- All sounds remain on the device. No audio metadata or bytes are uploaded
  to a cloud service. Account login is optional and provides no media sync.
- Deleting a Sound Hub list item removes its metadata reference only. The media
  blob is deliberately retained because current or archived projects, and
  another account on the same browser profile, may still reference it. Full
  reference-safe media garbage collection is future work.

### Explicit editor insertion

Playing or searching for an audio file does not alter the video. Only pressing
**Usa nel progetto** copies the *asset ID reference* into the active editor
after decoding it. If the project has a different audio track, the user must
confirm replacement. Lyrics, effects, timing settings and other project state
remain unchanged; timeline analysis may be recalculated after replacement.
Media is decoded locally by the existing editor pipeline.

### Browser limitations

- Only supported audio formats decode/play. The current browser determines
  actual codec support even if a file extension is permitted for import.
- Browser-based storage may be evicted or become unavailable. \`.brat.zip\` is
  the portable backup; Sound Hub collections are local metadata and are not
  included in the current project-only backup format.
- Web Crypto SHA-256 needs a secure context, such as HTTPS or localhost.
- Preview creates and revokes object URLs as tracks or views change.
- The scoped 7.css file is referenced from a version-pinned CDN. When offline,
  the locally cached classic-desktop stylesheet remains as a visual fallback.

### Verification

Automated:

    node --test
    node --check assets/js/sound-hub.js
    node --check assets/js/sound-hub-ui.js
    CHROME_PATH=/usr/bin/google-chrome node tests/studio-dashboard-browser.mjs

Manual QA:

1. Desktop + mobile: Home has an application toolbar and title bar, no banners.
2. Sound Hub: import MP3/WAV, play, pause, search, favorite, create collection.
3. Add and remove a track from a collection; rename and delete the collection.
4. Choose **Usa nel progetto**; confirm replacement if an audio track exists.
5. Confirm no project mutation occurred during previews or browsing.
6. Reload and verify imported audio, favorites and collections persist.
7. Sign in and out: guest and user metadata remain separate on this device.
8. Test unsupported files, quota failures, offline guest mode and Safari codecs.
9. Test project export/import still includes local audio references and blobs.

TikTok favorites, account linking and direct publishing are **not** introduced
in Phase 4 and remain subject to official API access.
