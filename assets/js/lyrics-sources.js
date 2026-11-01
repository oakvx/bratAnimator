(function (root, factory) {
    const api = factory(root, typeof module !== "undefined" && module.exports ? require("./lyrics.js") : root.BratLyrics);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratLyricsSources = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (root, lyrics) {
    const CLIENT = "Brat Animator/5.0 (https://github.com/oakvx/bratAnimator; oakvx7@gmail.com)";
    const providers = { lrclib: { label: "LRCLIB", url: "https://lrclib.net" }, "lrc.red": { label: "lrc.red", url: "https://lrc.red" } };
    const normalizeProvider = value => value === "lrc.red" ? "lrc.red" : "lrclib";

    function createClient(fetcher = (...args) => root.fetch(...args), parser = lyrics.parse) {
        const nextAllowed = new Map();
        let queue = Promise.resolve();
        const abortError = () => Object.assign(new Error("Lyrics request cancelled."), { name: "AbortError" });
        const delay = (ms, signal) => new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(abortError());
            const onAbort = () => { clearTimeout(timer); reject(abortError()); };
            const timer = setTimeout(() => { signal?.removeEventListener("abort", onAbort); resolve(); }, ms);
            signal?.addEventListener("abort", onAbort, { once: true });
        });
        function request(url, provider, signal, type = "json") {
            const run = async () => {
                if (signal?.aborted) throw abortError();
                const wait = Math.max(0, (nextAllowed.get(provider) || 0) - Date.now());
                if (wait > 30000) throw new Error(`${providers[provider].label}: rate limited; retry later.`);
                if (wait) await delay(wait, signal);
                const response = await fetcher(url, { signal, headers: { [provider === "lrc.red" ? "X-Client-ID" : "Lrclib-Client"]: CLIENT, Accept: type === "json" ? "application/json" : "text/plain, application/ttml+xml, application/yaml" } });
                nextAllowed.set(provider, Date.now() + 250);
                if (!response.ok) {
                    const retry = response.headers?.get("Retry-After");
                    if (response.status === 429 || response.status === 503) {
                        const seconds = retry && /^\d+(?:\.\d+)?$/.test(retry) ? Number(retry) : retry ? (Date.parse(retry) - Date.now()) / 1000 : 30;
                        const until = Date.now() + Math.max(1, Number.isFinite(seconds) ? seconds : 30) * 1000;
                        nextAllowed.set(provider, until);
                        const error = new Error(`${providers[provider].label}: rate limited; retry in ${Math.ceil((until - Date.now()) / 1000)}s.`);
                        error.noFallback = true;
                        throw error;
                    }
                    throw new Error(`${providers[provider].label} HTTP error ${response.status}`);
                }
                return response[type]();
            };
            const pending = queue.then(run, run);
            queue = pending.catch(() => {});
            return pending;
        }

        async function search(query, source = "lrclib", { signal } = {}) {
            const provider = normalizeProvider(source);
            const encoded = encodeURIComponent(query.trim());
            if (!encoded) return [];
            if (provider === "lrclib") {
                const items = await request(`https://lrclib.net/api/search?q=${encoded}`, provider, signal);
                if (!Array.isArray(items)) throw new Error("Invalid LRCLIB search response.");
                return items.map(item => ({ ...item, source: provider, sourceUrl: `https://lrclib.net/api/get/${encodeURIComponent(item.id)}` }));
            }
            const data = await request(`https://lrc.red/search.json?q=${encoded}`, provider, signal);
            if (!Array.isArray(data.hits)) throw new Error("Invalid lrc.red search response.");
            return data.hits.filter(item => /^[a-z0-9]{12}$/i.test(item.isrc || "")).map(item => ({
                ...item, id: item.isrc, trackName: item.title, artistName: item.artist, albumName: item.album,
                artworkUrl: item.cover || "", source: provider, sourceUrl: `https://lrc.red/s/${item.isrc}`
            }));
        }

        async function load(item, { signal } = {}) {
            const provider = normalizeProvider(item.source);
            if (provider === "lrclib") {
                if (item.lyricsfile) {
                    try { return { ...parser(item.lyricsfile, "lyrics.lyricsfile.yaml"), item }; }
                    catch (error) { if (signal?.aborted) throw abortError(); }
                }
                const text = item.syncedLyrics || item.plainLyrics;
                if (!text) throw new Error("No usable lyrics for this track.");
                return { ...parser(text, item.syncedLyrics ? "lyrics.lrc" : "lyrics.txt"), item };
            }
            if (!/^[a-z0-9]{12}$/i.test(item.isrc || item.id || "")) throw new Error("Invalid lrc.red track ID.");
            const base = `https://lrc.red/s/${item.isrc || item.id}`;
            const details = await request(`${base}.json`, provider, signal);
            const fullItem = { ...item, trackName: details.title || item.trackName, artistName: details.artist || item.artistName, albumName: details.album || item.albumName, duration: details.duration || item.duration, artworkUrl: details.cover || item.artworkUrl };
            let lastError;
            for (const [name, suffix] of [["lyricsfile", ".lyricsfile.yaml"], ["ttml", ".ttml"], ["lrc", ".lrc"]]) {
                if (signal?.aborted) throw abortError();
                // Use canonical provider URLs; remote API data cannot redirect
                // client-identifying headers to another host.
                try {
                    const text = await request(`${base}${suffix}`, provider, signal, "text");
                    return { ...parser(text, `lyrics${suffix}`), item: fullItem };
                } catch (error) {
                    if (signal?.aborted || error.name === "AbortError" || error.noFallback) throw error;
                    lastError = error;
                }
            }
            throw lastError || new Error("No usable lrc.red lyrics.");
        }
        return { search, load };
    }
    return { createClient, providers, normalizeProvider, CLIENT };
});
