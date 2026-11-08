# Lyrics lowercase + stanza-scoped Kinetic

## Lowercase action
In **Timing > LRC tools**, select **lowercase lyrics**. This alters the actual
lyric text, not CSS capitalization, and participates in the existing project
undo/redo and IndexedDB autosave.

- Song metadata tags such as `[ar:Artist Name]` remain untouched.
- LRC `[00:01.20]` and enhanced `<00:01.30>` timestamps are unchanged.
- Imported native word starts/ends and row metadata are preserved; the
  text within the corresponding native timing records is lowercased too.
- No external API is called.

## Kinetic: one stanza per canvas

Stanzas are separated by **blank lines** in timestamped LRC, by recognized
section headers (e.g., `[Verse 2]` or `[Chorus]`), or by a sufficiently
long vocal pause in imported lyrics that have lost line breaks.

```text
[00:01.00] first stanza line one
[00:03.00] first stanza line two

[00:05.00] second stanza line one
[00:07.00] second stanza line two
```

At 00:01, the compositor begins the first stanza. All its words receive
stable positions calculated for **the entire stanza**, with sequential reveal
based on their source word timestamps. At 00:05, none of those words carries
forward: a new empty canvas composition starts and reveals the new stanza's
first word. An instrumental gap without an active lyric slot is text-free.

The old 2–9-words-per-screen pagination has been removed from rendering.
Longer stanzas are auto-fitted into the safe canvas area. Import sources
without explicit separators use a gap heuristic; add blank lines in LRC
for precise manual control.

## Reduced-flash behavior

- Words appear instantly and fully opaque: no opacity fade, scale entrance,
  bouncing, or per-word full-screen transition.
- The background and its palette remain stable for the whole Kinetic video,
  including any project with a legacy enabled color-swap setting.
- Stanza typography is cached per canvas and is deterministic for seeking,
  preview, and PNG/MP4/WebM render paths.

These changes reduce potential flashing and strobing triggers but cannot
guarantee that every possible lyric video or user-supplied media is safe for
photosensitive viewers.

## QA
- `tests/lyrics-case.test.js`: Unicode, LRC metadata, enhanced timing.
- `tests/stanzas.test.js`: parse-through-timeline stanza separation.
- `tests/kinetic.test.js`: long verse, collision boundaries, fast rap,
  pause separation, opaque transitions and deterministic seeking.
- `tests/studio-dashboard-browser.mjs`: actual lowercase button and
  browser-side stanza reset.
