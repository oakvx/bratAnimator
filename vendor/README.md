# Vendor files

`vendor/mp4-muxer.mjs` is the pinned browser ESM build of `mp4-muxer@5.2.2`.

Brat Animator uses it only for the optional fast video-only MP4 export path with WebCodecs. Audio exports still use MediaRecorder real-time recording.

`mp4-muxer` is MIT licensed and deprecated upstream in favor of Mediabunny, but this app keeps the existing `Muxer` / `ArrayBufferTarget` integration for the 3.0 release.
