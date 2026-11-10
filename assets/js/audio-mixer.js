/* Phase 16 — shared audio mixer for the project timeline.
 * Decode local, user-provided audio (including decodable soundtracks embedded in
 * video containers) once; produce the same AudioBufferSourceNode plan for
 * live monitoring and the existing MP4/WebM export engine.
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratAudioMixer = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (scope) {
    "use strict";
    const Tracks = scope.BratTracks || (typeof require === "function" ? require("./multitrack.js") : null);
    const MAX_BYTES = 512 * 1024 * 1024;
    const finite = (number, fallback) => Number.isFinite(Number(number)) ? Number(number) : fallback;

    function audible(graph, range = null) {
        const model = Tracks.normalize(graph);
        const list = [];
        for (const track of model.tracks) {
            if (track.muted || track.volume <= 0) continue;
            for (const clip of track.clips) {
                if (!["audio", "video"].includes(clip.kind) || clip.muted || clip.volume <= 0) continue;
                if (range && (clip.start >= range.end || clip.start + clip.duration <= range.start)) continue;
                list.push({
                    id: clip.id, name: clip.name, kind: clip.kind,
                    assetId: clip.source.assetId,
                    start: clip.start, duration: clip.duration,
                    offset: clip.sourceIn, playbackRate: clip.playbackRate,
                    volume: track.volume * clip.volume,
                    fadeIn: clip.fadeIn, fadeOut: clip.fadeOut
                });
            }
        }
        return list;
    }

    function createController({ loadAsset, environment = scope, onStatus = () => {} } = {}) {
        if (typeof loadAsset !== "function") throw new TypeError("A local asset loader is required.");
        const decoded = new Map();
        let context = null;
        let nodes = [];
        let generation = 0;
        let closed = false;

        function makeContext() {
            const Constructor = environment.AudioContext || environment.webkitAudioContext;
            if (typeof Constructor !== "function") throw new Error("Web Audio is unavailable in this browser.");
            return new Constructor();
        }

        function ensureContext() {
            if (!context) context = makeContext();
            return context;
        }

        function getBuffer(assetId, kind) {
            if (!assetId) return Promise.reject(new Error("Audio clip has no imported local file."));
            if (decoded.has(assetId)) return decoded.get(assetId);
            const promise = (async () => {
                const record = await loadAsset(assetId);
                if (!record?.blob?.size || record.blob.size > MAX_BYTES) {
                    throw new Error("Missing or oversized local audio asset: " + assetId);
                }
                const bytes = await record.blob.arrayBuffer();
                if (closed) throw new Error("Audio mixer is disposed.");
                // decodeAudioData accepts complete files; if the browser does not
                // expose the audio stream inside a video container, report it.
                try {
                    const buffer = await ensureContext().decodeAudioData(bytes);
                    if (!buffer || !buffer.length) throw new Error("Audio decoding returned no samples.");
                    return { buffer, warning: null };
                } catch (error) {
                    if (kind === "video") {
                        return { buffer: null, warning: "Audio not decodable from video “" +
                            (record.name || assetId) + "”. The video may be silent or use an unsupported audio codec." };
                    }
                    throw new Error("Cannot decode audio “" + (record.name || assetId) + "”: " + error.message);
                }
            })();
            decoded.set(assetId, promise);
            promise.catch(() => { if (decoded.get(assetId) === promise) decoded.delete(assetId); });
            return promise;
        }

        async function prepare(graph, range = null) {
            if (closed) throw new Error("Audio mixer is disposed.");
            const selected = audible(graph, range);
            const clips = [];
            const warnings = [];
            for (const clip of selected) {
                if (!clip.assetId) {
                    if (clip.kind === "audio") throw new Error("Audio clip “" + clip.name + "” has no local file.");
                    warnings.push("Video “" + clip.name + "” has no local asset; sound cannot be mixed.");
                    continue;
                }
                const result = await getBuffer(clip.assetId, clip.kind);
                if (result.warning) { warnings.push(result.warning); continue; }
                clips.push({
                    buffer: result.buffer,
                    start: clip.start,
                    duration: clip.duration,
                    offset: clip.offset,
                    playbackRate: clip.playbackRate,
                    volume: clip.volume,
                    fadeIn: clip.fadeIn, fadeOut: clip.fadeOut,
                    name: clip.name
                });
            }
            if (warnings.length) onStatus(warnings.join(" "));
            return { clips, warnings };
        }

        function stop() {
            generation++;
            for (const node of nodes) {
                try { node.stop(); } catch (_) {}
                try { node.disconnect(); } catch (_) {}
            }
            nodes = [];
        }

        async function play(graph, getTime) {
            stop();
            const currentGeneration = generation;
            // Resume synchronously from the user's Play gesture, before fetching
            // media asynchronously (otherwise iOS/Safari can block the context).
            const unlock = audible(graph).length ? ensureContext() : null;
            const resumePromise = unlock?.state === "suspended" ? unlock.resume() : null;
            if (resumePromise) await resumePromise;
            const result = await prepare(graph);
            if (closed || currentGeneration !== generation) return result;
            const position = typeof getTime === "function" ? getTime() : getTime;
            if (!Number.isFinite(position)) return result;
            if (!result.clips.length) return result;
            const audioContext = ensureContext();
            if (audioContext.state === "suspended") await audioContext.resume();
            if (closed || currentGeneration !== generation) return result;
            const latestTime = typeof getTime === "function" ? getTime() : position;
            if (!Number.isFinite(latestTime)) return result;
            const last = Math.max(latestTime, ...result.clips.map(clip => clip.start + clip.duration));
            const clock = { start: Math.max(0, latestTime), end: Math.max(last + .01, latestTime + .01) };
            const engine = environment.BratExportEngine || scope.BratExportEngine;
            if (!engine?.scheduleAudio) throw new Error("The export audio scheduler is unavailable.");
            nodes = engine.scheduleAudio(audioContext, audioContext.destination, result.clips, clock,
                audioContext.currentTime + .04);
            return result;
        }

        function dispose() {
            stop();
            closed = true;
            decoded.clear();
            if (context) {
                context.close().catch(() => {});
                context = null;
            }
        }

        function resetSources() {
            stop();
            decoded.clear();
        }

        function prune(graph) {
            const keys = new Set(Tracks.normalize(graph).tracks.flatMap(track =>
                track.clips.filter(clip => ["audio", "video"].includes(clip.kind) && clip.source.assetId)
                    .map(clip => clip.source.assetId)));
            for (const key of decoded.keys()) if (!keys.has(key)) decoded.delete(key);
        }

        return Object.freeze({ getBuffer, prepare, play, stop, dispose, resetSources, prune,
            get cachedCount() { return decoded.size; } });
    }

    return Object.freeze({ audible, createController });
});
