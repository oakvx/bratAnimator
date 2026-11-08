/* TikTok Login Kit -> Supabase session. Only the initiating browser can
   redeem a completed login. Provider credentials never reach this module. */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root && root.document) root.BratTikTokLogin = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    "use strict";
    const STORAGE_KEY = "brat.tiktok.login.v1";
    const MAX_AGE = 8 * 60 * 1000;

    function configured() {
        const settings = root.BratSupabaseConfig || {};
        try {
            if (root.BratAuth && !root.BratAuth.configured()) return false;
            return root.BratTikTokConfig?.enabled === true &&
                new URL(settings.url).protocol === "https:" &&
                String(settings.publishableKey || settings.anonKey || "").length > 15;
        } catch (_) { return false; }
    }
    async function request(body) {
        if (!configured()) throw new Error("Login TikTok non ancora configurato. Puoi continuare come ospite.");
        const settings = root.BratSupabaseConfig;
        const response = await root.fetch(String(settings.url).replace(/\/+$/, "") + "/functions/v1/tiktok-link", {
            method: "POST", credentials: "omit", cache: "no-store", redirect: "error",
            headers: { "Content-Type": "application/json", apikey: settings.publishableKey || settings.anonKey },
            body: JSON.stringify(body)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.error) throw new Error(typeof data.error === "string" ? data.error : "Login TikTok non disponibile.");
        return data;
    }
    async function signIn() {
        if (!configured()) throw new Error("Login TikTok non ancora configurato. Puoi continuare come ospite.");
        const verifier = [...root.crypto.getRandomValues(new Uint8Array(32))]
            .map(n => n.toString(16).padStart(2, "0")).join("");
        const pending = { verifier, createdAt: Date.now(), state: "" };
        try { root.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending)); }
        catch (_) { throw new Error("Consenti la memoria di sessione del browser per accedere con TikTok."); }
        try {
            const digest = await root.crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
            const challenge = [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, "0")).join("");
            const data = await request({ action: "login", challenge });
            const url = new URL(data.url);
            const state = url.searchParams.get("state") || "";
            if (url.origin !== "https://www.tiktok.com" || url.pathname !== "/v2/auth/authorize/" || !/^[A-Za-z0-9_-]{43}$/.test(state)) {
                throw new Error("Indirizzo di autorizzazione TikTok non valido.");
            }
            pending.state = state;
            root.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
            root.location.assign(url.toString());
        } catch (error) {
            root.sessionStorage.removeItem(STORAGE_KEY);
            throw error;
        }
    }
    async function completeSignIn() {
        if (!root.location?.hash.startsWith("#tiktok_login=")) return null;
        const query = new URLSearchParams(root.location.hash.slice(1));
        root.history.replaceState(null, "", root.location.pathname + root.location.search);
        let pending;
        try { pending = JSON.parse(root.sessionStorage.getItem(STORAGE_KEY) || "null"); }
        finally { root.sessionStorage.removeItem(STORAGE_KEY); }
        if (!pending || pending.state !== query.get("state") || !/^[a-f0-9]{64}$/.test(pending.verifier) ||
            Date.now() - pending.createdAt > MAX_AGE || Date.now() < pending.createdAt) {
            throw new Error("Sessione TikTok scaduta o avviata in un altro browser. Riprova l'accesso.");
        }
        if (query.get("tiktok_login") === "denied") throw new Error("Autorizzazione TikTok annullata.");
        if (query.get("tiktok_login") !== "success") throw new Error("Accesso TikTok non riuscito. Riprova.");
        const ticket = query.get("ticket") || "";
        if (!/^[A-Za-z0-9_-]{43}$/.test(ticket)) throw new Error("Ritorno TikTok non valido. Riprova l'accesso.");
        const data = await request({ action: "redeem", state: pending.state, verifier: pending.verifier, ticket });
        if (typeof data.token_hash !== "string" || !data.token_hash) throw new Error("Risposta di accesso non valida.");
        return data.token_hash;
    }
    return Object.freeze({ configured, signIn, completeSignIn });
});
