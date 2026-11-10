const test = require("node:test");
const assert = require("node:assert/strict");
const Tracks = require("../assets/js/multitrack.js");
const Composer = require("../assets/js/video-composer.js");

test("phase 15 clips have resolution-independent geometry and idempotent normalization", () => {
    const graph = Tracks.apply(Tracks.empty(), "add-clip", { trackId: "main-overlay", clip: {
        kind: "image", source: { kind: "image", assetId: "pink-sticker" },
        transform: { x: .15, y: .7, width: .25, height: .4, rotation: -20, fit: "contain" },
        opacity: .65
    } });
    const clip = graph.tracks[1].clips[0];
    const rect = Composer.rectangle(clip.transform, 1080, 1920);
    assert.equal(rect.x, 162);
    assert.equal(rect.y, 1344);
    assert.equal(rect.width, 270);
    assert.equal(rect.height, 768);
    assert.equal(rect.fit, "contain");
    assert.equal(clip.opacity, .65);
    assert.deepEqual(Tracks.normalize(JSON.parse(JSON.stringify(graph))), graph);
});

test("layer position relative to the lyrics lane respects z-order", () => {
    let graph = Tracks.empty();
    graph = Tracks.apply(graph, "add-clip", { trackId: "main-video", clip: { kind: "video", duration: 4 } });
    graph = Tracks.apply(graph, "add-clip", { trackId: "main-overlay", clip: { kind: "text", name: "under" } });
    graph = Tracks.apply(graph, "add-track", { kind: "overlay", name: "Front" });
    const front = graph.selectedTrackId;
    graph = Tracks.apply(graph, "add-clip", { trackId: front, clip: { kind: "image", name: "above" } });
    assert.deepEqual(Composer.visualClips(graph, 1, "below").map(x => x.clip.kind), ["video", "text"]);
    assert.deepEqual(Composer.visualClips(graph, 1, "above").map(x => x.clip.kind), ["image"]);
    assert.equal(Composer.visualClips(graph, 10).length, 0);
    assert.equal(Composer.hasVisualClips(graph), true);
    graph = Tracks.apply(graph, "set-track", { trackId: "main-video", visible: false });
    assert.deepEqual(Composer.visualClips(graph, 1).map(x => x.clip.kind), ["text", "image"]);
});

test("phase 15 sanitizes imported transforms and enforces finite bounds", () => {
    const clip = Tracks.normalizeClip({
        kind: "image", transform: { x: 10, y: -10, width: Infinity, height: 20,
            fit: "invalid", rotation: 720 }, opacity: 500
    }, "overlay");
    assert.equal(clip.transform.x, 1);
    assert.equal(clip.transform.y, 0);
    assert.equal(clip.transform.width, .52);
    assert.equal(clip.transform.height, 4);
    assert.equal(clip.transform.rotation, 360);
    assert.equal(clip.transform.fit, "cover");
    assert.equal(clip.opacity, 1);
});

test("phase 15 draws images with cover and contain scaling and isolated canvas state", () => {
    const calls = [];
    const context = {
        globalAlpha: 1,
        save() { calls.push("save"); },
        restore() { calls.push("restore"); },
        translate(...x) { calls.push(["translate", ...x]); },
        rotate(n) { calls.push(["rotate", n]); },
        beginPath() {}, rect(...x) { calls.push(["rect", ...x]); },
        clip() {}, drawImage(...x) { calls.push(["image", ...x.slice(1)]); }
    };
    const clip = Tracks.normalizeClip({
        kind: "image", opacity: .4,
        transform: { x: .5, y: .5, width: 1, height: 1, fit: "contain" }
    }, "video");
    Composer.drawMedia(context, { tag: "image" }, { width: 200, height: 100 }, clip, 100, 100);
    assert.ok(calls.some(call => Array.isArray(call) && call[0] === "image"));
    assert.deepEqual(calls.filter(x => x === "save" || x === "restore"), ["save", "restore"]);
});

test("no cross-project source references survive composer synchronization", async () => {
    let next = 0;
    const urls = [];
    const revoked = [];
    class Image {
        naturalWidth = 40; naturalHeight = 20;
        set src(value) { this._src = value; }
        decode() { return Promise.resolve(); }
    }
    const controller = Composer.createController({
        environment: {
            Image,
            URL: {
                createObjectURL() { const url = "blob:test" + (++next); urls.push(url); return url; },
                revokeObjectURL(url) { revoked.push(url); }
            }
        },
        loadAsset: async assetId => ({ name: assetId, blob: { size: 10 } })
    });
    let graph = Tracks.apply(Tracks.empty(), "add-clip", { trackId: "main-video",
        clip: { kind: "image", source: { kind: "image", assetId: "asset-a" } }
    });
    await controller.sync(graph);
    assert.equal(controller.loaded(), 1);
    graph = Tracks.empty();
    await controller.sync(graph);
    assert.equal(controller.loaded(), 0);
    assert.deepEqual(urls, revoked);
    controller.dispose();
});

test("missing local files fail the preflight instead of silently vanishing from exported frames", async () => {
    const composer = Composer.createController({
        loadAsset: async () => null,
        environment: { URL: { createObjectURL() {}, revokeObjectURL() {} } }
    });
    const graph = Tracks.apply(Tracks.empty(), "add-clip", { trackId: "main-video",
        clip: { kind: "image", name: "missing.png", source: { kind: "image", assetId: "missing" } }
    });
    await assert.rejects(() => composer.prepare(graph, 2), /Media asset missing/);
    composer.dispose();
});
