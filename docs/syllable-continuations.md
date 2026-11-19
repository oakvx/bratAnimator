# Timed syllable continuations

Brat mode now marks an **unfinished word** with a temporary trailing hyphen when
the imported lyric source contains multiple timed segments inside that word.
The original lyric text remains unchanged.

## Example

A fictional Enhanced LRC row with three syllable segments:

```lrc
[00:01.00] <00:01.00>tele<00:02.00>fona<00:03.00>ndo<00:03.50>
```

In **word reveal** mode, the visible text is:

| Playback time | Display |
| --- | --- |
| 1.5s | `tele-` |
| 2.5s | `telefona-` |
| 3.2s | `telefonando` |

The hyphen is a **render-only continuation indicator**, not part of the LRC,
the editable text or the persisted project. It disappears at the beginning of
the final timed segment. In typewriter mode, characters still appear at their
own timestamps; the hyphen follows the partial prefix until that last segment.

## Sources and boundaries

- **TTML / Lyricsfile**: Native syllable start/end pairs are grouped by the
  existing tokenizer into one displayed word.
- **Enhanced LRC**: Multiple inline markers inside the same word preserve
  their first onset and character-level subword timing, even when each marker
  lacks a native end timestamp.
- **Ordinary LRC**: No additional hyphens. The app never invents word splits
  when the lyric source provides only line-level timing.
- **Separated words or rows**: This feature does not infer that words separated
  by spaces or different lyric rows should be merged.
- **Display modes**: The indicator is enabled for Brat `typewriter`, `word`,
  and `letter-chunks`. Full-line, phrase, Music, Cinematic, and Kinetic
  layouts retain their existing presentation rules.

The same Brat drawing path is used for scrub/seek preview, still export and
rendered video, so the visual marker does not require a new export pipeline.

## Regression coverage

`node --test tests/syllable-continuations.test.js` covers multiple native
syllable segments, Enhanced LRC with and without terminal end markers,
unsegmented lyrics, single-segment words, and literal source hyphens.
