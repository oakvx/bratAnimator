const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root,file),"utf8");

test("all local stylesheet/script entrypoint assets exist and are available offline", () => {
    const html = read("index.html");
    const sw = read("sw.js");
    const match = sw.match(/const APP_ASSETS = \[([\s\S]*?)\];/);
    assert.ok(match, "PWA precache declaration missing");
    const cached = new Set([...match[1].matchAll(/"\.\/([^"]+)"/g)].map(row => row[1]));
    const entrypoints = [
        ...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
        ...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g)
    ].map(row => row[1]).filter(src => !/^https?:|^\/\//.test(src));
    assert.ok(entrypoints.length >= 25,"unexpected missing frontend scripts");
    for (const asset of entrypoints) {
        assert.ok(fs.existsSync(path.join(root,asset)),asset+" missing from filesystem");
        assert.ok(cached.has(asset),asset+" missing from offline cache");
    }
    assert.ok(cached.has("assets/js/editor-templates.js"));
    assert.ok(cached.has("assets/js/export-preflight.js"));
});

test("offline asset list never contains credential files or TikTok server sources", () => {
    const sw = read("sw.js");
    assert.doesNotMatch(sw,/SERVICE_ROLE_KEY|TIKTOK_CLIENT_SECRET|supabase\/functions\//);
    assert.match(sw,/brat-animator-v16-supabase-tiktok-login/);
});

test("public Supabase config is fail closed until an operator sets it", () => {
    const source=read("assets/js/supabase-config.js");
    assert.match(source,/url:\s*""/);
    assert.match(source,/publishableKey:\s*""/);
    const tiktok=read("assets/js/tiktok-config.js");
    assert.match(tiktok,/enabled:\s*false/);
});
