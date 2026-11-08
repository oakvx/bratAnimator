const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const auth = require("../assets/js/auth-client.js");
const vm = require("node:vm");

function configuredAuth(completeSignIn = async () => null, key = "sb_publishable_test_public_key") {
    const calls = [];
    const user = { id: "tiktok-user", user_metadata: { display_name: "Creator" } };
    let changed;
    const client = { auth: {
        onAuthStateChange(fn) { changed = fn; },
        getSession: async () => ({ data: { session: null } }),
        verifyOtp: async options => { calls.push(options); changed("SIGNED_IN", { user }); return { data: { session: { user } } }; },
        signOut: async options => { calls.push(options); changed("SIGNED_OUT", null); return { data: {} }; }
    } };
    const root = {
        module: { exports: {} }, URL, atob,
        BratSupabaseConfig: { url: "https://project.supabase.co", publishableKey: key },
        BratTikTokLogin: { completeSignIn },
        supabase: { createClient: (url, key, options) => { calls.push(options); return client; } }
    };
    root.globalThis = root;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../assets/js/auth-client.js"), "utf8"), root);
    return { api: root.module.exports, calls, client };
}

test("auth integration stays disabled until public Supabase config is provided", async () => {
    assert.equal(auth.configured(), false);
    const result = await auth.initialize();
    assert.deepEqual(result, { configured: false, user: null });
    assert.equal(auth.ownerId(), "guest");
    await assert.rejects(auth.signInWithPassword("x@y.com", "test-password"), /non ancora configurato/);
});

test("dashboard renders concrete navigation and all three auth options", () => {
    const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
    for (const identifier of ["studioDashboard","studioProjectsView","studioSettingsView","studioAuthDialog","studioLogoutDialog","studioAuthEmail","studioAuthPassword","studioAuthCode","studioAuthGoogle","studioTransferGuest","studioNewProject","studioBackToHome"]) {
        if (identifier === "studioBackToHome") {
            const script = fs.readFileSync(path.join(__dirname, "../assets/js/studio-dashboard.js"), "utf8");
            assert.match(script, /studioBackToHome/);
        } else {
            assert.ok(html.includes('id="' + identifier + '"'), identifier + " missing from HTML");
        }
    }
    assert.match(html, /assets\/js\/auth-client\.js/);
    assert.match(html, /assets\/js\/studio-dashboard\.js/);
    assert.match(html, /assets\/css\/studio-win7\.css/);
    assert.match(html, /vendor\/7css\/7\.scoped\.css/);
});

test("auth bootstrap is never configured with service-role credentials", () => {
    const config = fs.readFileSync(path.join(__dirname, "../assets/js/supabase-config.js"), "utf8");
    const sandbox = { window: {} };
    vm.runInNewContext(config, sandbox);
    const settings = sandbox.window.BratSupabaseConfig;
    assert.equal(new URL(settings.url).protocol, "https:");
    assert.match(settings.publishableKey, /^sb_publishable_[A-Za-z0-9_-]+$/);
    const authCode = fs.readFileSync(path.join(__dirname, "../assets/js/auth-client.js"), "utf8");
    assert.ok(authCode.includes("signInWithPassword"));
    assert.ok(authCode.includes("signUp"));
    assert.ok(authCode.includes("signInWithOtp"));
    assert.ok(authCode.includes("verifyOtp"));
    assert.ok(authCode.includes("signInWithOAuth"));
});

test("TikTok callback creates a persistent Supabase session and logout restores guest ownership", async () => {
    const { api, calls } = configuredAuth(async () => "one-use-proof");
    const result = await api.initialize();
    assert.equal(result.user.id, "tiktok-user");
    assert.equal(api.ownerId(), "user:tiktok-user");
    assert.equal(calls[0].auth.flowType, "pkce");
    assert.equal(calls[0].auth.persistSession, true);
    assert.equal(calls[1].token_hash, "one-use-proof");
    assert.equal(calls[1].type, "email");
    await api.signOut();
    assert.equal(api.ownerId(), "guest");
});

test("failed TikTok verification cannot produce an authenticated workspace", async () => {
    const { api, client } = configuredAuth(async () => "expired-proof");
    client.auth.verifyOtp = async () => ({ error: Error("Token expired") });
    await assert.rejects(api.initialize(), /expired/);
    assert.equal(api.ownerId(), "guest");
});

test("browser configuration rejects secret and service-role keys", () => {
    assert.equal(configuredAuth(undefined, "sb_secret_never_put_this_in_a_browser").api.configured(), false);
    const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
    assert.equal(configuredAuth(undefined, "eyJhbGciOiJIUzI1NiJ9." + payload + ".signature").api.configured(), false);
});
