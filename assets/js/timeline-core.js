/* Phase 17 — pure timeline coordinate, snapping and edit-operation planner. */
(function (root, factory) {
    const api = factory(root.BratTracks || (typeof require === "function" ? require("./multitrack.js") : null));
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratTimeline = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (Tracks) {
    "use strict";
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
    const MIN_DURATION = 0.05;
    const MAX_TIME = 86400;
    const zoom = value => clamp(finite(Number(value), 48), 12, 240);
    function rulerStep(pxPerSecond) {
        const target = 92 / zoom(pxPerSecond);
        const power = Math.pow(10, Math.floor(Math.log10(target)));
        return [1, 2, 5, 10].map(multiplier => multiplier * power).find(step => step >= target) || power * 10;
    }
    function secondsToLabel(value) {
        const secs = Math.max(0, value);
        const mins = Math.floor(secs / 60);
        const whole = Math.floor(secs % 60);
        const fraction = Math.round((secs % 1) * 10);
        return mins + ":" + String(whole + (fraction === 10 ? 1 : 0)).padStart(2, "0") +
            (fraction && fraction !== 10 ? "." + fraction : "");
    }
    function markers(graph, excludeClipId, playhead = null) {
        const markers = [{ at: 0, kind: "origin" }];
        if (Number.isFinite(playhead) && playhead >= 0) markers.push({ at: playhead, kind: "playhead" });
        const data = Tracks.normalize(graph);
        for (const track of data.tracks) {
            for (const clip of track.clips) {
                if (clip.id === excludeClipId) continue;
                markers.push({ at: clip.start, kind: "clip-start" });
                markers.push({ at: clip.start + clip.duration, kind: "clip-end" });
            }
        }
        return markers;
    }
    function snap(time, points, scale, enabled = true, tolerancePixels = 9) {
        const raw = finite(time);
        if (!enabled) return { time: raw, snapped: false, marker: null };
        const distance = tolerancePixels / zoom(scale);
        let best = null;
        for (const marker of points) {
            const gap = Math.abs(raw - marker.at);
            if (gap <= distance && (!best || gap < best.gap)) best = { marker, gap };
        }
        return best ? { time: best.marker.at, snapped: true, marker: best.marker } :
            { time: raw, snapped: false, marker: null };
    }
    function clampStart(start, duration) {
        return clamp(start, 0, MAX_TIME - duration);
    }
    function gesture(graph, clipId, mode, deltaPixels, scale, options = {}) {
        const data = Tracks.normalize(graph);
        let currentTrack = null, clip = null;
        for (const track of data.tracks) {
            clip = track.clips.find(item => item.id === clipId);
            if (clip) { currentTrack = track; break; }
        }
        if (!clip) throw new Error("Clip not found.");
        if (currentTrack.locked) throw new Error("Track is locked.");
        const points = markers(data, clip.id, options.playhead);
        const delta = finite(deltaPixels) / zoom(scale);
        const enabled = options.snap !== false;
        if (mode === "move") {
            const target = options.toTrackId
                ? data.tracks.find(track => track.id === options.toTrackId) : currentTrack;
            if (!target || target.locked || !Tracks.accepts(target.kind, clip.kind)) {
                throw new Error("Incompatible or locked target track.");
            }
            let start = clampStart(clip.start + delta, clip.duration);
            // Snap either the leading edge or the trailing edge to the closest marker.
            const left = snap(start, points, scale, enabled);
            const right = snap(start + clip.duration, points, scale, enabled);
            const chosen = left.snapped && (!right.snapped ||
                Math.abs(left.time - start) <= Math.abs(right.time - (start + clip.duration)))
                ? left : right.snapped
                    ? { ...right, time: right.time - clip.duration } : left;
            start = clampStart(chosen.time, clip.duration);
            return { operation: "move-clip",
                args: { clipId: clip.id, start, toTrackId: target.id },
                snapped: chosen.snapped, marker: chosen.marker };
        }
        if (mode === "trim-left") {
            const max = clip.start + clip.duration - MIN_DURATION;
            const min = Math.max(0, clip.start - clip.sourceIn / clip.playbackRate);
            const desired = clamp(clip.start + delta, min, max);
            const result = snap(desired, points, scale, enabled);
            const start = clamp(result.time, min, max);
            return { operation: "trim-clip",
                args: { clipId: clip.id, start, duration: clip.duration + clip.start - start },
                snapped: result.snapped && result.time === start, marker: result.marker };
        }
        if (mode === "trim-right") {
            const minEnd = clip.start + MIN_DURATION;
            const maxEnd = MAX_TIME;
            const desired = clamp(clip.start + clip.duration + delta, minEnd, maxEnd);
            const result = snap(desired, points, scale, enabled);
            const end = clamp(result.time, minEnd, maxEnd);
            return { operation: "trim-clip", args: {
                clipId: clip.id, start: clip.start, duration: end - clip.start
            }, snapped: result.snapped && end === result.time, marker: result.marker };
        }
        throw new Error("Unknown timeline gesture.");
    }
    return Object.freeze({ zoom, rulerStep, secondsToLabel, markers, snap, gesture, MIN_DURATION });
});
