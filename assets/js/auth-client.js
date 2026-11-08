/* Brat Animator Phase 2 — browser-only Supabase Auth adapter.
   Public project URL and publishable/anon key are required. Never embed service_role keys.
   Supabase is loaded only when the administrator has configured it. */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root && root.document) root.BratAuth = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    "use strict";
    const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    let client = null;
    let currentUser = null;
    let initPromise = null;
    const subscribers = new Set();

    function config() {
        const raw = root.BratSupabaseConfig || {};
        const url = String(raw.url || "").trim();
        const publishableKey = String(raw.publishableKey || raw.anonKey || "").trim();
        return { url, publishableKey };
    }

    function configured() {
        const { url, publishableKey } = config();
        try {
            const parsed = new URL(url);
            return parsed.protocol === "https:" && Boolean(parsed.hostname) && publishableKey.length > 15;
        } catch (_) { return false; }
    }

    function listen(listener) {
        if (typeof listener !== "function") throw new TypeError("Listener must be a function");
        subscribers.add(listener);
        return () => subscribers.delete(listener);
    }

    function notify(user) {
        currentUser = user || null;
        for (const listener of subscribers) {
            try { listener(currentUser); }
            catch (error) { root.console?.warn?.("auth subscriber failed", error); }
        }
    }

    function loadSdk() {
        if (root.supabase && typeof root.supabase.createClient === "function") return Promise.resolve(root.supabase);
        if (!root.document) return Promise.reject(new Error("Authentication requires a browser."));
        return new Promise((resolve, reject) => {
            const existing = root.document.querySelector('script[data-brat-supabase-sdk]');
            if (existing) {
                existing.addEventListener("load", () => resolve(root.supabase), { once: true });
                existing.addEventListener("error", () => reject(new Error("Cannot load Supabase SDK.")), { once: true });
                return;
            }
            const element = root.document.createElement("script");
            element.src = SDK_URL;
            element.async = true;
            element.dataset.bratSupabaseSdk = "1";
            element.onload = () => {
                if (root.supabase?.createClient) resolve(root.supabase);
                else reject(new Error("Supabase SDK loaded without a client factory."));
            };
            element.onerror = () => reject(new Error("Cannot load Supabase SDK. Check your connection."));
            root.document.head.append(element);
        });
    }

    async function initialize() {
        if (!configured()) return { configured: false, user: null };
        if (initPromise) return initPromise;
        initPromise = (async () => {
            const sdk = await loadSdk();
            const { url, publishableKey } = config();
            client = sdk.createClient(url, publishableKey, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
            });
            client.auth.onAuthStateChange((event, session) => {
                // Do not await Supabase API calls from inside this callback.
                notify(session?.user || null);
                if (event === "PASSWORD_RECOVERY") {
                    root.dispatchEvent?.(new CustomEvent("brat:auth-recovery"));
                }
            });
            const { data, error } = await client.auth.getSession();
            if (error) throw error;
            notify(data?.session?.user || null);
            return { configured: true, user: currentUser };
        })().catch(error => {
            initPromise = null;
            throw error;
        });
        return initPromise;
    }

    async function requireClient() {
        if (!configured()) throw new Error("Login non ancora configurato. L'editor resta disponibile come ospite.");
        await initialize();
        if (!client) throw new Error("Authentication service unavailable.");
        return client;
    }

    async function result(promise) {
        const response = await promise;
        if (response.error) throw response.error;
        return response.data;
    }

    function redirectUrl() {
        return root.location ? root.location.origin + root.location.pathname : undefined;
    }

    return Object.freeze({
        configured,
        initialize,
        listen,
        user: () => currentUser,
        ownerId: () => currentUser?.id ? "user:" + currentUser.id : "guest",
        // Only the current Supabase JWT is used to authenticate calls to our
        // own Edge Function. Never expose TikTok OAuth tokens in the browser.
        getAccessToken: async () => {
            const sdk = await requireClient();
            const { data, error } = await sdk.auth.getSession();
            if (error) throw error;
            if (!data?.session?.access_token) throw new Error("Accedi a Brat Animator.");
            return data.session.access_token;
        },
        signInWithPassword: async (email, password) =>
            result((await requireClient()).auth.signInWithPassword({ email, password })),
        signUp: async (email, password) =>
            result((await requireClient()).auth.signUp({
                email, password, options: { emailRedirectTo: redirectUrl() }
            })),
        sendCode: async email =>
            result((await requireClient()).auth.signInWithOtp({
                email, options: { shouldCreateUser: true, emailRedirectTo: redirectUrl() }
            })),
        verifyCode: async (email, token) =>
            result((await requireClient()).auth.verifyOtp({ email, token, type: "email" })),
        requestPasswordReset: async email =>
            result((await requireClient()).auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl()
            })),
        updatePassword: async password =>
            result((await requireClient()).auth.updateUser({ password })),
        signInWithGoogle: async () =>
            result((await requireClient()).auth.signInWithOAuth({
                provider: "google", options: { redirectTo: redirectUrl() }
            })),
        signOut: async () => result((await requireClient()).auth.signOut({ scope: "local" })),
        rpc: async (name, params) => {
            const allowed = ["bratcode_create", "bratcode_active", "bratcode_revoke", "bratcode_import"];
            if (!allowed.includes(name)) throw new Error("Unsupported application endpoint.");
            return result((await requireClient()).rpc(name, params || {}));
        }
    });
});
