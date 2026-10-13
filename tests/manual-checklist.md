# Brat Animator 4.0 Manual Checklist

Run these checks before tagging a release or pushing to GitHub Pages.

## Local File

- Open `index.html` with `file://` and confirm there is no manifest or service worker registration error.
- Confirm four numbered tabs (Text, Sync, Appearance, Export) and an unnumbered Project tab are reachable on desktop and narrow mobile widths.
- Confirm the editor header, tabs, and timing controls remain evenly spaced without horizontal overflow.
- Confirm canvas zoom, fit, playback, seek, restart, and fullscreen controls work from the stage toolbar.
- Confirm the permission notice appears once, can be acknowledged, and the permission button opens `mailto:oakvx@icloud.com`.

## Localhost / PWA

- Serve the folder over `http://localhost` and confirm the web manifest and service worker register.
- Reload offline after first load and confirm the shell opens from cache.

## Lyrics And Timing

- Search LRCLIB by artist/title and load synced lyrics.
- Paste a YouTube URL in the song search and confirm it offers to move the link to Sync rather than replacing lyrics.
- Open Advanced sync and references and load a YouTube reference from its separate link field.
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

## Motion Effects

- Open Appearance → Effects. Confirm all effects start off in new projects and imported older projects.
- Enable the rotating star; change its shape, size, speed (including 0), and position. Play and seek: the rotation should be repeatable at the same timestamp.
- Verify the star inverts the actual background under it on solid colors, gradients, exchanged palettes, uploaded photos and videos; lyrics remain in front.
- Try Light shake, Impact at each phrase and Slow sway. Check intensity and speed, including 0 intensity and the intro before the first phrase.
- Increase Motion blur while shake or star rotation is active. Confirm moving elements have trails and the background stays sharp.
- Check brat, music scroll and cinematic lyrics, including media/gradient-filled text; preview and downloaded PNG/video should contain the same effects.
- Save/reload projects, snapshots and presets with effects enabled; confirm the settings survive. Reset these effects and use Undo to recover them.
- Check the expanded effects panel at desktop sizes, 200% zoom and narrow mobile widths using the keyboard.

## Export

- Export fast MP4 with no audio enabled.
- Export WebM fallback if fast MP4 is unavailable.
- Export with loaded audio enabled and confirm MediaRecorder realtime export includes volume/fade.
- Export PNG frame and preview frames.
- Import an old v2/v3 project JSON and confirm it migrates to v4 state.

## Project Tools

- Save, load, duplicate, and delete snapshots.
- Refresh after autosave and confirm recovery banner behavior.
- Export/import project JSON and preset JSON.
- Use command palette and shortcuts outside inputs; confirm shortcuts do not fire while typing.

## Beginner Menu

- On a fresh browser visit, acknowledge the usage notice and confirm the invitation appears without automatically opening a tutorial.
- Dismiss the invitation, reload, and confirm Try an example remains available in Text.
- Confirm search, LRC import/drop and pasted lyrics all update the single lyrics field in Text.
- Confirm choosing search results, importing, pasting or loading an example compacts the lyrics picker. Reopen it with Change lyrics and confirm existing edits remain until another text is chosen.
- Confirm the complete lyrics field grows with the song, stays directly editable, and shows its editing tools. In Sync, confirm the full phrase editor and row tools appear before audio upload.
- Paste plain text and use Sync plain text manually; confirm the manual tools open and the text is prefilled when the manual editor is empty.
- Confirm phrase text/time edits in Sync update Text and that timing shifts support undo/redo.
- Confirm advanced groups start closed and all previous tools remain reachable.
- Choose the format in Appearance, then change the export resolution; confirm the canvas and both format labels update immediately.
- Click the fixed Export… action or press E; confirm it opens review without rendering. Only Download video starts the render.
- Confirm review states clearly whether sound is included: no media, loaded media checked, and loaded media unchecked.
- Attempt playback/download with missing or invalid lyrics; confirm an inline message opens Text and focuses the lyrics field.
- Cancel reset, clear-current-project and delete-snapshot confirmations and confirm no data changes.
- Confirm clearing the current project removes its autosave while saved snapshots remain.
- Restore a previous active-tab preference of canvas and confirm Appearance opens, with the existing project intact.
- Switch EN/RU/ZH; check headings, tabs, tool labels, guide, commands and export summaries.
- Navigate tabs with arrows/Home/End. Open More, command search and the optional guide using the keyboard; check Escape, focus return and dialog focus containment.
- Check every tab at 1280×720, 1440×900, 1920×1080, 200% browser zoom and 390px width. Confirm no horizontal page overflow and desktop playback stays visible.
- Run node tests/menu-browser.mjs for the automated menu regression checks and screenshots.

## First-use Usability Study (manual, pending)

- Recruit five people who have never used the app; do not give interface instructions.
- Ask each person to load an example, change its appearance, and download a video.
- Record completion time, requests for help and points of hesitation.
- Acceptance target: at least four of five complete the task within three minutes without help.

## Timing and text analysis

- Select Automatic, Italian and English under Sync. Compare `io e il mio cuore` and `one little love`; explicit Enhanced LRC markers must stay fixed in every language.
- Check mixed Italian/English lyrics, apostrophes, accented hiatuses, hyphenated words and other scripts. Interface language changes must leave the selected lyrics language unchanged.
- Change lyrics language, then estimated speed; save/reload JSON and snapshots and use Undo/Redo. Both settings should survive; old projects default to Automatic.
- Compare sections with different line spacing and vocal roles. A timestamp-only instrumental boundary must not slow nearby word estimates.
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
