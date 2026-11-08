const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function harness() {
    const callbacks = {};
    const calls = [];
    const sdk = {
        auth: {
            onAuthStateChange(fn) { callbacks.session = fn; return { data: { subscription: { unsubscribe() {} } } }; },
            getSession: async () => ({ data: { session: null }, error: null }),
            resetPasswordForEmail: async (email, options) => { calls.push({ kind: "reset", email, options }); return { data: {}, error: null }; },
            updateUser: async options => { calls.push({ kind: "update", options }); return { data: {}, error: null }; },
            signInWithPassword: async () => ({ data: {}, error: null })
        }
    };
    const events = [];
    const sandbox = {
        URL,
        CustomEvent: class { constructor(type) { this.type = type; } },
        console: { warn() {} },
        location: { origin: "https://oakvx.github.io", pathname: "/bratAnimator/" },
        document: {},
        BratSupabaseConfig: { url: "https://example.supabase.co", publishableKey: "sb_publishable_mock_000000" },
        supabase: { createClient: () => sdk },
        dispatchEvent: event => { events.push(event.type); }
    };
    sandbox.globalThis = sandbox;
    const code = fs.readFileSync(path.join(__dirname, "../assets/js/auth-client.js"), "utf8");
    vm.runInNewContext(code, sandbox, { filename: "auth-client.js" });
    return { api: sandbox.BratAuth, callbacks, calls, events };
}

test("password reset sends the provider a safe app URL without storing credentials", async () => {
    const h = harness();
    assert.equal(h.api.configured(), true);
    await h.api.requestPasswordReset("tester@example.com");
    assert.equal(h.calls[0].kind, "reset");
    assert.equal(h.calls[0].email, "tester@example.com");
    assert.equal(h.calls[0].options.redirectTo, "https://oakvx.github.io/bratAnimator/");
    assert.equal(h.calls[0].options.redirectTo.includes("#"), false);
});

test("password update uses authenticated Supabase updateUser", async () => {
    const h = harness();
    await h.api.updatePassword("new-strong-secret");
    assert.equal(h.calls[0].kind, "update");
    assert.equal(h.calls[0].options.password, "new-strong-secret");
});

test("PASSWORD_RECOVERY event opens a dedicated recovery UI hook", async () => {
    const h = harness();
    await h.api.initialize();
    h.callbacks.session("PASSWORD_RECOVERY", { user: { id: "account-one", email: "tester@example.com" } });
    assert.equal(h.api.ownerId(), "user:account-one");
    assert.ok(h.events.includes("brat:auth-recovery"));
});

test("studio recovery is distinct from the existing guest and three sign-in flows", () => {
    const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
    const js = fs.readFileSync(path.join(__dirname, "../assets/js/studio-dashboard.js"), "utf8");
    assert.match(html, /data-auth-mode="reset"/);
    assert.match(html, /id="studioAuthPasswordLabel"/);
    assert.match(js, /requestPasswordReset\(email\)/);
    assert.match(js, /auth\.updatePassword\(password\)/);
    assert.match(js, /brat:auth-recovery/);
    assert.match(js, /user && !recoveryPending/);
});
