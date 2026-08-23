const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../assets/js/core.js");
const media = require("../assets/js/media.js");
const exportHelpers = require("../assets/js/export.js");

test("parses standard LRC timestamps", () => {
    const rows = core.parseLRC("[00:01.20] first\n[00:03,40] second");
    assert.equal(rows.length, 2);
    assert.equal(rows[0].timestamp, 1.2);
    assert.equal(rows[1].text, "second");
});

test("parses Enhanced LRC word timing", () => {
    const [line] = core.parseLRC("[00:10.00] <00:10.10>Hello <00:10.55>world");
    assert.equal(line.text, "Hello world");
    assert.deepEqual(line.wordTimings.map(word => word.text), ["Hello", "world"]);
    assert.equal(line.wordTimings[1].timestamp, 10.55);
});

test("converts and shifts editable LRC rows", () => {
    const rows = core.lrcToRows("[00:01.00] one\n[00:02.00] two");
    const shifted = core.shiftRows(rows, 0.5, [1]);
    assert.equal(core.rowsToLrc(shifted), "[00:01.00] one\n[00:02.50] two");
});

test("round-trips editable timestamps", () => {
    assert.equal(core.tagToSeconds("01:02.50"), 62.5);
    assert.equal(core.secondsToTag(62.5), "[01:02.50]");
});

test("splits, merges, and moves rows", () => {
    const rows = [{ time: 1, text: "hello world" }, { time: 3, text: "again" }];
    const split = core.splitRow(rows, 0, 5);
    assert.deepEqual(split.map(row => row.text), ["hello", "world", "again"]);
    const merged = core.mergeRows(split, 0);
    assert.deepEqual(merged.map(row => row.text), ["hello world", "again"]);
    const moved = core.moveRow(merged, 1, -1);
    assert.deepEqual(moved.map(row => row.text), ["again", "hello world"]);
});

test("migrates legacy project payloads to v3", () => {
    const migrated = core.migrateProjectPayload({
        version: 3,
        lyrics: "[00:01.00] legacy",
        includeAudioInExport: false,
        style: { textColor: "#111111" }
    });
    assert.equal(migrated.version, 3);
    assert.equal(migrated.audio.includeInExport, false);
    assert.equal(migrated.style.wordAnimation.mode, "progress");
    assert.equal(migrated.background.kind, "none");
});

test("migrates v2 payloads with audio and background defaults", () => {
    const migrated = core.migrateProjectPayload({
        version: 2,
        includeAudioInExport: true,
        audio: { mediaKind: "video" },
        style: { bgColor: "#8ACE00" }
    });
    assert.equal(migrated.version, 3);
    assert.equal(migrated.audio.volume, 1);
    assert.equal(migrated.audio.fadeIn, 0);
    assert.equal(migrated.audio.assetId, "");
    assert.equal(migrated.audio.mediaKind, "video");
    assert.equal(migrated.background.opacity, 1);
});

test("round-trips v3 project schema without binary blobs", () => {
    const payload = core.migrateProjectPayload({
        version: 3,
        lyrics: "[00:01.00] chorus",
        audio: {
            includeInExport: true,
            volume: 0.65,
            fadeIn: 1.25,
            fadeOut: 0.75,
            source: "url",
            url: "https://cdn.example.com/song.mp4",
            assetId: "",
            name: "song.mp4",
            mediaKind: "video"
        },
        metadata: {
            trackName: "Track",
            artistName: "Artist",
            albumName: "Album",
            duration: 123,
            artworkUrl: "https://cdn.example.com/art.jpg",
            source: "lrclib"
        },
        background: {
            kind: "image",
            assetId: "local-image",
            url: "",
            opacity: 0.8,
            blur: 4,
            brightness: 1.1,
            saturation: 1.2,
            scale: 1.05,
            positionX: 0.4,
            positionY: 0.6
        },
        style: {
            textColor: "#111111",
            wordAnimation: { mode: "color", intensity: 0.5, color: "#8ACE00" }
        }
    });
    const roundTrip = core.migrateProjectPayload(JSON.parse(JSON.stringify(payload)));
    assert.equal(roundTrip.version, 3);
    assert.equal(roundTrip.audio.mediaKind, "video");
    assert.equal(roundTrip.audio.volume, 0.65);
    assert.equal(roundTrip.metadata.trackName, "Track");
    assert.equal(roundTrip.background.assetId, "local-image");
    assert.equal(roundTrip.style.wordAnimation.mode, "color");
    assert.equal(Object.hasOwn(roundTrip.audio, "blob"), false);
});

test("exports preset payloads without lyrics", () => {
    const preset = core.buildPresetPayload({
        lyrics: "[00:01.00] do not include",
        style: { bgColor: "#8ACE00" },
        formatPreset: "vertical"
    }, "mobile");
    assert.equal(preset.type, "bratAnimatorPreset");
    assert.equal(preset.name, "mobile");
    assert.equal(preset.formatPreset, "vertical");
    assert.equal(Object.hasOwn(preset, "lyrics"), false);
});

test("preset payload carries style, format, and background settings", () => {
    const preset = core.buildPresetPayload({
        style: { bgColor: "#111111", wordAnimation: { mode: "glow", intensity: 0.8, color: "#ffffff" } },
        background: { kind: "video", url: "https://cdn.example.com/bg.webm", opacity: 0.7 },
        formatPreset: "landscape",
        exportSize: "1440",
        exportFps: "60"
    }, "stage");
    assert.equal(preset.background.kind, "video");
    assert.equal(preset.background.opacity, 0.7);
    assert.equal(preset.style.wordAnimation.mode, "glow");
    assert.equal(preset.exportFps, "60");
});

test("infers media kinds and blocks YouTube as direct media", () => {
    assert.equal(media.inferAudioMediaKind("clip.mp4", "video/mp4"), "video");
    assert.equal(media.inferAudioMediaKind("track.flac", "audio/flac"), "audio");
    assert.equal(media.inferBackgroundKind("cover.jpg", "image/jpeg"), "image");
    assert.equal(media.inferBackgroundKind("loop.webm", "video/webm"), "video");
    assert.equal(media.isYouTubeUrl("https://youtu.be/lg_dFaq1iSo?list=RD"), true);
    assert.equal(media.extractYouTubeVideoId("https://www.youtube.com/watch?v=lg_dFaq1iSo"), "lg_dFaq1iSo");
    assert.equal(media.mediaNameFromUrl("https://cdn.example.com/path/song%20file.mp3?token=1"), "song file.mp3");
});

test("export capability helpers require WebCodecs and muxer support", async () => {
    assert.equal(exportHelpers.canAttemptFastExport({}), false);
    assert.equal(await exportHelpers.hasMp4MuxerModule(), true);
    assert.equal(await exportHelpers.canUseFastMp4Export(1080, 30, 1080, {}), false);
    assert.equal(typeof exportHelpers.loadMp4MuxerModule, "function");
});
