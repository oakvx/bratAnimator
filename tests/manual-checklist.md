# Brat Animator 3.0 Manual Checklist

Run these checks before tagging a release or pushing to GitHub Pages.

## Local File

- Open `index.html` with `file://` and confirm there is no manifest or service worker registration error.
- Confirm all six editor tabs are visible on desktop and narrow mobile widths.
- Confirm the permission notice appears once, can be acknowledged, and the permission button opens `mailto:oakvx@icloud.com`.

## Localhost / PWA

- Serve the folder over `http://localhost` and confirm the web manifest and service worker register.
- Reload offline after first load and confirm the shell opens from cache.

## Lyrics And Timing

- Search LRCLIB by artist/title and load synced lyrics.
- Paste a YouTube URL in the first search box and confirm it opens as preview/reference only.
- Confirm blocked YouTube embeds show the fallback link instead of breaking the layout.
- Upload LRC, edit timestamps/text, split at caret, merge, move, duplicate, delete, and undo/redo.
- Multi-select lyric rows, shift the selected timing, replay a selected lyric, and drag lyric markers on the waveform/timeline.

## Media

- Upload an audio file and confirm waveform, seek, volume, fade controls, and realtime export path.
- Upload a video file and confirm the dynamic video player mounts without creating a large WAV playback URL.
- Paste a direct CORS-enabled audio/video URL that you have permission to use and confirm it decodes.
- Paste a YouTube URL into the direct media field and confirm it is blocked with guided copy.
- Paste a non-CORS media URL and confirm a clear failure message.

## Background

- Upload local image and video backgrounds and confirm opacity, blur, brightness, saturation, scale, and position controls.
- Paste a CORS-enabled image/video background URL and confirm export is allowed.
- Paste a non-CORS remote background URL and confirm preview may show but export is blocked with a clear message.

## Export

- Export fast MP4 with no audio enabled.
- Export WebM fallback if fast MP4 is unavailable.
- Export with loaded audio enabled and confirm MediaRecorder realtime export includes volume/fade.
- Export PNG frame and preview frames.
- Import an old v2/v3 project JSON and confirm it migrates to v3 state.

## Project Tools

- Save, load, duplicate, and delete snapshots.
- Refresh after autosave and confirm recovery banner behavior.
- Export/import project JSON and preset JSON.
- Use command palette and shortcuts outside inputs; confirm shortcuts do not fire while typing.
