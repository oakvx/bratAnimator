const test = require("node:test");
const assert = require("node:assert/strict");
const Tracks = require("../assets/js/multitrack.js");
const AudioMixer = require("../assets/js/audio-mixer.js");
const Engine = require("../assets/js/export-engine.js");

function insert(graph, trackId, kind, assetId, extra = {}) {
    return Tracks.apply(graph, "add-clip", { trackId, clip: {
        kind, name: kind + "-" + assetId, start: 1, duration: 8,
        source: { kind, assetId, name: assetId }, ...extra
    } });
}

test("phase 16 stores track and clip volume, fades and playback rates in JSON snapshots", () => {
    let graph = insert(Tracks.empty(), "main-audio", "audio", "song");
    graph = Tracks.apply(graph, "set-track", { trackId: "main-audio", volume: .6 });
    graph = Tracks.apply(graph, "set-clip", { clipId: graph.selectedClipId,
        volume: .5, fadeIn: 1.5, fadeOut: 2, playbackRate: 1.5 });
    assert.deepEqual(AudioMixer.audible(graph).map(clip => [clip.volume, clip.fadeIn, clip.fadeOut, clip.playbackRate]), [[.3, 1.5, 2, 1.5]]);
    assert.deepEqual(Tracks.normalize(JSON.parse(JSON.stringify(graph))), graph);
    graph = Tracks.apply(graph, "set-track", { trackId: "main-audio", muted: true });
    assert.equal(AudioMixer.audible(graph).length, 0);
});

test("video clip sound remains independently mutable without hiding its visual layer", () => {
    let graph = insert(Tracks.empty(), "main-video", "video", "talking");
    const clipId = graph.selectedClipId;
    assert.equal(AudioMixer.audible(graph).length, 1);
    graph = Tracks.apply(graph, "set-clip", { clipId, muted: true });
    assert.equal(AudioMixer.audible(graph).length, 0);
    assert.equal(Tracks.activeAt(graph, 3).filter(c => c.clip.kind === "video").length, 1);
});

test("phase 16 decodes each locally imported audio source once and reuses buffers", async () => {
    let decodes = 0, reads = 0;
    const buffer = { duration: 12, length: 12 * 48000 };
    class AudioContext {
        async decodeAudioData(data) { assert.equal(data.byteLength, 8); decodes++; return buffer; }
        close() { return Promise.resolve(); }
    }
    const mixer = AudioMixer.createController({
        environment: { AudioContext },
        loadAsset: async id => {
            reads++; assert.equal(id, "sound-1");
            return { blob: new Blob([new Uint8Array(8)]), name: "sound.wav" };
        }
    });
    let graph = insert(Tracks.empty(), "main-audio", "audio", "sound-1");
    graph = Tracks.apply(graph, "duplicate-clip", { clipId: graph.selectedClipId });
    const first = await mixer.prepare(graph);
    assert.equal(first.clips.length, 2);
    assert.equal(first.clips[0].buffer, buffer);
    assert.equal(mixer.cachedCount, 1);
    assert.equal(decodes, 1);
    assert.equal(reads, 1);
    await mixer.prepare(graph);
    assert.equal(decodes, 1);
    mixer.dispose();
    assert.equal(mixer.cachedCount, 0);
});

test("removing a clip releases stale decoded media while preserving shared sources", async () => {
    let graph = insert(Tracks.empty(), "main-audio", "audio", "shared");
    const first = graph.selectedClipId;
    graph = Tracks.apply(graph, "duplicate-clip", { clipId: first });
    const mixer = AudioMixer.createController({
        environment: { AudioContext: class {
            async decodeAudioData() { return { duration: 10, length: 480000 }; }
            close() { return Promise.resolve(); }
        } },
        loadAsset: async () => ({ blob: new Blob([new Uint8Array([1, 2])]), name: "shared.wav" })
    });
    await mixer.prepare(graph);
    assert.equal(mixer.cachedCount, 1);
    graph = Tracks.apply(graph, "remove-clip", { clipId: first });
    mixer.prune(graph);
    assert.equal(mixer.cachedCount, 1);
    graph = Tracks.apply(graph, "remove-clip", { clipId: graph.selectedClipId ||
        graph.tracks[3].clips[0].id });
    mixer.prune(graph);
    assert.equal(mixer.cachedCount, 0);
    mixer.dispose();
});

test("phase 16 playback and cropped export use the same source offsets", async () => {
    const started = [], gains = [], stopped = [];
    const buffer = { duration: 20, length: 20 * 48000 };
    class AudioContext {
        currentTime = 10; state = "running"; destination = {};
        async decodeAudioData() { return buffer; }
        createBufferSource() {
            const source = {
                playbackRate: { value: 1 },
                connect() {}, disconnect() {},
                start(...args) { started.push({ args, rate: this.playbackRate.value }); },
                stop() { stopped.push(true); }
            };
            return source;
        }
        createGain() { return { connect() {}, gain: {
            setValueAtTime(...x) { gains.push(x); },
            linearRampToValueAtTime(...x) { gains.push(x); }
        } }; }
        close() { return Promise.resolve(); }
    }
    const mixer = AudioMixer.createController({
        environment: { AudioContext, BratExportEngine: Engine },
        loadAsset: async () => ({ blob: new Blob([new Uint8Array([1, 2])]), name: "voice.wav" })
    });
    let graph = insert(Tracks.empty(), "main-audio", "audio", "voice", {
        start: 2, duration: 6, sourceIn: 1, playbackRate: 1.5,
        fadeIn: .5, fadeOut: 1
    });
    const projectOffset = 4;
    await mixer.play(graph, () => projectOffset);
    assert.equal(started.length, 1);
    assert.ok(Math.abs(started[0].args[0] - 10.04) < 1e-9);
    assert.equal(started[0].args[1], 4);
    assert.equal(started[0].args[2], 6);
    assert.equal(started[0].rate, 1.5);
    assert.ok(gains.length >= 2);
    mixer.stop();
    assert.equal(stopped.length, 1);
    mixer.dispose();
});

test("phase 16 video without a decodable audio track is reported, never crashes video export", async () => {
    const warnings = [];
    class AudioContext {
        async decodeAudioData() { throw new Error("No audio stream"); }
        close() { return Promise.resolve(); }
    }
    const mixer = AudioMixer.createController({
        environment: { AudioContext },
        onStatus: message => warnings.push(message),
        loadAsset: async () => ({ blob: new Blob([new Uint8Array([1])]), name: "silent.mp4" })
    });
    let graph = insert(Tracks.empty(), "main-video", "video", "video-1");
    const result = await mixer.prepare(graph);
    assert.equal(result.clips.length, 0);
    assert.equal(result.warnings.length, 1);
    assert.match(warnings[0], /silent or use an unsupported audio codec/);
    mixer.dispose();
});

test("phase 16 explicitly fails when an audio track has missing or undecodable media", async () => {
    const mixer = AudioMixer.createController({
        environment: { AudioContext: class { async decodeAudioData() { throw new Error("codec unavailable"); } close() { return Promise.resolve(); } } },
        loadAsset: async () => ({ blob: new Blob([new Uint8Array([1])]), name: "bad.mp3" })
    });
    let graph = insert(Tracks.empty(), "main-audio", "audio", "bad-audio");
    await assert.rejects(() => mixer.prepare(graph), /Cannot decode audio/);
    graph = insert(Tracks.empty(), "main-audio", "audio", "");
    await assert.rejects(() => mixer.prepare(graph), /has no local file/);
    mixer.dispose();
});
