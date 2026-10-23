# Brat Animator 5.0 Manual Checklist

Run these checks before tagging a release or pushing to GitHub Pages.

## Local File

- Open `index.html` with `file://` and confirm there is no manifest or service worker registration error.
- Confirm all six editor tabs are visible on desktop and narrow mobile widths.
- Confirm the editor header, tabs, and timing controls remain evenly spaced without horizontal overflow.
- Confirm canvas zoom, fit, playback, seek, restart, and fullscreen controls work from the stage toolbar.
- Confirm the permission notice appears once, can be acknowledged, and the permission button opens `mailto:oakvx@icloud.com`.

## Localhost / PWA

- Serve the folder over `http://localhost` and confirm the web manifest and service worker register.
- Reload offline after first load and confirm the shell opens from cache.
- In a fresh browser profile, load the shell online, import a complete project with local media/fonts, go offline, reload and confirm all editor modules, fonts, media and ZIP controls still work.

## Editor Modes and Language

- With no preferences saved, confirm simple mode and Italian for an Italian browser; existing users should start in advanced mode. Change both preferences and reload.
- In simple mode, confirm loading, lyrics, size, presets, playback and export remain accessible. Switch to advanced and confirm phrase, translation, font, animation and clip controls appear.
- Switch EN/IT/RU/ZH and check settings, dialogs, messages, tutorial and command palette. At 320px, 390px and desktop, confirm keyboard focus and no horizontal page overflow.

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

- Switch between solid, linear, and radial fills; confirm the gradient color and linear angle persist after reload.
- Enable color exchange and verify alternating palettes by line, word, and typewriter letter, including intervals greater than one.
- Confirm word exchange also follows Enhanced LRC timestamps and works with the full-line animation.
- Apply a video to text fill and confirm the video is visible only inside the lyrics, including PNG and video export.
- Upload local image and video backgrounds and confirm opacity, blur, brightness, saturation, scale, and position controls.
- Export with a video background and confirm the real-time path preserves the moving video.
- Paste a CORS-enabled image/video background URL and confirm export is allowed.
- Paste a non-CORS remote background URL and confirm preview may show but export is blocked with a clear message.
- Set matching foreground/background colors and confirm Auto contrast chooses readable text and updates the ratio badge.

## Text Settings

- Open settings from the header, preview toolbar, and command palette; confirm the text size slider receives focus even when controls were collapsed.
- Reduce a long lyric to 10% and confirm the text shrinks proportionally while keeping its line breaks in preview and export.
- Check A−/A+, size presets, live values, and keyboard slider adjustments. Reload or restore a project and confirm the saved text size returns.
- Reset text and undo the reset; colors, animation, and other project settings should stay unchanged. Check settings remain accessible at 320px mobile width.
- Give two phrases different fonts, sizes and colors; verify Brat, Music and Cinematic. Clear one phrase's overrides and confirm future project changes are inherited again.
- In Brat preview editing, drag text and use corner/side handles. Confirm playback pauses, center guides appear, release makes one undo entry, and Escape restores the starting transform. Verify keyboard manipulation too.
- Enable horizontal, vertical and elastic entrances; test the tilted elastic preset. For a wrapped phrase, each visual row must retain its own angle after settling, pause, seek, reload, PNG and video export. Reroll phrase/project and undo.
- At maximum angle/stretch/pulse, test long text and translations in square, portrait and landscape formats; rows must remain legible without overlap or clipping. Check 10% size still works.
- Upload TTF/OTF/WOFF/WOFF2, reload, then export; the chosen font must match the preview. Restore a project with missing fonts and verify reload/explicit replacement is required.

## Bilingual Lyrics and Music Effects

- Enter a phrase translation, associate equal-count plain text, import timestamped LRC within 20 ms, and manually assign unmatched rows. Confirm translation survives phrase movement, duplication, split/merge, undo and reload.
- Set independent translation size, font and color. Verify horizontal translations below originals and no neighboring-group overlap in Brat, Music and Cinematic.
- Enable manual BPM at 40 and 240 with positive/negative offsets; compare text pulse, background zoom and color transitions. Then use loaded-audio onset estimates and test silence. Effects must be off in migrated projects and deterministic after seeking/export.

## Export

- Export fast MP4 with no audio enabled.
- Export WebM fallback if fast MP4 is unavailable.
- Export with loaded audio enabled and confirm MediaRecorder realtime export includes volume/fade.
- Export PNG frame and preview frames.
- Set an export interval, use playhead-to-start/end, and check timeline markers. Reject empty/out-of-duration intervals beside the controls. With the interval disabled, confirm full export.
- Export MP4/WebM clips with audio, video background and a removed intro: compare original timeline frames, audio offset, exact clip duration and boundary fades. PNG should use the same renderer as preview.
- Import old v2/v3/v4 JSON and snapshots; confirm v5 state, unchanged existing settings and new effects disabled.

## Project Tools

- Save, load, duplicate, and delete snapshots.
- Refresh after autosave and confirm recovery banner behavior.
- Export/import project JSON and preset JSON.
- Export `.brat.zip` with uploaded audio, background and font, then reopen in a clean profile/offline. Confirm a missing asset blocks complete export, a malformed package leaves the current project intact, and cancellation restores usable controls.
- Move/retime phrases and confirm identities, overrides and translations follow them. Duplicate must receive a new identity; split keeps translation on the first part; merge concatenates translations and keeps the first style.
- Use command palette and shortcuts outside inputs; confirm shortcuts do not fire while typing.

## Timing and text analysis

- Use `[00:00] Ciao` followed by `[00:10] next`: the first word should finish early and remain still until the next entry, without further letter/word palette changes.
- Compare `ciao` with `ciaoooooooo`: the repeated-vowel word should have a longer sung hold, but typewriter reveal must finish before that hold ends.
- Check commas, sentence endings and ellipses create pauses; karaoke should retain completed highlighting without an active-word effect in the pause.
- Adjust estimated speed between 0.5× and 2×; verify explicit Enhanced onsets/end markers stay fixed and speed survives JSON, snapshots and autosave. Old projects must default to 1×.
- With audio guidance disabled, the last line should remain visible until loaded audio ends; without audio it should hold for 800 ms after its vocal end.
- Compare word reveal, typewriter and karaoke using Enhanced LRC with multiple words per marker and a terminal `<MM:SS.xx>` marker; word onsets must match.
- Check a timestamp-only empty row: text should clear until the next lyric.
- Enable “start timeline from 0:00” on lyrics beginning after an intro; preview audio, waveform seeking and exported audio must trim the same intro.
- Test emoji with skin tones/joiners, combining accents and CJK text without spaces; characters must not be split during typewriter reveal.
- Test tightly spaced lines and out-of-order word timestamps; inspect the timing warnings below the transport controls.
- Compare silent, constant-energy and antiphase stereo audio. Silence/flat energy should use text estimates; stereo should retain its energy.

## Automated Checks

Run `node --test`, then all Chrome checks listed in the README: `natural-timing-browser`, `text-settings-browser`, `export-format-browser`, `motion-browser`, `music-editor-browser`, `project-assets-browser` and `editor-v5-browser` (each under `tests/` with `.mjs`). Use `CHROME_PATH` when Chrome is installed outside the default location.
