/* Phase 15 — deterministic, local-first visual compositor.
 * All media are referenced by stable assetId, loaded from the existing IndexedDB
 * media store. Neither preview nor export fetches an arbitrary clip URL.
 */
(function (root, factory) {
    const api = factory(root.BratTracks || (typeof require === "function" ? require("./multitrack.js") : null));
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratComposer = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (Tracks) {
    "use strict";

    const MAX_ASSET_BYTES = 512 * 1024 * 1024;
    const VISUAL_KINDS = new Set(["video", "image", "text"]);
    const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

    function visualClips(graph, time, position = "all") {
        if (!Tracks) return [];
        const normalized = Tracks.normalize(graph);
        const lyricsIndex = normalized.tracks.findIndex(track => track.kind === "lyrics");
        const items = Tracks.activeAt(normalized, time).filter(item => VISUAL_KINDS.has(item.clip.kind));
        if (position === "below") return items.filter(item => lyricsIndex < 0 || item.order < lyricsIndex);
        if (position === "above") return items.filter(item => lyricsIndex >= 0 && item.order >= lyricsIndex);
        return items;
    }

    function hasVisualClips(graph) {
        return Boolean(Tracks?.normalize(graph).tracks.some(track =>
            track.clips.some(clip => VISUAL_KINDS.has(clip.kind))));
    }

    function rectangle(transform, width, height) {
        const t = transform || {};
        const w = (t.width ?? 1) * width, h = (t.height ?? 1) * height;
        const x = (t.x ?? 0.5) * width, y = (t.y ?? 0.5) * height;
        return { x, y, width: w, height: h, rotation: (t.rotation || 0) * Math.PI / 180, fit: t.fit || "cover" };
    }

    function drawMedia(ctx, media, dimensions, clip, canvasWidth, canvasHeight) {
        if (!media || !dimensions?.width || !dimensions?.height) return;
        const bounds = rectangle(clip.transform, canvasWidth, canvasHeight);
        if (bounds.width <= 0 || bounds.height <= 0) return;
        const ratio = bounds.fit === "contain"
            ? Math.min(bounds.width / dimensions.width, bounds.height / dimensions.height)
            : Math.max(bounds.width / dimensions.width, bounds.height / dimensions.height);
        const scaledWidth = dimensions.width * ratio, scaledHeight = dimensions.height * ratio;
        ctx.save();
        ctx.translate(bounds.x, bounds.y);
        ctx.rotate(bounds.rotation);
        ctx.globalAlpha *= clamp(clip.opacity ?? 1, 0, 1);
        ctx.beginPath();
        ctx.rect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
        ctx.clip();
        ctx.drawImage(media, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();
    }

    function drawText(ctx, clip, width, height) {
        const text = String(clip.source?.text || clip.name || "").slice(0, 4000);
        if (!text) return;
        const bounds = rectangle(clip.transform, width, height);
        ctx.save();
        ctx.translate(bounds.x, bounds.y);
        ctx.rotate(bounds.rotation);
        ctx.globalAlpha *= clamp(clip.opacity ?? 1, 0, 1);
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "rgba(0,0,0,.8)";
        ctx.lineWidth = Math.max(1, width * .003);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "700 " + Math.max(12, Math.min(bounds.width / Math.max(1, text.length * .55), bounds.height * .36)) + "px Arial, sans-serif";
        const lines = text.split("\n").slice(0, 8);
        const size = parseFloat(ctx.font.match(/(\d+(?:\.\d+)?)px/)?.[1] || "24");
        lines.forEach((line, index) => {
            const y = (index - (lines.length - 1) / 2) * size * 1.2;
            ctx.strokeText(line, 0, y, bounds.width);
            ctx.fillText(line, 0, y, bounds.width);
        });
        ctx.restore();
    }

    function mediaTime(clip, element) {
        const duration = Number(element?.duration);
        // Do not request the exact end timestamp (some decoders never settle on it).
        return Number.isFinite(duration) && duration > 0
            ? clamp(clip.sourceTime, 0, Math.max(0, duration - 0.02))
            : Math.max(0, clip.sourceTime);
    }

    function createController({ loadAsset, onReady = () => {}, environment = globalThis, seekTimeoutMs = 8000 } = {}) {
        if (typeof loadAsset !== "function") throw new TypeError("A local asset loader is required.");
        const items = new Map();
        const urls = environment.URL || URL;
        let generation = 0;
        let discarded = false;

        function release(entry) {
            entry.cancelled = true;
            const media = entry.media;
            if (media?.pause) media.pause();
            if (media?.removeAttribute) {
                media.removeAttribute("src");
                media.load?.();
            }
            if (entry.url) {
                urls.revokeObjectURL(entry.url);
                entry.url = "";
            }
        }

        async function open(entry) {
            const record = await loadAsset(entry.assetId);
            if (!record?.blob?.size) throw new Error("Media asset missing: " + entry.assetId);
            if (record.blob.size > MAX_ASSET_BYTES) throw new Error("Media asset exceeds 512 MiB.");
            if (entry.cancelled || discarded) return null;
            const source = urls.createObjectURL(record.blob);
            entry.url = source;
            let media;
            if (entry.kind === "video") {
                media = environment.document.createElement("video");
                media.muted = true; // Clip audio belongs to phase 16, not HTMLMediaElement.
                media.playsInline = true;
                media.preload = "auto";
                media.src = source;
                entry.media = media;
                await new Promise((resolve, reject) => {
                    if (media.readyState >= 2) return resolve();
                    const timeout = setTimeout(() => done(new Error("Video decoding timed out.")), seekTimeoutMs);
                    const done = error => {
                        clearTimeout(timeout);
                        media.removeEventListener("loadeddata", good);
                        media.removeEventListener("error", bad);
                        error ? reject(error) : resolve();
                    };
                    const good = () => done();
                    const bad = () => done(new Error("Video could not be decoded: " + (record.name || entry.assetId)));
                    media.addEventListener("loadeddata", good, { once: true });
                    media.addEventListener("error", bad, { once: true });
                });
            } else {
                media = new environment.Image();
                entry.media = media;
                media.src = source;
                if (typeof media.decode === "function") await media.decode();
                else await new Promise((resolve, reject) => {
                    media.onload = resolve;
                    media.onerror = reject;
                });
            }
            if (entry.cancelled || discarded) {
                release(entry);
                return null;
            }
            entry.width = entry.kind === "video" ? media.videoWidth : media.naturalWidth;
            entry.height = entry.kind === "video" ? media.videoHeight : media.naturalHeight;
            if (!entry.width || !entry.height) throw new Error("Media has no decodable frames.");
            onReady(entry.assetId);
            return entry;
        }

        function sync(graph) {
            if (discarded) return Promise.reject(new Error("Compositor has been disposed."));
            const desired = new Map();
            const data = Tracks.normalize(graph);
            for (const track of data.tracks) {
                for (const clip of track.clips) {
                    if (!["video", "image"].includes(clip.kind) || !clip.source?.assetId) continue;
                    const key = clip.kind + ":" + clip.source.assetId;
                    desired.set(key, { assetId: clip.source.assetId, kind: clip.kind });
                }
            }
            for (const [key, entry] of items) {
                if (!desired.has(key)) {
                    items.delete(key);
                    release(entry);
                }
            }
            for (const [key, source] of desired) {
                if (items.has(key)) continue;
                const entry = { ...source, key, url: "", media: null, cancelled: false, error: null };
                entry.promise = open(entry).catch(error => {
                    entry.error = error;
                    if (entry.url) release(entry);
                    return null;
                });
                items.set(key, entry);
            }
            generation++;
            return Promise.all([...items.values()].map(entry => entry.promise));
        }

        function entryFor(clip) {
            return items.get(clip.kind + ":" + clip.source?.assetId);
        }

        async function seek(entry, time) {
            const media = entry?.media;
            if (!media || entry.kind !== "video") return;
            media.pause();
            const target = mediaTime({ sourceTime: time }, media);
            if (!media.seeking && Math.abs(media.currentTime - target) < 0.014) return;
            await new Promise((resolve, reject) => {
                const timer = setTimeout(() => done(new Error("Video frame seek timed out.")), seekTimeoutMs);
                function done(error) {
                    clearTimeout(timer);
                    media.removeEventListener("seeked", ready);
                    media.removeEventListener("error", failed);
                    error ? reject(error) : resolve();
                }
                const ready = () => done();
                const failed = () => done(new Error("Video decoder error during seek."));
                media.addEventListener("seeked", ready, { once: true });
                media.addEventListener("error", failed, { once: true });
                try { media.currentTime = target; } catch (error) { done(error); }
            });
        }

        async function prepare(graph, time) {
            await sync(graph);
            for (const item of visualClips(graph, time)) {
                if (!["image", "video"].includes(item.clip.kind)) continue;
                const entry = entryFor(item.clip);
                if (!entry || entry.error || !entry.media || entry.cancelled) {
                    throw entry?.error || new Error("Visual clip has no accessible media: " + (item.clip.name || item.clip.id));
                }
                if (item.clip.kind === "video") await seek(entry, item.sourceTime);
            }
            // Reject missing references explicitly instead of exporting empty frames.
            for (const item of visualClips(graph, time)) {
                if (item.clip.kind !== "text" && !item.clip.source?.assetId) {
                    throw new Error("Visual clip has no local media: " + item.clip.name);
                }
            }
        }

        function preview(graph, time, playing = false) {
            // Never await these seeks in requestAnimationFrame. Only the export path
            // prepares exact frames; preview is best-effort and fires a repaint on seeked.
            const current = visualClips(graph, time);
            const active = new Set();
            for (const item of current) {
                if (item.clip.kind !== "video") continue;
                const entry = entryFor(item.clip);
                const media = entry?.media;
                if (!media || entry.cancelled) continue;
                active.add(media);
                const target = mediaTime(item, media);
                if (playing) {
                    media.playbackRate = clamp(item.clip.playbackRate || 1, 0.1, 8);
                    if (!media.seeking && Math.abs(media.currentTime - target) > 0.22) media.currentTime = target;
                    if (media.paused && !media.ended) media.play().catch(() => {});
                } else {
                    media.pause();
                    if (!media.seeking && Math.abs(media.currentTime - target) > 0.03) {
                        media.addEventListener("seeked", () => onReady(entry.assetId), { once: true });
                        try { media.currentTime = target; } catch (_) {}
                    }
                }
            }
            for (const entry of items.values()) {
                if (entry.kind === "video" && entry.media && !active.has(entry.media)) entry.media.pause();
            }
        }

        function draw(ctx, width, height, graph, time, position = "all") {
            for (const item of visualClips(graph, time, position)) {
                if (item.clip.kind === "text") {
                    drawText(ctx, item.clip, width, height);
                    continue;
                }
                const entry = entryFor(item.clip);
                if (!entry?.media || entry.error || entry.cancelled || !entry.width) continue;
                if (entry.kind === "video" && entry.media.readyState < 2) continue;
                drawMedia(ctx, entry.media, entry, item.clip, width, height);
            }
        }

        function dispose() {
            discarded = true;
            for (const entry of items.values()) release(entry);
            items.clear();
        }

        return Object.freeze({ sync, prepare, preview, draw, dispose, loaded: () => items.size, get: key => items.get(key) });
    }

    return Object.freeze({ visualClips, hasVisualClips, rectangle, drawMedia, drawText, createController });
});
