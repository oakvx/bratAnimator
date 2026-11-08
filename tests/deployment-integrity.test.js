const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
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
    assert.match(sw,/const CACHE_NAME = "brat-animator-v\d+-[a-z0-9-]+";/, "PWA cache must remain explicitly versioned");
});

test("public Supabase config uses a publishable key and TikTok remains opt-in", () => {
    const source=read("assets/js/supabase-config.js");
    const sandbox={window:{}};
    vm.runInNewContext(source,sandbox);
    const config=sandbox.window.BratSupabaseConfig;
    assert.equal(new URL(config.url).protocol,"https:");
    assert.match(config.publishableKey,/^sb_publishable_[A-Za-z0-9_-]+$/);
    const tiktok=read("assets/js/tiktok-config.js");
    assert.match(tiktok,/enabled:\s*false/);
});

test("missing, partial and server-only Supabase configurations stay disabled", () => {
    const source=read("assets/js/auth-client.js");
    for(const config of [{},{url:"https://example.supabase.co"},{publishableKey:"sb_publishable_test_key"},
        {url:"https://example.supabase.co",publishableKey:"sb_secret_never_public"}]) {
        const sandbox={URL,atob,module:{exports:{}},BratSupabaseConfig:config};
        vm.runInNewContext(source,sandbox);
        assert.equal(sandbox.module.exports.configured(),false);
    }
});
