/* Phase 14: serializable, framework-free multitrack project graph.
 * Does not change legacy rendering until Phase 15/16.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratTracks = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    "use strict";

    const VERSION = 1;
    const MAX_TRACKS = 32;
    const MAX_CLIPS = 256;
    const MAX_TIME = 86400;
    const TRACK_TYPES = ["video", "overlay", "lyrics", "audio"];
    const CLIP_TYPES = ["video", "image", "text", "audio"];
    let sequence = 0;
    const id = prefix => prefix + "-" + (typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID() : Date.now().toString(36) + "-" + (++sequence).toString(36));
    const finite = (value, fallback) => value == null || value === "" || !Number.isFinite(Number(value)) ? fallback : Number(value);
    const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
    const safeString = (value, fallback = "", length = 180) =>
        typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, length) : fallback;
    const safeId = (value, prefix) => /^[a-zA-Z0-9_-]{1,128}$/.test(value || "") ? value : id(prefix);
    const clone = value => JSON.parse(JSON.stringify(value));
    const assert = (condition, message) => { if (!condition) throw new Error(message); };

    function accepts(trackType, clipType) {
        return trackType === "audio" ? clipType === "audio"
            : trackType === "lyrics" ? clipType === "text"
                : trackType === "video" ? ["video", "image"].includes(clipType)
                    : ["video", "image", "text"].includes(clipType);
    }

    function normalizeSource(source, kind) {
        const input = source && typeof source === "object" && !Array.isArray(source) ? source : {};
        const mediaKind = ["video", "image", "audio", "text"].includes(input.kind) ? input.kind : kind;
        return {
            kind: mediaKind,
            assetId: safeString(input.assetId, "", 256),
            name: safeString(input.name, "", 255),
            // Only same-origin/local asset references are used in this phase. A URL is
            // metadata and never fetched by the track editor.
            url: /^https?:\/\//i.test(input.url || "") ? safeString(input.url, "", 2048) : "",
            text: kind === "text" ? safeString(input.text, "", 4000) : ""
        };
    }

    function normalizeClip(input, trackType, fallbackId) {
        assert(input && typeof input === "object" && !Array.isArray(input), "Invalid clip.");
        const kind = CLIP_TYPES.includes(input.kind) ? input.kind : trackType === "audio" ? "audio" :
            trackType === "lyrics" ? "text" : "image";
        assert(accepts(trackType, kind), "Clip type is incompatible with track.");
        const start = clamp(finite(input.start, 0), 0, MAX_TIME);
        const duration = clamp(finite(input.duration, 5), 0.01, MAX_TIME - start || 0.01);
        const sourceIn = clamp(finite(input.sourceIn, 0), 0, MAX_TIME);
        const playbackRate = clamp(finite(input.playbackRate, 1), 0.1, 8);
        return {
            id: safeId(input.id || fallbackId, "clip"),
            name: safeString(input.name, kind + " clip", 180),
            kind, start, duration, sourceIn, playbackRate,
            source: normalizeSource(input.source, kind),
            muted: input.muted === true,
            opacity: clamp(finite(input.opacity, 1), 0, 1),
            volume: clamp(finite(input.volume, 1), 0, 2)
        };
    }

    function normalizeTrack(input, fallbackId) {
        assert(input && typeof input === "object" && !Array.isArray(input), "Invalid track.");
        const kind = TRACK_TYPES.includes(input.kind) ? input.kind : "overlay";
        const clips = [];
        const used = new Set();
        for (const value of (Array.isArray(input.clips) ? input.clips : []).slice(0, MAX_CLIPS)) {
            try {
                const clip = normalizeClip(value, kind);
                if (used.has(clip.id)) continue; // Malformed duplicates cannot be selected safely.
                used.add(clip.id);
                clips.push(clip);
            } catch (_) { /* corrupt/imported clip is discarded; never execute imported code */ }
        }
        return {
            id: safeId(input.id || fallbackId, "track"),
            name: safeString(input.name, kind, 100),
            kind, visible: input.visible !== false, muted: input.muted === true,
            locked: input.locked === true, clips
        };
    }

    function empty() {
        return { version: VERSION, tracks: [
            normalizeTrack({ id: "main-video", kind: "video", name: "Video" }),
            normalizeTrack({ id: "main-overlay", kind: "overlay", name: "Overlay" }),
            normalizeTrack({ id: "main-lyrics", kind: "lyrics", name: "Lyrics" }),
            normalizeTrack({ id: "main-audio", kind: "audio", name: "Audio" })
        ], selectedTrackId: "main-video", selectedClipId: null };
    }

    function normalize(input) {
        if (!input || typeof input !== "object" || !Array.isArray(input.tracks)) return empty();
        const tracks = [];
        const used = new Set();
        for (const value of input.tracks.slice(0, MAX_TRACKS)) {
            try {
                const track = normalizeTrack(value);
                if (used.has(track.id)) continue;
                tracks.push(track);
                used.add(track.id);
            } catch (_) {}
        }
        const selectedTrackId = tracks.some(t => t.id === input.selectedTrackId)
            ? input.selectedTrackId : tracks[0]?.id || null;
        const selectedClipId = tracks.some(t => t.clips.some(c => c.id === input.selectedClipId))
            ? input.selectedClipId : null;
        return { version: VERSION, tracks, selectedTrackId, selectedClipId };
    }

    function findTrack(graph, trackId) {
        const track = graph.tracks.find(t => t.id === trackId);
        assert(track, "Track not found.");
        return track;
    }
    function findClip(graph, clipId) {
        for (const track of graph.tracks) {
            const index = track.clips.findIndex(c => c.id === clipId);
            if (index >= 0) return { track, index, clip: track.clips[index] };
        }
        throw new Error("Clip not found.");
    }
    function requireUnlocked(track) { assert(!track.locked, "Track is locked."); }
    function apply(input, operation, args = {}) {
        const graph = normalize(input);
        const trackId = args.trackId;
        switch (operation) {
            case "select-track": {
                findTrack(graph, trackId);
                graph.selectedTrackId = trackId;
                graph.selectedClipId = null;
                break;
            }
            case "select-clip": {
                const result = findClip(graph, args.clipId);
                graph.selectedTrackId = result.track.id;
                graph.selectedClipId = result.clip.id;
                break;
            }
            case "add-track": {
                assert(graph.tracks.length < MAX_TRACKS, "Maximum track count reached.");
                const kind = TRACK_TYPES.includes(args.kind) ? args.kind : "overlay";
                const track = normalizeTrack({ kind, name: args.name || kind });
                graph.tracks.push(track);
                graph.selectedTrackId = track.id;
                graph.selectedClipId = null;
                break;
            }
            case "remove-track": {
                const track = findTrack(graph, trackId);
                requireUnlocked(track);
                graph.tracks = graph.tracks.filter(t => t.id !== trackId);
                graph.selectedTrackId = graph.tracks[0]?.id || null;
                graph.selectedClipId = null;
                break;
            }
            case "rename-track": {
                const track = findTrack(graph, trackId);
                requireUnlocked(track);
                track.name = safeString(args.name, track.name, 100);
                break;
            }
            case "set-track": {
                const track = findTrack(graph, trackId);
                if (args.locked != null) track.locked = args.locked === true;
                else {
                    requireUnlocked(track);
                    if (args.muted != null) track.muted = args.muted === true;
                    if (args.visible != null) track.visible = args.visible === true;
                }
                break;
            }
            case "move-track": {
                const track = findTrack(graph, trackId);
                requireUnlocked(track);
                const pos = graph.tracks.indexOf(track);
                const next = clamp(pos + (args.direction === "up" ? -1 : 1), 0, graph.tracks.length - 1);
                graph.tracks.splice(pos, 1);
                graph.tracks.splice(next, 0, track);
                break;
            }
            case "add-clip": {
                const track = findTrack(graph, trackId);
                requireUnlocked(track);
                assert(track.clips.length < MAX_CLIPS, "Maximum clip count reached.");
                const clip = normalizeClip({ ...args.clip, id: id("clip") }, track.kind);
                track.clips.push(clip);
                graph.selectedTrackId = track.id;
                graph.selectedClipId = clip.id;
                break;
            }
            case "remove-clip": {
                const { track, index } = findClip(graph, args.clipId);
                requireUnlocked(track);
                track.clips.splice(index, 1);
                if (graph.selectedClipId === args.clipId) graph.selectedClipId = null;
                break;
            }
            case "duplicate-clip": {
                const { track, index, clip } = findClip(graph, args.clipId);
                requireUnlocked(track);
                assert(track.clips.length < MAX_CLIPS, "Maximum clip count reached.");
                const start = clip.start + clip.duration;
                assert(start + clip.duration <= MAX_TIME, "Duplicated clip exceeds timeline limit.");
                const copy = { ...clone(clip), id: id("clip"), start };
                track.clips.splice(index + 1, 0, copy);
                graph.selectedTrackId = track.id;
                graph.selectedClipId = copy.id;
                break;
            }
            case "move-clip": {
                const { track, clip } = findClip(graph, args.clipId);
                requireUnlocked(track);
                const destination = args.toTrackId ? findTrack(graph, args.toTrackId) : track;
                requireUnlocked(destination);
                assert(accepts(destination.kind, clip.kind), "Clip type is incompatible with target track.");
                assert(destination === track || destination.clips.length < MAX_CLIPS, "Target track is full.");
                const start = finite(args.start, clip.start);
                assert(start >= 0 && start + clip.duration <= MAX_TIME, "Clip would exceed timeline.");
                if (destination !== track) {
                    track.clips.splice(track.clips.indexOf(clip), 1);
                    destination.clips.push(clip);
                }
                clip.start = start;
                graph.selectedTrackId = destination.id;
                graph.selectedClipId = clip.id;
                break;
            }
            case "trim-clip": {
                const { track, clip } = findClip(graph, args.clipId);
                requireUnlocked(track);
                const nextStart = finite(args.start, clip.start);
                const nextDuration = finite(args.duration, clip.duration);
                assert(nextStart >= 0 && nextDuration >= 0.01 && nextStart + nextDuration <= MAX_TIME, "Invalid trim range.");
                const nextSourceIn = clip.sourceIn + (nextStart - clip.start) * clip.playbackRate;
                assert(nextSourceIn >= 0 && nextSourceIn < MAX_TIME, "Invalid source in point.");
                clip.start = nextStart;
                clip.sourceIn = nextSourceIn;
                clip.duration = nextDuration;
                break;
            }
            case "split-clip": {
                const { track, index, clip } = findClip(graph, args.clipId);
                requireUnlocked(track);
                assert(track.clips.length < MAX_CLIPS, "Maximum clip count reached.");
                const at = finite(args.at, NaN);
                assert(Number.isFinite(at) && at > clip.start + 0.01 && at < clip.start + clip.duration - 0.01, "Split point must be inside the clip.");
                const leftDuration = at - clip.start;
                const right = { ...clone(clip), id: id("clip"), start: at,
                    sourceIn: clip.sourceIn + leftDuration * clip.playbackRate,
                    duration: clip.duration - leftDuration };
                clip.duration = leftDuration;
                track.clips.splice(index + 1, 0, right);
                graph.selectedTrackId = track.id;
                graph.selectedClipId = right.id;
                break;
            }
            case "set-clip": {
                const { track, clip } = findClip(graph, args.clipId);
                requireUnlocked(track);
                if (args.name != null) clip.name = safeString(args.name, clip.name, 180);
                if (args.muted != null) clip.muted = args.muted === true;
                if (args.opacity != null) clip.opacity = clamp(finite(args.opacity, clip.opacity), 0, 1);
                if (args.volume != null) clip.volume = clamp(finite(args.volume, clip.volume), 0, 2);
                break;
            }
            default: throw new Error("Unknown multitrack operation.");
        }
        return normalize(graph);
    }

    function activeAt(input, time, type = null) {
        const graph = normalize(input);
        if (!Number.isFinite(time) || time < 0) return [];
        return graph.tracks.flatMap((track, order) => {
            if (!track.visible || track.muted) return [];
            return track.clips.filter(clip => !clip.muted && (!type || clip.kind === type) &&
                time >= clip.start && time < clip.start + clip.duration).map(clip => ({
                trackId: track.id, order, clip, sourceTime: clip.sourceIn + (time - clip.start) * clip.playbackRate
            }));
        });
    }

    function endTime(input) {
        return Math.max(0, ...normalize(input).tracks.flatMap(t => t.clips.map(c => c.start + c.duration)));
    }

    return Object.freeze({ VERSION, TRACK_TYPES, CLIP_TYPES, MAX_TRACKS, MAX_CLIPS,
        empty, normalize, normalizeClip, accepts, apply, activeAt, endTime });
});
