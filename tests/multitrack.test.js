const test = require("node:test");
const assert = require("node:assert/strict");
const Tracks = require("../assets/js/multitrack.js");
const Core = require("../assets/js/core.js");
const Assets = require("../assets/js/project-assets.js");

const createClip = (graph, trackId, kind, extras = {}) =>
    Tracks.apply(graph, "add-clip", { trackId, clip: {
        kind, name: extras.name || "clip", start: 2, duration: 8,
        source: { kind, assetId: extras.assetId || "" }, ...extras
    } });

test("legacy project migrates into isolated v1 track graph without changing v5 rendering fields", () => {
    const legacy = Core.migrateProjectPayload({ version: 3, lyrics: "[00:01]hello", audio: { name: "song.wav" } });
    const graph = Tracks.normalize(legacy.multitrack);
    assert.deepEqual(graph.tracks.map(t => t.kind), ["video", "overlay", "lyrics", "audio"]);
    assert.equal(graph.tracks.every(t => t.clips.length === 0), true);
    assert.equal(legacy.version, 5);
    assert.equal(legacy.lyrics, "[00:01]hello");
    assert.deepEqual(Tracks.normalize(JSON.parse(JSON.stringify(graph))), graph);
});

test("clips retain stable identities when normalized and serialize to plain JSON", () => {
    let graph = Tracks.empty();
    graph = createClip(graph, "main-video", "video", { assetId: "media-1" });
    const id = graph.selectedClipId;
    assert.equal(Tracks.normalize(graph).tracks[0].clips[0].id, id);
    const restored = Tracks.normalize(JSON.parse(JSON.stringify(graph)));
    assert.deepEqual(restored, graph);
    assert.equal(restored.tracks[0].clips[0].source.assetId, "media-1");
});

test("split creates two non-overlapping clips with correct source offsets", () => {
    let graph = createClip(Tracks.empty(), "main-video", "video", {
        sourceIn: 1.5, playbackRate: 2
    });
    const leftId = graph.selectedClipId;
    graph = Tracks.apply(graph, "split-clip", { clipId: leftId, at: 5 });
    const clips = graph.tracks[0].clips;
    assert.equal(clips.length, 2);
    assert.equal(clips[0].duration, 3);
    assert.equal(clips[0].sourceIn, 1.5);
    assert.equal(clips[1].start, 5);
    assert.equal(clips[1].duration, 5);
    assert.equal(clips[1].sourceIn, 7.5);
    assert.notEqual(clips[0].id, clips[1].id);
    assert.equal(Tracks.endTime(graph), 10);
});

test("trimming start updates source in-point; moving does not", () => {
    let graph = createClip(Tracks.empty(), "main-audio", "audio");
    const clipId = graph.selectedClipId;
    graph = Tracks.apply(graph, "trim-clip", { clipId, start: 4, duration: 6 });
    assert.equal(graph.tracks[3].clips[0].sourceIn, 2);
    graph = Tracks.apply(graph, "move-clip", { clipId, start: 7 });
    assert.equal(graph.tracks[3].clips[0].start, 7);
    assert.equal(graph.tracks[3].clips[0].sourceIn, 2);
    assert.equal(graph.tracks[3].clips[0].duration, 6);
});

test("track ordering and selection persist; locked tracks cannot be edited", () => {
    let graph = Tracks.apply(Tracks.empty(), "add-track", { kind: "video", name: "Second video" });
    const secondId = graph.selectedTrackId;
    graph = Tracks.apply(graph, "move-track", { trackId: secondId, direction: "up" });
    assert.equal(graph.tracks[3].id, secondId);
    graph = Tracks.apply(graph, "set-track", { trackId: secondId, locked: true });
    assert.throws(() => Tracks.apply(graph, "add-clip", { trackId: secondId, clip: { kind: "video" } }), /locked/);
    graph = Tracks.apply(graph, "set-track", { trackId: secondId, locked: false });
    graph = Tracks.apply(graph, "remove-track", { trackId: secondId });
    assert.equal(graph.tracks.some(t => t.id === secondId), false);
});

test("clip kinds cannot be moved into incompatible lanes", () => {
    let graph = createClip(Tracks.empty(), "main-audio", "audio");
    const clipId = graph.selectedClipId;
    assert.throws(() => Tracks.apply(graph, "move-clip", { clipId, toTrackId: "main-video" }), /incompatible/);
    assert.throws(() => Tracks.apply(graph, "split-clip", { clipId, at: 30 }), /inside/);
    assert.throws(() => Tracks.apply(graph, "trim-clip", { clipId, duration: -2 }), /Invalid trim/);
});

test("visible active clips map project timestamps to media timestamps in z-order", () => {
    let graph = Tracks.empty();
    graph = createClip(graph, "main-video", "video", { sourceIn: 3, playbackRate: 2 });
    graph = createClip(graph, "main-overlay", "text", { start: 5, duration: 2 });
    const visible = Tracks.activeAt(graph, 5.5);
    assert.deepEqual(visible.map(item => item.clip.kind), ["video", "text"]);
    assert.equal(visible[0].sourceTime, 10);
    graph = Tracks.apply(graph, "set-track", { trackId: "main-overlay", visible: false });
    assert.equal(Tracks.activeAt(graph, 5.5).length, 1);
    assert.equal(Tracks.activeAt(graph, -2).length, 0);
});

test("imported metadata is sanitized and invalid duplicate clip IDs are ignored", () => {
    const graph = Tracks.normalize({
        tracks: [{ id: "custom", kind: "overlay", clips: [
            { id: "same", kind: "text", name: "<svg onload=x>", start: -10, duration: 1 },
            { id: "same", kind: "text", name: "duplicate" },
            { id: "bad", kind: "audio" }
        ] }]
    });
    assert.equal(graph.tracks[0].clips.length, 1);
    assert.equal(graph.tracks[0].clips[0].start, 0);
    assert.equal(graph.tracks[0].clips[0].name, "<svg onload=x>");
});

test("clip media references survive portable .brat.zip export/import without duplication", async () => {
    let graph = createClip(Tracks.empty(), "main-audio", "audio", { assetId: "sound-1" });
    graph = Tracks.apply(graph, "duplicate-clip", { clipId: graph.selectedClipId });
    const payload = {
        version: 5, lyrics: "", audio: { source: "local", assetId: "sound-1", name: "sound.wav" },
        background: { kind: "none" }, fonts: [], multitrack: graph
    };
    const packaged = await Assets.exportPackage(payload, async id => id === "sound-1"
        ? { blob: new Blob(["audio bytes"], { type: "audio/wav" }), name: "sound.wav", kind: "audio" }
        : null);
    const restored = await Assets.importPackage(packaged);
    assert.equal(restored.assets.length, 1);
    assert.deepEqual(restored.payload.multitrack.tracks[3].clips.map(c => c.source.assetId), ["sound-1", "sound-1"]);
});
