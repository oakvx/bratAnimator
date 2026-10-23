const test = require("node:test");
const assert = require("node:assert/strict");
const assets = require("../assets/js/project-assets.js");
const zip = require("../vendor/fflate.min.js");

const project = extra => ({ version: 5, lyrics: "[00:01.00] hello", audio: { source: "local", assetId: "", name: "" }, background: { kind: "none" }, fonts: [], ...extra });
const stored = (text, name, kind, type) => ({ blob: new Blob([text], { type }), name, kind });

async function unpack(file) {
    const files = zip.unzipSync(new Uint8Array(await file.arrayBuffer()));
    return { files, manifest: JSON.parse(zip.strFromU8(files["manifest.json"])) };
}

function packageWith(manifest, entries = {}) {
    return new Blob([zip.zipSync({ "manifest.json": zip.strToU8(JSON.stringify(manifest)), ...entries })]);
}

test("complete packages round-trip local media, styles, translations and font metadata without changing the source project", async () => {
    const source = project({
        audio: { source: "local", assetId: "audio-id", name: "song.mp3", mediaKind: "audio", volume: 0.7 },
        background: { kind: "image", assetId: "background-id", name: "cover.png" },
        fonts: [{ id: "font-1", name: "my-font.woff2", family: "BratCustom_one", assetId: "font-id" }],
        phrases: [{ id: "stable-phrase", translation: "ciao", style: { textScale: 0.5 } }],
        seed: "stable-seed"
    });
    const before = JSON.stringify(source);
    const fontBytes = new Uint8Array(48);
    fontBytes.set([119, 79, 70, 50]);
    const records = new Map([
        ["audio-id", stored("audio bytes", "song.mp3", "audio", "audio/mpeg")],
        ["background-id", stored("image bytes", "cover.png", "image", "image/png")],
        ["font-id", { blob: new Blob([fontBytes], { type: "font/woff2" }), name: "my-font.woff2", kind: "font" }]
    ]);
    const updates = [];
    const file = await assets.exportPackage(source, async id => records.get(id), { onProgress: value => updates.push(value) });
    assert.equal(file.type, "application/zip");
    assert.equal(JSON.stringify(source), before);
    const restored = await assets.importPackage(file);
    assert.equal(restored.payload.seed, "stable-seed");
    assert.equal(restored.payload.phrases[0].translation, "ciao");
    assert.deepEqual(restored.payload.fonts, source.fonts);
    assert.equal(restored.assets.length, 3);
    assert.equal(await restored.assets.find(item => item.id === "audio-id").blob.text(), "audio bytes");
    assert.equal(restored.assets.find(item => item.id === "background-id").blob.type, "image/png");
    assert.equal(updates.at(-1).completed, updates.at(-1).total);
    const { manifest, files } = await unpack(file);
    assert.equal(manifest.version, 5);
    assert.equal(manifest.type, "bratAnimatorPackage");
    assert.equal(Object.keys(files).length, 4);
    // ZIP STORE keeps compressed media intact and avoids worker/CDN dependencies.
    const packed = new Uint8Array(await file.arrayBuffer());
    assert.equal(new DataView(packed.buffer).getUint16(8, true), 0);
});

test("a package without binary assets opens offline without requesting an adapter", async () => {
    const file = await assets.exportPackage(project());
    const restored = await assets.importPackage(file);
    assert.deepEqual(restored.assets, []);
    assert.equal(restored.payload.lyrics, "[00:01.00] hello");
});

test("URL media is fetched through CORS and converted to local references in the packaged project", async () => {
    const requests = [];
    const url = "https://media.example.com/song.mp3";
    const file = await assets.exportPackage(project({ audio: { source: "url", url, name: "song.mp3", mediaKind: "audio" } }), null, {
        fetch: async (source, options) => {
            requests.push({ source, options });
            return { ok: true, status: 200, blob: async () => new Blob(["remote media"], { type: "audio/mpeg" }) };
        }
    });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].options.mode, "cors");
    assert.equal(requests[0].options.credentials, "omit");
    const restored = await assets.importPackage(file);
    assert.equal(restored.payload.audio.source, "local");
    assert.equal(restored.payload.audio.url, "");
    assert.equal(restored.payload.audio.assetId, restored.assets[0].id);
    assert.equal(await restored.assets[0].blob.text(), "remote media");
});

test("shared asset identifiers are embedded once", async () => {
    let requests = 0;
    const file = await assets.exportPackage(project({
        audio: { assetId: "clip", source: "local", name: "clip.webm", mediaKind: "video" },
        background: { assetId: "clip", kind: "video", name: "clip.webm" }
    }), async () => {
        requests += 1;
        return stored("video", "clip.webm", "video", "video/webm");
    });
    assert.equal(requests, 1);
    assert.equal((await assets.importPackage(file)).assets.length, 1);
});

test("YouTube previews remain URL references and require no media download", async () => {
    const url = "https://www.youtube.com/watch?v=lg_dFaq1iSo";
    const file = await assets.exportPackage(project({ audio: { source: "url", url, name: "YouTube preview" } }), () => assert.fail("unexpected asset read"), { fetch: () => assert.fail("unexpected fetch") });
    const restored = await assets.importPackage(file);
    assert.equal(restored.payload.audio.url, url);
    assert.equal(restored.assets.length, 0);
});

test("missing local files and failed CORS downloads are reported together before any package is returned", async () => {
    const pending = assets.exportPackage(project({
        audio: { source: "local", assetId: "gone", name: "song.mp3" },
        background: { kind: "image", url: "https://media.example.com/cover.png", name: "cover.png" },
        fonts: [{ id: "font", assetId: "lost-font", name: "custom.ttf" }]
    }), async () => null, { fetch: async () => { throw new Error("CORS blocked"); } });
    await assert.rejects(pending, error => {
        assert.equal(error.code, "MISSING_ASSETS");
        assert.equal(error.missingAssets.length, 3);
        assert.match(error.missingAssets[1].reason, /CORS/);
        return true;
    });
});

test("package operations can be cancelled and do not continue reading assets", async () => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(assets.exportPackage(project(), () => assert.fail("unexpected read"), { signal: controller.signal }), { name: "AbortError" });
    await assert.rejects(assets.importPackage(new Blob(), { signal: controller.signal }), { name: "AbortError" });
});

test("rejects unsupported project/package versions and invalid manifest JSON", async () => {
    await assert.rejects(assets.exportPackage({ version: 4 }), { code: "UNSUPPORTED_VERSION" });
    await assert.rejects(assets.importPackage(packageWith({ type: "bratAnimatorPackage", version: 6, project: project(), assets: [] })), { code: "UNSUPPORTED_VERSION" });
    const invalid = new Blob([zip.zipSync({ "manifest.json": zip.strToU8("not json") })]);
    await assert.rejects(assets.importPackage(invalid), /valid JSON/);
    await assert.rejects(assets.importPackage(new Blob(["not zip"])), /empty, truncated|directory/);
});

test("rejects missing package entries, duplicated asset IDs and unlisted files", async () => {
    const descriptor = { id: "asset", path: "assets/a.mp3", name: "a.mp3", kind: "audio", type: "audio/mpeg", size: 3 };
    const manifest = { type: "bratAnimatorPackage", version: 5, project: project({ audio: { source: "local", assetId: "asset", name: "a.mp3" } }), assets: [descriptor] };
    await assert.rejects(assets.importPackage(packageWith(manifest)), { code: "MISSING_ASSETS" });
    await assert.rejects(assets.importPackage(packageWith({ ...manifest, assets: [descriptor, { ...descriptor, path: "assets/b.mp3" }] }, { "assets/a.mp3": zip.strToU8("abc"), "assets/b.mp3": zip.strToU8("abc") })), /duplicate/);
    await assert.rejects(assets.importPackage(packageWith({ ...manifest, assets: [] }, { "assets/unused.bin": zip.strToU8("abc") })), /not listed/);
});

test("rejects path traversal and a project that references a missing font", async () => {
    const base = { type: "bratAnimatorPackage", version: 5, project: project(), assets: [] };
    await assert.rejects(assets.importPackage(packageWith(base, { "../escape": zip.strToU8("abc") })), /Unsafe/);
    await assert.rejects(assets.importPackage(packageWith(base, { "assets\\escape": zip.strToU8("abc") })), /Unsafe/);
    await assert.rejects(assets.importPackage(packageWith({ ...base, project: project({ fonts: [{ id: "missing", assetId: "missing", name: "missing.ttf" }] }) })), { code: "MISSING_ASSETS" });
});

test("rejects duplicate ZIP paths and invalid font binaries before returning a project", async () => {
    const base = { type: "bratAnimatorPackage", version: 5, project: project(), assets: [] };
    const duplicate = Buffer.from(await packageWith(base, { "assets/a.bin": zip.strToU8("a"), "assets/b.bin": zip.strToU8("b") }).arrayBuffer());
    const needle = Buffer.from("assets/b.bin");
    let position = duplicate.indexOf(needle);
    while (position !== -1) {
        duplicate.write("assets/a.bin", position);
        position = duplicate.indexOf(needle, position + needle.length);
    }
    await assert.rejects(assets.importPackage(duplicate), /duplicate ZIP path/);
    const font = { id: "font", path: "assets/font.ttf", name: "font.ttf", kind: "font", type: "font/ttf", size: 12 };
    const manifest = { ...base, project: project({ fonts: [{ id: "font", assetId: "font", name: "font.ttf" }] }), assets: [font] };
    await assert.rejects(assets.importPackage(packageWith(manifest, { "assets/font.ttf": new Uint8Array(12) })), /font file is invalid/);
});

test("rejects corrupt STORE media even when its size and ZIP directory are intact", async () => {
    const file = await assets.exportPackage(project({ audio: { source: "local", assetId: "audio", name: "a.mp3" } }), () => stored("sentinel-media-bytes", "a.mp3", "audio", "audio/mpeg"));
    const packed = new Uint8Array(await file.arrayBuffer());
    const marker = Buffer.from(packed).indexOf("sentinel-media-bytes");
    assert.ok(marker > 0);
    packed[marker] ^= 1;
    await assert.rejects(assets.importPackage(packed), /damaged/);
});

test("rejects oversized declared entries before inflation", async () => {
    const packed = new Uint8Array(await (await assets.exportPackage(project())).arrayBuffer());
    const view = new DataView(packed.buffer);
    let central = -1;
    for (let index = 0; index < packed.length - 4; index += 1) {
        if (view.getUint32(index, true) === 0x02014b50) { central = index; break; }
    }
    assert.ok(central > 0);
    view.setUint32(central + 24, 0x7fffffff, true);
    await assert.rejects(assets.importPackage(packed), /size limits/);
});

test("fonts load before use, preserve metadata and require explicit replacement when unavailable", async () => {
    const previousFace = global.FontFace;
    const previousDocument = global.document;
    const installed = new Set();
    let loads = 0;
    global.document = { fonts: { add: face => installed.add(face), delete: face => installed.delete(face), ready: Promise.resolve() } };
    global.FontFace = class {
        constructor(family, bytes) { this.family = family; this.bytes = bytes; this.status = "unloaded"; }
        async load() { loads += 1; this.status = "loaded"; return this; }
    };
    try {
        const metadata = { id: "user-font", name: "custom.woff2", family: "BratCustom_User", assetId: "saved-font" };
        const registered = await assets.registerFont(new Blob(["font data"]), metadata);
        assert.deepEqual(registered, metadata);
        assert.equal(installed.size, 1);
        await assets.awaitFonts([metadata]);
        await assets.prepareFonts([metadata], () => assert.fail("a loaded font should be reused"));
        assert.equal(loads, 1);
        assets.removeFonts();
        assert.equal(installed.size, 0);
        await assert.rejects(assets.awaitFonts([metadata]), error => error.code === "FONT_UNAVAILABLE" && error.missingFonts[0].id === metadata.id);
        await assert.rejects(assets.prepareFonts([metadata], async () => null), /Reload or replace/);
        await assets.prepareFonts([metadata], async () => ({ blob: new Blob(["font data"]), name: "custom.woff2" }));
        await assets.awaitFonts([metadata]);
        await assert.rejects(assets.registerFont(new Blob(["data"]), { name: "bad.exe" }), /TTF/);
    } finally {
        assets.removeFonts();
        global.FontFace = previousFace;
        global.document = previousDocument;
    }
});
