# Vendor files

`vendor/js-yaml.min.js` is the pinned UMD build of `js-yaml@4.1.1`, used for
Lyricsfile 1.0 imports and LRCLIB/lrc.red word timing. It is loaded locally and
cached for offline use. Imports use the safe CORE schema (no custom tags),
reject duplicate keys and limit document size and nesting. The MIT license is
included in `vendor/js-yaml.LICENSE.txt`. Source and published build:
https://github.com/nodeca/js-yaml/tree/4.1.1/dist.

`vendor/mp4-muxer.mjs` is the pinned browser ESM build of `mp4-muxer@5.2.2`.

Brat Animator uses it only for the optional fast video-only MP4 export path with WebCodecs. Audio exports still use MediaRecorder real-time recording.

`mp4-muxer` is MIT licensed and deprecated upstream in favor of Mediabunny, but this app keeps the existing `Muxer` / `ArrayBufferTarget` integration for the 3.0 release.

`vendor/fflate.min.js` is the pinned UMD build of `fflate@0.8.2`, used for complete
`.brat.zip` projects. It works with classic scripts, including a direct `file://`
launch, without a build step or CDN request. Media and fonts use ZIP STORE to avoid
recompressing already compressed content. The upstream license is included in
`vendor/fflate.LICENSE.txt` (MIT). Source: https://github.com/101arrowz/fflate,
published artifact: https://unpkg.com/fflate@0.8.2/umd/index.js.
