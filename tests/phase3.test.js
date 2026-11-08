const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const BratCode = require("../assets/js/bratcode.js");

test("BRATCODE Light strips binary asset references and secrets", () => {
    const payload = {
        version: 5,
        lyrics: "[00:01.00]hello",
        lyricRows: [{ time: 1, text: "hello" }],
        audio: { name: "copyrighted.mp3", url: "https://example.test/music.mp3", assetId: "asset-123", includeInExport: true, volume: 1.3 },
        background: { kind: "image", assetId: "private-image", blob: "some binary", url: "https://example.test/private.png" },
        fonts: [{ family: "Sample", assetId: "private-font", name: "Typeface" }],
        metadata: { trackName: "Example" },
        credentials: { access_token: "PRIVATE_TOKEN" },
        secret: "NO",
        assets: ["binary"]
    };
    const safe = BratCode.sanitizePayload(payload);
    const json = JSON.stringify(safe);
    assert.equal(safe.lyrics, payload.lyrics);
    assert.equal(safe.audio.assetId, "");
    assert.equal(safe.audio.url, "");
    assert.equal(safe.audio.name, "");
    assert.equal(safe.background.kind, "none");
    assert.equal(safe.fonts[0].family, "Sample");
    for (const forbidden of ["PRIVATE_TOKEN", "private-image", "private-font", "copyrighted.mp3", "example.test", '"secret"', '"credentials"', '"assets"']) {
        assert.equal(json.includes(forbidden), false, "leaked " + forbidden);
    }
    const snapshot = BratCode.makeSnapshot(payload);
    assert.equal(snapshot.type, "bratcode-light");
    assert.equal(snapshot.schemaVersion, "1");
    assert.deepEqual(BratCode.parseSnapshot(snapshot), safe);
});

test("BRATCODE input normalization validates a 128-bit opaque token", () => {
    const token = "A1B2C3D4".repeat(4);
    assert.equal(BratCode.normalizeCode("a1b2c3d4-a1b2c3d4-a1b2c3d4-a1b2c3d4"), token);
    assert.equal(BratCode.prettyCode(token), "A1B2C3D4-A1B2C3D4-A1B2C3D4-A1B2C3D4");
    assert.throws(() => BratCode.normalizeCode("ABC"), /32 caratteri/);
    assert.throws(() => BratCode.parseSnapshot({ type: "html", payload: {} }), /non valido/);
    assert.throws(() => BratCode.makeSnapshot({ lyrics: "x".repeat(250000) }), /grande/);
});

test("manual backup reminders are based on editing, not merely page visits", () => {
    const data = new Map();
    globalThis.localStorage = {
        getItem: key => data.get(key) ?? null,
        setItem: (key, value) => data.set(key, value),
        removeItem: key => data.delete(key)
    };
    require("../assets/js/backup-reminders.js");
    const reminders = globalThis.BratBackupReminders;
    assert.equal(reminders.shouldRemind("guest", "current"), false);
    for (let i = 0; i < 10; i++) reminders.recordEdit("guest", "current");
    const initial = reminders.read("guest", "current");
    assert.equal(initial.changes, 10);
    assert.equal(reminders.shouldRemind("guest", "current"), false, "no immediate nagging");
    globalThis.localStorage.setItem("bratAnimator.backup.v1.guest.current", JSON.stringify({
        ...initial, firstEdit: Date.now() - 6 * 60 * 1000
    }));
    assert.equal(reminders.shouldRemind("guest", "current"), true);
    reminders.dismiss("guest", "current");
    assert.equal(reminders.shouldRemind("guest", "current"), false);
    reminders.markBackup("guest", "current");
    assert.equal(reminders.read("guest", "current").changes, 0);
    assert.equal(reminders.shouldRemind("guest", "current"), false);
});

test("Aero theme and sounds are restricted to the dashboard", () => {
    const css = fs.readFileSync(path.join(__dirname, "../assets/css/aero-theme.css"), "utf8");
    assert.match(css, /studio-hero/);
    assert.match(css, /linear-gradient/);
    assert.match(css, /studio-project-entry/);
    assert.doesNotMatch(css, /#previewCanvas\s*\{|\.stage-canvas-zone\s*\{/);
    const sound = fs.readFileSync(path.join(__dirname, "../assets/js/dashboard-audio.js"), "utf8");
    assert.match(sound, /AudioContextClass/);
    assert.match(sound, /studio-editor-open/);
    assert.match(sound, /data-dashboard-sound-toggle/);
    assert.doesNotMatch(sound, /fetch\(/);
});

test("BRATCODE SQL uses owner authentication, expiry and anonymous import access", () => {
    const sql = fs.readFileSync(path.join(__dirname, "../supabase/migrations/20261108_bratcode_light.sql"), "utf8");
    assert.match(sql, /auth\.uid\(\)/);
    assert.match(sql, /interval '24 hours'/);
    assert.match(sql, /gen_random_uuid/);
    assert.match(sql, /bratcodes_one_active_per_account/);
    assert.match(sql, /TO anon, authenticated;/);
    assert.match(sql, /revoked_at IS NULL/);
});


test("BRATCODE removes nested private fields and unsafe URL/binary references", () => {
    const project = {
        version: 5,
        lyrics: "[00:01.00]safe text",
        lyricRows: [{ text: "safe text", start: 1,
            auth: { accessToken: "DO_NOT_SEND" },
            assetId: "SECRET_ASSET",
            nested: { url: "https://private.example/media.mp3", password: "PASSWORD" }
        }],
        style: {
            fontFamily: "Arial", fontSize: 82,
            backgroundFill: {
                color2: "#224477",
                blob: "SECRET_MEDIA",
                sourceUrl: "data:image/png;base64,PRIVATEIMAGE",
                child: { headers: { authorization: "BEARER" }, file: { binary: "SECRET_BINARY" } }
            }
        },
        metadata: { trackName: "Track", artistName: "Artist" }
    };
    const safe = BratCode.sanitizePayload(project);
    const raw = JSON.stringify(safe);
    for (const forbidden of [
        "DO_NOT_SEND", "SECRET_ASSET", "SECRET_MEDIA", "PRIVATEIMAGE",
        "PASSWORD", "BEARER", "SECRET_BINARY", "private.example"
    ]) assert.equal(raw.includes(forbidden), false, forbidden);
    assert.equal(safe.lyricRows[0].text, "safe text");
    assert.equal(safe.style.backgroundFill.color2, "#224477");
    assert.equal(safe.style.fontSize, 82);
});

test("BRATCODE rejects overly nested payloads without uploading", () => {
    const deep = { value: 1 };
    let nested = deep;
    for (let index = 0; index < 30; index++) {
        nested.child = {};
        nested = nested.child;
    }
    assert.throws(() => BratCode.makeSnapshot({ version: 5, style: deep }), /troppo profonda/);
});


test("BRATCODE SQL validates nested payloads at the RPC trust boundary", () => {
    const sql = fs.readFileSync(path.join(__dirname, "../supabase/migrations/20261108_bratcode_light.sql"), "utf8");
    assert.equal((sql.match(/CREATE OR REPLACE FUNCTION public\.bratcode_create\(/g) || []).length, 1);
    assert.equal((sql.match(/CREATE OR REPLACE FUNCTION public\.bratcode_import\(/g) || []).length, 1);
    assert.match(sql, /AS \$\$\nDECLARE/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.bratcode_safe_json/);
    assert.match(sql, /OR NOT public\.bratcode_safe_json\(p_snapshot\)/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.bratcode_safe_json\(jsonb, integer\) FROM PUBLIC/);
});

test("Creator Studio registers potentially destructive controls once, outside navigation", () => {
    const script = fs.readFileSync(path.join(__dirname, "../assets/js/studio-dashboard.js"), "utf8");
    assert.equal((script.match(/studioProjectDialogConfirm"\)\.addEventListener\("click", confirmProjectDialog\)/g) || []).length, 1);
    assert.equal((script.match(/studioCodeCreate"\)\.addEventListener\("click", createCode\)/g) || []).length, 1);
    const start = script.indexOf("    function viewSwitch(next)");
    const end = script.indexOf("    async function openProject(", start);
    assert.ok(start !== -1 && end !== -1);
    assert.equal(script.slice(start, end).includes("studioProjectDialogConfirm"), false,
        "View transitions must not register handlers");
});
