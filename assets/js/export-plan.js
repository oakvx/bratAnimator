/* Phase 13: immutable time-based export plans, shared by WebCodecs and MediaRecorder. */
(function (root, factory) {
    const api = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratExportPlan = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    "use strict";
    const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    function create(input = {}) {
        const rawWidth = finite(input.width, NaN);
        const rawHeight = finite(input.height, NaN);
        const rawFps = finite(input.fps, NaN);
        const start = finite(input.start, NaN);
        const end = finite(input.end, NaN);
        if (!Number.isInteger(rawWidth) || !Number.isInteger(rawHeight) || rawWidth < 16 || rawHeight < 16 || rawWidth > 8192 || rawHeight > 8192) {
            throw new RangeError("Export dimensions must be integers between 16 and 8192.");
        }
        if (!Number.isInteger(rawFps) || rawFps < 1 || rawFps > 120) {
            throw new RangeError("Export FPS must be an integer between 1 and 120.");
        }
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || end - start > 86400) {
            throw new RangeError("Invalid export time range.");
        }
        const width = Math.ceil(rawWidth / 2) * 2;
        const height = Math.ceil(rawHeight / 2) * 2;
        const duration = end - start;
        const totalFrames = Math.ceil(duration * rawFps);
        const bitrate = clamp(Math.round(width * height * Math.max(24, rawFps) * 0.095), 4_500_000, 80_000_000);
        return Object.freeze({ width, height, fps: rawFps, start, end, duration, totalFrames, bitrate });
    }

    function frameAt(plan, index) {
        if (!Number.isInteger(index) || index < 0 || index >= plan.totalFrames) throw new RangeError("Invalid frame index.");
        const relativeTime = index / plan.fps;
        return Object.freeze({
            index,
            sourceTime: plan.start + relativeTime,
            timestamp: Math.round(relativeTime * 1_000_000),
            duration: Math.max(1, Math.round(Math.min(1 / plan.fps, plan.duration - relativeTime) * 1_000_000))
        });
    }

    // Audio clips refer to the absolute project timeline (not the cropped export origin).
    function clipWindow(clip, plan) {
        if (!clip?.buffer || clip.muted) return null;
        const buffer = clip.buffer;
        const sourceOffset = Math.max(0, finite(clip.offset, 0));
        const length = Math.max(0, Math.min(finite(clip.duration, buffer.duration - sourceOffset), buffer.duration - sourceOffset));
        const start = Math.max(0, finite(clip.start, 0));
        const overlapStart = Math.max(start, plan.start);
        const overlapEnd = Math.min(start + length, plan.end);
        if (!Number.isFinite(buffer.duration) || overlapEnd - overlapStart <= 0) return null;
        return Object.freeze({
            sourceOffset: sourceOffset + overlapStart - start,
            destinationOffset: overlapStart - plan.start,
            duration: overlapEnd - overlapStart,
            clipStart: start,
            clipEnd: start + length,
            overlapStart,
            overlapEnd,
            volume: clamp(finite(clip.volume, 1), 0, 2),
            fadeIn: clamp(finite(clip.fadeIn, 0), 0, length),
            fadeOut: clamp(finite(clip.fadeOut, 0), 0, length)
        });
    }

    return Object.freeze({ create, frameAt, clipWindow });
});
