const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");
const { webcrypto } = require("node:crypto");

function server(overrides = {}) {
    const calls = [];
    const env = {
        SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "server-key",
        TIKTOK_CLIENT_KEY: "tiktok-app", TIKTOK_CLIENT_SECRET: "server-only",
        TIKTOK_REDIRECT_URI: "https://project.supabase.co/functions/v1/tiktok-link",
        BRAT_APP_ORIGIN: "https://example.com", BRAT_APP_URL: "https://example.com/app/"
    };
    const db = {
        auth: {
            getUser: async () => ({ data: { user: { id: "user-1" } } }),
            admin: {
                getUserById: async () => ({ data: { user: { id: "user-1", email: "private@example.com" } } }),
                generateLink: async () => ({ data: { user: { id: "user-1" }, properties: { hashed_token: "supabase-login-proof" } } })
            }
        },
        rpc: async (name, args) => { calls.push({ name, args }); return { data: true }; },
        ...overrides.db
    };
    let handler;
    const context = {
        URL, URLSearchParams, Request, Response, TextEncoder, TextDecoder, Uint8Array, AbortSignal,
        crypto: webcrypto, btoa, createClient: () => db,
        Deno: { env: { get: name => env[name] }, serve: fn => { handler = fn; } },
        fetch: async () => { throw Error("unexpected external request"); },
        ...overrides.context
    };
    let source = fs.readFileSync("supabase/functions/tiktok-link/index.ts", "utf8");
    source = source.replace(/^import .*?;\r?\n/m, "");
    vm.runInNewContext(stripTypeScriptTypes(source), context);
    const post = (body, origin = env.BRAT_APP_ORIGIN, authorization = "") => handler(new Request(env.TIKTOK_REDIRECT_URI, {
        method: "POST", headers: { origin, "Content-Type": "application/json", authorization }, body: JSON.stringify(body)
    }));
    return { handler, post, calls, db, env };
}

test("guest TikTok login starts with a hashed browser challenge and rate limit", async () => {
    const { post, calls } = server();
    const response = await post({ action: "login", challenge: "a".repeat(64) });
    assert.equal(response.status, 200);
    const url = new URL((await response.json()).url);
    assert.equal(url.origin, "https://www.tiktok.com");
    assert.equal(url.searchParams.get("scope"), "user.info.basic");
    assert.match(url.searchParams.get("state"), /^[\w-]{43}$/);
    assert.equal(calls[0].name, "tiktok_start_login");
    assert.equal(calls[0].args.p_challenge, "a".repeat(64));
    assert.match(calls[0].args.p_state_hash, /^[a-f0-9]{64}$/);
});

test("login rejects invalid input, wrong origins and oversized bodies", async () => {
    const { post, calls } = server();
    assert.equal((await post({ action: "login", challenge: "short" })).status, 400);
    assert.equal((await post({ action: "login", challenge: "a".repeat(64) }, "https://attacker.example")).status, 403);
    assert.equal((await post({ action: "login", challenge: "a".repeat(2000) })).status, 400);
    assert.equal(calls.length, 0);
});

test("rate-limited login returns 429 before contacting TikTok", async () => {
    const { post } = server({ db: { rpc: async () => ({ data: false }) } });
    assert.equal((await post({ action: "login", challenge: "a".repeat(64) })).status, 429);
});

test("redeem returns a Supabase proof only after atomically claiming state and verifier", async () => {
    const { post, calls, db } = server();
    db.rpc = async (name, args) => { calls.push({ name, args }); return { data: "user-1" }; };
    const response = await post({ action: "redeem", state: "s".repeat(43), verifier: "b".repeat(64), ticket: "t".repeat(43) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { token_hash: "supabase-login-proof" });
    assert.equal(calls[0].name, "tiktok_redeem_login");
    assert.notEqual(calls[0].args.p_challenge, "b".repeat(64));
    assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("expired, replayed and wrong-browser login proofs cannot mint a session", async () => {
    const { post } = server({ db: { rpc: async () => ({ data: null }) } });
    const response = await post({ action: "redeem", state: "s".repeat(43), verifier: "b".repeat(64), ticket: "t".repeat(43) });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).token_hash, undefined);
});

test("Supabase account mismatch fails closed without disclosing generated tokens", async () => {
    const { post, db } = server();
    db.rpc = async () => ({ data: "user-1" });
    db.auth.admin.generateLink = async () => ({ data: { user: { id: "other-user" }, properties: { hashed_token: "do-not-expose" } } });
    const response = await post({ action: "redeem", state: "s".repeat(43), verifier: "b".repeat(64), ticket: "t".repeat(43) });
    assert.equal(response.status, 500);
    assert.doesNotMatch(await response.text(), /do-not-expose|private@example/);
});

function callbackServer({ existing = false, denied = false, mismatch = false, linking = false } = {}) {
    const state = { claimed: false, identity: existing ? { user_id: "user-1" } : null, connection: null, staged: null, ready: false, created: null };
    const db = {
        from(table) {
            const query = {
                select() { return this; }, eq() { return this; }, gt() { return this; },
                async maybeSingle() { return { data: table === "tiktok_identities" ? state.identity : null }; },
                async insert(row) { state.identity = row; return {}; },
                async upsert(row) { state.connection = row; return {}; },
                update(row) { this.row = row; return this; },
                async single() { state.ready = this.row.user_id === "user-1"; state.staged = this.row.connection; return { data: { state_hash: "stored-hash" } }; }
            };
            return query;
        },
        rpc: async name => {
            if (name === "tiktok_claim_login_state") {
                if (linking) return { data: false };
                const first = !state.claimed;
                state.claimed = true;
                return { data: first };
            }
            if (name === "tiktok_claim_link_state" && linking && !state.claimed) {
                state.claimed = true;
                return { data: "user-1" };
            }
            return { data: null };
        }
    };
    const harness = server({ db, context: { fetch: async url => {
        if (url.includes("/oauth/token/")) return new Response(JSON.stringify({
            access_token: "private-tiktok-access", refresh_token: "private-tiktok-refresh", open_id: "official-open-id", scope: "user.info.basic"
        }));
        return new Response(JSON.stringify({ error: { code: "ok" }, data: { user: {
            open_id: mismatch ? "different-profile" : "official-open-id", display_name: "Creator", avatar_url: "https://example.com/avatar.png"
        } } }));
    } } });
    harness.db.auth.admin.createUser = async params => {
        state.created = params;
        return { data: { user: { id: "user-1" } } };
    };
    const url = harness.env.TIKTOK_REDIRECT_URI + "?state=" + "s".repeat(43) + (denied ? "&error=access_denied" : "&code=official-code");
    return { ...harness, state, callback: () => harness.handler(new Request(url)) };
}

test("official TikTok callback creates a Supabase identity and returns no provider credentials", async () => {
    const { callback, state } = callbackServer();
    const response = await callback();
    assert.equal(response.status, 302);
    const target = new URL(response.headers.get("Location"));
    assert.equal(target.origin, "https://example.com");
    assert.equal(new URLSearchParams(target.hash.slice(1)).get("tiktok_login"), "success");
    assert.equal(state.identity.user_id, "user-1");
    assert.equal(state.created.app_metadata.tiktok_open_id, "official-open-id");
    assert.match(state.created.email, /^tiktok-[a-f0-9]{64}@identity\.brat\.invalid$/);
    assert.equal(state.ready, true);
    assert.equal(state.connection.access_token, "private-tiktok-access");
    assert.doesNotMatch(response.headers.get("Location"), /private-tiktok|official-code|token/);
    assert.equal((await callback()).status, 403, "callback replay must fail");
});

test("repeat TikTok login reuses the existing user rather than creating another library", async () => {
    const { callback, state } = callbackServer({ existing: true });
    assert.equal((await callback()).status, 302);
    assert.equal(state.created, null);
    assert.equal(state.ready, true);
    assert.equal(state.connection.user_id, "user-1");
});

test("denied consent and mismatched provider identity never mark a login ready", async () => {
    for (const options of [{ denied: true }, { mismatch: true }]) {
        const { callback, state } = callbackServer(options);
        const response = await callback();
        assert.equal(response.status, 302);
        assert.match(response.headers.get("Location"), /tiktok_login=(denied|failed)/);
        assert.equal(state.ready, false);
        assert.equal(state.created, null);
    }
});

test("link callbacks stage credentials until the original signed-in browser confirms", async () => {
    const { callback, state } = callbackServer({ linking: true });
    const response = await callback();
    assert.equal(response.status, 302);
    assert.match(response.headers.get("Location"), /tiktok=pending&state=.*&ticket=/);
    assert.equal(state.connection, null);
    assert.equal(state.created, null);
    assert.equal(state.staged.open_id, "official-open-id");
    assert.equal((await callback()).status, 403);
});

test("completing a link requires both a Supabase session and the browser proofs", async () => {
    const { post, calls } = server();
    const body = { action: "complete", state: "s".repeat(43), verifier: "b".repeat(64), ticket: "t".repeat(43) };
    assert.equal((await post(body)).status, 401);
    const response = await post(body, "https://example.com", "Bearer test-session");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { connected: true });
    assert.equal(calls[0].name, "tiktok_complete_link");
    assert.equal(calls[0].args.p_user_id, "user-1");
});
