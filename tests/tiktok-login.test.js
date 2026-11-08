const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

function browser(overrides = {}) {
    const values = new Map();
    const requests = [];
    const root = {
        URL, URLSearchParams, TextEncoder, crypto: webcrypto, Date,
        BratSupabaseConfig: { url: "https://project.supabase.co", publishableKey: "sb_publishable_public_test_key" },
        BratTikTokConfig: { enabled: true },
        location: { origin: "https://example.com", pathname: "/app/", search: "", hash: "", assign(url) { this.assigned = url; } },
        history: { replaceState(...args) { root.replaced = args[2]; } },
        sessionStorage: { setItem: (k, v) => values.set(k, v), getItem: k => values.get(k) || null, removeItem: k => values.delete(k) },
        fetch: async (url, options) => {
            requests.push({ url, ...options, data: JSON.parse(options.body) });
            return { ok: true, json: async () => ({ url: "https://www.tiktok.com/v2/auth/authorize/?state=" + "s".repeat(43) }) };
        },
        ...overrides
    };
    root.globalThis = root;
    root.module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve("../assets/js/tiktok-login.js"), "utf8"), root);
    return { root, api: root.module.exports, values, requests };
}

test("TikTok login starts without an existing Supabase user and stores only browser proof", async () => {
    const { root, api, requests, values } = browser();
    await api.signIn();
    assert.equal(requests[0].data.action, "login");
    assert.match(requests[0].data.challenge, /^[a-f0-9]{64}$/);
    assert.equal(requests[0].headers.Authorization, undefined);
    assert.match(root.location.assigned, /^https:\/\/www\.tiktok\.com\/v2\/auth\/authorize\//);
    const pending = JSON.parse([...values.values()][0]);
    assert.match(pending.verifier, /^[a-f0-9]{64}$/);
    assert.notEqual(pending.verifier, requests[0].data.challenge);
});

test("callback redeems the matching browser proof and cleans URL and session storage", async () => {
    const { root, api, requests, values } = browser();
    await api.signIn();
    root.location.hash = "#tiktok_login=success&state=" + "s".repeat(43) + "&ticket=" + "t".repeat(43);
    root.fetch = async (url, options) => {
        requests.push({ data: JSON.parse(options.body) });
        return { ok: true, json: async () => ({ token_hash: "one-time-supabase-proof" }) };
    };
    assert.equal(await api.completeSignIn(), "one-time-supabase-proof");
    assert.equal(requests[1].data.action, "redeem");
    assert.equal(requests[1].data.ticket, "t".repeat(43));
    assert.match(requests[1].data.verifier, /^[a-f0-9]{64}$/);
    assert.equal(values.size, 0);
    assert.equal(root.replaced, "/app/");
});

test("a callback from another browser or with a mismatched state cannot log in", async () => {
    const { root, api, requests } = browser();
    await api.signIn();
    root.location.hash = "#tiktok_login=success&state=" + "x".repeat(43);
    await assert.rejects(api.completeSignIn(), /sessione|browser/i);
    assert.equal(requests.length, 1);
});

test("denied authorization is handled without redeeming a login", async () => {
    const { root, api, requests, values } = browser();
    await api.signIn();
    root.location.hash = "#tiktok_login=denied&state=" + "s".repeat(43);
    await assert.rejects(api.completeSignIn(), /annullat/i);
    assert.equal(requests.length, 1);
    assert.equal(values.size, 0);
});

test("disabled TikTok and blocked session storage never initiate OAuth", async () => {
    const disabled = browser({ BratTikTokConfig: { enabled: false } });
    await assert.rejects(disabled.api.signIn(), /configurat/i);
    assert.equal(disabled.requests.length, 0);
    const blocked = browser({ sessionStorage: { setItem() { throw Error("blocked"); } } });
    await assert.rejects(blocked.api.signIn(), /memoria|browser/i);
    assert.equal(blocked.requests.length, 0);
});

test("untrusted authorization destinations are rejected", async () => {
    const { root, api } = browser({ fetch: async () => ({ ok: true, json: async () => ({ url: "https://attacker.example/" }) }) });
    await assert.rejects(api.signIn(), /autorizzazione/i);
    assert.equal(root.location.assigned, undefined);
});

test("the initiator cannot redeem a forwarded authorization URL without the callback ticket", async () => {
    const { root, api, requests } = browser();
    await api.signIn();
    root.location.hash = "#tiktok_login=success&state=" + "s".repeat(43);
    await assert.rejects(api.completeSignIn(), /ritorno.*non valido/i);
    assert.equal(requests.length, 1);
});

test("expired browser proof cannot redeem a valid callback ticket", async () => {
    const { root, api, values, requests } = browser();
    await api.signIn();
    const key = [...values.keys()][0];
    const pending = JSON.parse(values.get(key));
    pending.createdAt = Date.now() - 600000;
    values.set(key, JSON.stringify(pending));
    root.location.hash = "#tiktok_login=success&state=" + "s".repeat(43) + "&ticket=" + "t".repeat(43);
    await assert.rejects(api.completeSignIn(), /scadut/i);
    assert.equal(requests.length, 1);
});
