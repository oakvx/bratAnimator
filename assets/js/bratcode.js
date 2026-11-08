/* BRATCODE Light — JSON structure only, never uploaded media or secrets.
 * Works with the optional Supabase PostgreSQL RPC backend.
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root && root.document) root.BratCode = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    "use strict";
    const MAX_BYTES = 180000;
    const SAFE_FIELDS = [
        "version", "lyricRows", "seed", "fonts", "beatEffects", "exportRange",
        "lyrics", "plainLyrics", "lyricsProvider", "useAudioTiming",
        "timing", "startFromZero", "exportSize", "exportFps",
        "includeAudioInExport", "audio", "metadata", "background",
        "formatPreset", "theme", "animationMode", "style", "language"
    ];

    function byteCount(value) {
        const json = JSON.stringify(value);
        if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(json).length;
        return Buffer.byteLength(json, "utf8");
    }

    // BRATCODE intentionally transports project configuration, not transferable
    // media bytes, browser-local asset identifiers, URLs, or credential fields.
    // Clean nested structures as well: top-level field filtering is insufficient
    // because lyric rows/style settings can contain extra user-controlled keys.
    const PRIVATE_KEY = /^(?:url|uri|src|href|assetid|blob|bytes|binary|dataurl|base64|file|filedata|filecontent|filename|filepath|path|media|mediaassets|mediablobs|assets|token|accesstoken|refreshtoken|apikey|key|clientsecret|password|credentials|auth|authorization|headers|cookie|session|secret)$/i;
    const MEDIA_URL = /^(?:blob:|data:|https?:\/\/|file:)/i;
    function cleanNested(value, depth = 0) {
        if (depth > 24) throw new Error("BRATCODE: struttura progetto troppo profonda.");
        if (value === null || typeof value === "number" || typeof value === "boolean") return value;
        if (typeof value === "string") return MEDIA_URL.test(value.trim()) ? "" : value;
        if (Array.isArray(value)) return value.map(item => cleanNested(item, depth + 1))
            .filter(item => item !== undefined);
        if (!value || typeof value !== "object") return undefined;
        const safe = {};
        for (const [name, child] of Object.entries(value)) {
            if (PRIVATE_KEY.test(name) || name === "__proto__" || name === "constructor" || name === "prototype") continue;
            const sanitized = cleanNested(child, depth + 1);
            if (sanitized !== undefined) safe[name] = sanitized;
        }
        return safe;
    }

    function sanitizePayload(payload) {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            throw new Error("Il progetto da condividere non è valido.");
        }
        const cleaned = Object.create(null);
        for (const field of SAFE_FIELDS) {
            if (Object.hasOwn(payload, field)) cleaned[field] = cleanNested(payload[field]);
        }
        // Media-related project references cannot be reused across devices.
        const originalAudio = cleaned.audio && typeof cleaned.audio === "object" ? cleaned.audio : {};
        cleaned.audio = {
            source: "local", assetId: "", url: "", name: "",
            mediaKind: "audio", includeInExport: originalAudio.includeInExport !== false,
            volume: Number.isFinite(Number(originalAudio.volume)) ? Math.min(2, Math.max(0, Number(originalAudio.volume))) : 1,
            fadeIn: Number(originalAudio.fadeIn) || 0,
            fadeOut: Number(originalAudio.fadeOut) || 0
        };
        cleaned.background = { kind: "none" };
        const originalMetadata = cleaned.metadata && typeof cleaned.metadata === "object" ? cleaned.metadata : {};
        cleaned.metadata = {
            trackName: String(originalMetadata.trackName || "").slice(0, 180),
            artistName: String(originalMetadata.artistName || "").slice(0, 180),
            albumName: String(originalMetadata.albumName || "").slice(0, 180),
            duration: Number(originalMetadata.duration) || 0,
            source: String(originalMetadata.source || "").slice(0, 80)
        };
        cleaned.fonts = Array.isArray(cleaned.fonts) ?
            cleaned.fonts.slice(0, 30).map(font => ({
                family: String(font?.family || "").slice(0, 100),
                name: String(font?.name || "").slice(0, 100),
                weight: String(font?.weight || "normal").slice(0, 30),
                style: String(font?.style || "normal").slice(0, 30)
            })) : [];
        // Round-trip strips special prototypes, undefined values and non-JSON
        // types and creates a self-contained structure.
        let serialized;
        try { serialized = JSON.stringify(cleaned); }
        catch (_) { throw new Error("Il progetto contiene dati non serializzabili."); }
        if (!serialized) throw new Error("Progetto non serializzabile.");
        const safe = JSON.parse(serialized);
        if (byteCount(safe) > MAX_BYTES - 700) {
            throw new Error("Il progetto è troppo grande per BRATCODE Light. Esporta .brat.zip.");
        }
        return safe;
    }

    function makeSnapshot(payload) {
        const result = {
            type: "bratcode-light", schemaVersion: "1",
            payload: sanitizePayload(payload)
        };
        if (byteCount(result) > MAX_BYTES) throw new Error("BRATCODE Light supera il limite consentito.");
        return result;
    }

    function parseSnapshot(snapshot) {
        if (!snapshot || snapshot.type !== "bratcode-light" ||
            snapshot.schemaVersion !== "1" || !snapshot.payload ||
            byteCount(snapshot) > MAX_BYTES) {
            throw new Error("Codice non valido o versione del progetto non supportata.");
        }
        return sanitizePayload(snapshot.payload);
    }

    function normalizeCode(input) {
        const code = String(input || "").replace(/[\s-]/g, "").toUpperCase();
        if (!/^[0-9A-F]{32}$/.test(code)) throw new Error("BRATCODE non valido: sono richiesti 32 caratteri esadecimali.");
        return code;
    }

    function prettyCode(input) {
        return normalizeCode(input).match(/.{1,8}/g).join("-");
    }

    function shareLink(input, location = root.location) {
        const code = normalizeCode(input);
        if (!location?.origin || !location?.pathname || !/^https?:$/.test(new URL(location.origin).protocol)) {
            throw new Error("Condivisione tramite link disponibile solo su HTTP(S).");
        }
        const url = new URL(location.pathname, location.origin);
        // Share links contain only a temporary opaque identifier, never media.
        url.hash = "bratcode=" + code;
        return url.toString();
    }

    function codeFromInput(input, location = root.location) {
        const value = String(input || "").trim();
        if (!/^https?:\/\//i.test(value)) return normalizeCode(value);
        let url;
        try { url = new URL(value); } catch (_) { throw new Error("Link BRATCODE non valido."); }
        if (!location?.origin || url.origin !== location.origin || url.pathname !== location.pathname ||
            !url.hash.startsWith("#bratcode=")) throw new Error("Link BRATCODE non valido per questa applicazione.");
        return normalizeCode(decodeURIComponent(url.hash.slice("#bratcode=".length)));
    }

    function backend() {
        if (!root.BratAuth?.configured()) throw new Error("BRATCODE richiede Supabase configurato dal proprietario del progetto.");
        return root.BratAuth;
    }

    async function getActive() {
        const auth = backend();
        if (!auth.user()) return null;
        const items = await auth.rpc("bratcode_active");
        return Array.isArray(items) ? items[0] || null : items || null;
    }

    async function create(payload) {
        const auth = backend();
        if (!auth.user()) throw new Error("Accedi per generare un BRATCODE.");
        const rows = await auth.rpc("bratcode_create", { p_snapshot: makeSnapshot(payload) });
        const active = Array.isArray(rows) ? rows[0] : rows;
        if (!active?.code) throw new Error("Impossibile generare il codice.");
        return active;
    }

    async function revoke() {
        const auth = backend();
        if (!auth.user()) throw new Error("Accedi per revocare il codice.");
        return Boolean(await auth.rpc("bratcode_revoke"));
    }

    async function importCode(code) {
        const auth = backend();
        const snapshot = await auth.rpc("bratcode_import", { p_code: codeFromInput(code) });
        if (!snapshot) throw new Error("BRATCODE inesistente, scaduto o revocato.");
        return parseSnapshot(snapshot);
    }

    return Object.freeze({
        MAX_BYTES, sanitizePayload, makeSnapshot, parseSnapshot,
        normalizeCode, prettyCode, shareLink, codeFromInput, getActive, create, revoke,
        importCode
    });
});
