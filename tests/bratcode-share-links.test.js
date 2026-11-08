const test = require("node:test");
const assert = require("node:assert/strict");
const BratCode = require("../assets/js/bratcode.js");
const location = { origin: "https://oakvx.github.io", pathname: "/bratAnimator/" };
const code = "A".repeat(32);

test("BRATCODE links are origin/path bound and never auto import", () => {
    const link = BratCode.shareLink(code, location);
    assert.equal(link, "https://oakvx.github.io/bratAnimator/#bratcode=" + code);
    assert.equal(BratCode.codeFromInput(link, location), code);
    assert.equal(BratCode.codeFromInput(BratCode.prettyCode(code), location), code);
    assert.throws(() => BratCode.codeFromInput("https://evil.example/bratAnimator/#bratcode=" + code, location));
    assert.throws(() => BratCode.codeFromInput("https://oakvx.github.io/elsewhere/#bratcode=" + code, location));
    assert.throws(() => BratCode.codeFromInput("https://oakvx.github.io/bratAnimator/#project=" + code, location));
    assert.throws(() => BratCode.codeFromInput("not a code", location));
});

test("BRATCODE transfer strips nested media, credentials and URLs", () => {
    const snapshot = BratCode.makeSnapshot({
        version: 5, lyrics: "[00:01.00]Test lyric",
        metadata: { trackName: "Local track", token: "secret" },
        audio: { assetId: "local-audio-123", url: "blob:test", volume: .5 },
        background: { kind: "image", url: "https://example.net/preview.png" },
        style: { password: "never upload", inner: { mediaBlobs: ["secret"], color: "#fff" } }
    });
    assert.equal(snapshot.type, "bratcode-light");
    assert.equal(snapshot.payload.audio.assetId, "");
    assert.equal(snapshot.payload.background.kind, "none");
    assert.equal(snapshot.payload.metadata.token, undefined);
    assert.equal(snapshot.payload.style.password, undefined);
    assert.equal(BratCode.parseSnapshot(snapshot).lyrics, "[00:01.00]Test lyric");
});

test("BRATCODE mocked RPC covers create, active, anonymous import and revoke", async () => {
    const previous = globalThis.BratAuth;
    const operations = [];
    let user = { id: "demo" };
    globalThis.BratAuth = {
        configured: () => true,
        user: () => user,
        rpc: async (name, params) => {
            operations.push({ name, params });
            if (name === "bratcode_create") return [{ code, expires_at: "2030-01-01T00:00:00Z" }];
            if (name === "bratcode_active") return [{ code, expires_at: "2030-01-01T00:00:00Z" }];
            if (name === "bratcode_import") return BratCode.makeSnapshot({version:5, lyrics:"[00:01.00]import"});
            if (name === "bratcode_revoke") return true;
            throw new Error("Unknown RPC");
        }
    };
    try {
        const shared = await BratCode.create({ version: 5, lyrics: "[00:01.00]share" });
        assert.equal(shared.code, code);
        assert.equal((await BratCode.getActive()).code, code);
        user = null; // import must not require an authenticated session
        const imported = await BratCode.importCode(code);
        // In non-browser tests there is no root.location: only raw code is accepted.
        assert.equal(imported.lyrics, "[00:01.00]import");
        assert.deepEqual(operations.map(op => op.name).slice(0, 3), ["bratcode_create","bratcode_active","bratcode_import"]);
        user = { id: "demo" };
        assert.equal(await BratCode.revoke(), true);
    } finally {
        globalThis.BratAuth = previous;
    }
});
