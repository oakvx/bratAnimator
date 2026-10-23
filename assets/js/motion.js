(function (root, factory) {
    const motion = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = motion;
    root.BratMotion = motion;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    "use strict";

    const DEFAULT_FAMILY = "Arial Narrow, Arial, Helvetica Neue Condensed, sans-serif";
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const codepoints = value => Array.from(String(value ?? ""));
    const segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

    function normalizeEntrance(entrance = {}) {
        const aliases = { horizontal: "stretch-x", vertical: "stretch-y", "tilted-elastic": "elastic" };
        const mode = aliases[entrance?.mode] || entrance?.mode;
        return {
            mode: ["stretch-x", "stretch-y", "elastic"].includes(mode) ? mode : "none",
            duration: clamp(finite(entrance?.durationMs ?? entrance?.duration, 320), 100, 800),
            intensity: clamp(finite(entrance?.intensity, 0.15), 0, 0.3),
            randomAngles: entrance?.randomAngles === true,
            angle: clamp(finite(entrance?.angleMax ?? entrance?.angle, 8), 0, 15),
            seed: entrance?.seed ?? 0
        };
    }

    function hashString(value) {
        let hash = 2166136261;
        for (const character of String(value)) {
            hash ^= character.codePointAt(0);
            hash = Math.imul(hash, 16777619);
        }
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d);
        hash ^= hash >>> 15;
        hash = Math.imul(hash, 0x846ca68b);
        return (hash ^ (hash >>> 16)) >>> 0;
    }

    // Radians, derived exclusively from persisted inputs; rendering never draws randomness.
    function seededAngle(seed, lineId, rowIndex, maxDegrees = 8, salt = 0) {
        const unit = hashString(JSON.stringify([seed, lineId, rowIndex, salt])) / 4294967295;
        return (unit * 2 - 1) * clamp(finite(maxDegrees, 8), 0, 15) * Math.PI / 180;
    }

    function graphemeRecords(text) {
        const records = [];
        let charIndex = 0;
        const segments = segmenter ? Array.from(segmenter.segment(text), item => item.segment) : codepoints(text);
        for (const segment of segments) {
            const count = codepoints(segment).length;
            records.push({ text: segment, start: charIndex, end: charIndex + count - 1 });
            charIndex += count;
        }
        return records;
    }

    function measure(ctx, text, spacing, nativeSpacing) {
        const measured = Math.max(0, finite(ctx.measureText(text).width, 0));
        return Math.max(0, measured + (nativeSpacing ? 0 : Math.max(0, graphemeRecords(text).length - 1) * spacing));
    }

    // All indices are inclusive Unicode code-point indices, matching BratTiming's reveal indices.
    function wrapText(ctx, text, maxWidth, spacing, nativeSpacing) {
        const records = graphemeRecords(text);
        const rows = [];
        let cursor = 0;
        while (cursor < records.length) {
            while (cursor < records.length && /^[\t ]+$/.test(records[cursor].text)) cursor += 1;
            if (cursor >= records.length) break;
            if (/^[\r\n]+$/.test(records[cursor].text)) {
                const record = records[cursor++];
                rows.push({ text: "", startChar: record.start, endChar: record.start - 1, width: 0 });
                continue;
            }
            const start = cursor;
            let lastBreak = -1;
            let end = cursor;
            let candidate = "";
            while (end < records.length && !/[\r\n]/.test(records[end].text)) {
                const next = candidate + records[end].text;
                if (end > start && measure(ctx, next.trimEnd(), spacing, nativeSpacing) > maxWidth) break;
                candidate = next;
                if (/\s/.test(records[end].text)) lastBreak = end;
                end += 1;
            }
            let next = end;
            if (end < records.length && !/[\r\n]/.test(records[end].text) && lastBreak >= start) {
                end = lastBreak;
                next = lastBreak + 1;
            }
            while (end > start && /\s/.test(records[end - 1].text)) end -= 1;
            // At least one grapheme is consumed, including oversized words and emoji sequences.
            if (end === start) end = start + 1;
            const rowText = records.slice(start, end).map(record => record.text).join("");
            rows.push({ text: rowText, startChar: records[start].start, endChar: records[end - 1].end, width: measure(ctx, rowText, spacing, nativeSpacing) });
            cursor = Math.max(next, end);
            if (cursor < records.length && /[\r\n]/.test(records[cursor].text)) cursor += 1;
        }
        return rows.length ? rows : [{ text: "", startChar: 0, endChar: -1, width: 0 }];
    }

    function rotatedSize(width, height, angle) {
        return {
            width: Math.abs(Math.cos(angle)) * width + Math.abs(Math.sin(angle)) * height,
            height: Math.abs(Math.sin(angle)) * width + Math.abs(Math.cos(angle)) * height
        };
    }

    /**
     * Stable full-phrase geometry. Draw each row at its x/y center with textAlign=center,
     * textBaseline=middle, the returned font, style stretch and getRowTransform().
     * Row angles are radians. maxBounds includes entrance and beat overshoot.
     * bounds covers the original; totalBounds also covers reserved translation space.
     */
    function createLayout(ctx, text, width, height, style = {}, options = {}) {
        if (!ctx || typeof ctx.measureText !== "function") throw new TypeError("A measuring canvas context is required.");
        width = Math.max(1, finite(width, 1));
        height = Math.max(1, finite(height, 1));
        const source = String(text ?? "");
        const family = style.fontFamily || DEFAULT_FAMILY;
        const entrance = normalizeEntrance(style.entrance);
        const fontScale = clamp(finite(style.fontScale, 1), 0.1, 2);
        const stretchX = clamp(finite(style.stretch, 0.94), 0.1, 3);
        const stretchY = clamp(finite(style.stretchY, 1), 0.1, 3);
        const spacing = clamp(finite(style.letterSpacing, 0), -50, 100);
        const lineSpacing = clamp(finite(style.lineSpacing, 0.92), 0.1, 3);
        const pulse = 1 + clamp(finite(options.beatPulseMax, 0), 0, 0.1);
        const overshootX = pulse * (1 + (["stretch-x", "elastic"].includes(entrance.mode) ? entrance.intensity : 0));
        const overshootY = pulse * (1 + (["stretch-y", "elastic"].includes(entrance.mode) ? entrance.intensity : 0));
        const safeWidth = width * 0.9;
        const safeHeight = height * 0.9;
        const translation = typeof options.translation === "string" ? { text: options.translation } : options.translation || {};
        const translationText = String(translation.text || "");
        const translationFamily = translation.fontFamily || style.translationFontFamily || family;
        const translationScale = clamp(finite(translation.fontScale ?? style.translationScale, 0.6), 0.1, 2);
        const nativeSpacing = "letterSpacing" in ctx;
        ctx.save();
        try {
            if (nativeSpacing) ctx.letterSpacing = `${spacing}px`;
            // Fit the unscaled phrase once. Keeping those rows makes the 10% size
            // control proportional and stops typewriter/word reveal from reflowing.
            const maxBaseSize = Math.max(1, width * 0.118);
            let low = Math.min(0.25, maxBaseSize);
            let high = maxBaseSize;
            let baseRows;
            for (let attempt = 0; attempt < 20; attempt += 1) {
                const size = (low + high) / 2;
                ctx.font = `400 ${size}px ${family}`;
                const rows = wrapText(ctx, source, width * 0.76, spacing, nativeSpacing);
                const fits = Math.max(...rows.map(row => row.width), 0) <= width * 0.76 && rows.length * size * Math.max(1, lineSpacing) <= height * 0.48;
                if (fits) low = size;
                else high = size;
            }
            let fontSize = low * fontScale;
            const requestedFontSize = fontSize;
            ctx.font = `400 ${low}px ${family}`;
            baseRows = wrapText(ctx, source, width * 0.76, spacing, nativeSpacing);
            const preparedRows = baseRows.map((row, index) => ({
                ...row,
                angle: entrance.randomAngles ? seededAngle(options.seed ?? 0, options.lineId ?? "", index, entrance.angle, entrance.seed) : 0
            }));

            function geometry(size) {
                const effectiveSpacing = spacing * Math.min(1, size / requestedFontSize);
                if (nativeSpacing) ctx.letterSpacing = `${effectiveSpacing}px`;
                ctx.font = `400 ${size}px ${family}`;
                const rows = preparedRows.map(row => {
                    const measuredWidth = measure(ctx, row.text, effectiveSpacing, nativeSpacing);
                    const metrics = ctx.measureText(row.text || "Mg");
                    const measuredHeight = Math.max(size, finite(metrics.actualBoundingBoxAscent, size * 0.8) + finite(metrics.actualBoundingBoxDescent, size * 0.2));
                    const maximum = rotatedSize(measuredWidth * stretchX * overshootX, measuredHeight * stretchY * overshootY, row.angle);
                    return { ...row, width: measuredWidth, height: measuredHeight, maxWidth: maximum.width, maxHeight: maximum.height };
                });
                const gap = size * Math.max(0.04, lineSpacing - 0.85);
                const originalHeight = rows.reduce((sum, row) => sum + row.maxHeight, 0) + Math.max(0, rows.length - 1) * gap;
                let translationRows = [];
                const translationFontSize = size * translationScale;
                const translationGap = translationText ? size * 0.24 : 0;
                if (translationText) {
                    ctx.font = `400 ${translationFontSize}px ${translationFamily}`;
                    translationRows = wrapText(ctx, translationText, safeWidth / pulse, effectiveSpacing, nativeSpacing).map(row => ({ ...row, height: translationFontSize * 1.15 }));
                }
                const translationHeight = translationRows.length * translationFontSize * 1.15 * pulse;
                return {
                    rows, gap, originalHeight, translationRows, translationFontSize, translationGap, effectiveSpacing,
                    width: Math.max(...rows.map(row => row.maxWidth), ...translationRows.map(row => row.width * pulse), 0),
                    height: originalHeight + translationGap + translationHeight,
                    translationHeight
                };
            }

            let fitted = geometry(fontSize);
            // Spacing is in pixels, so remeasure rather than scaling rectangles blindly.
            for (let attempt = 0; attempt < 24; attempt += 1) {
                const fit = Math.min(1, safeWidth / Math.max(fitted.width, 0.001), safeHeight / Math.max(fitted.height, 0.001));
                if (fit >= 0.99999) break;
                fontSize *= fit * 0.999;
                fitted = geometry(fontSize);
            }
            const centerX = clamp(width * clamp(finite(style.positionX, 0.5), 0, 1), width * 0.05 + fitted.width / 2, width * 0.95 - fitted.width / 2);
            const centerY = clamp(height * (0.5 + clamp(finite(style.verticalPosition, 0), -0.45, 0.45)), height * 0.05 + fitted.height / 2, height * 0.95 - fitted.height / 2);
            const top = centerY - fitted.height / 2;
            let rowTop = top;
            const rows = fitted.rows.map(row => {
                const y = rowTop + row.maxHeight / 2;
                rowTop += row.maxHeight + fitted.gap;
                return { ...row, x: centerX, y, maxBounds: { x: centerX - row.maxWidth / 2, y: y - row.maxHeight / 2, width: row.maxWidth, height: row.maxHeight } };
            });
            const translationTop = top + fitted.originalHeight + fitted.translationGap;
            const translationRows = fitted.translationRows.map((row, index) => ({
                ...row, angle: 0, x: centerX,
                y: translationTop + (index + 0.5) * fitted.translationFontSize * 1.15 * pulse
            }));
            const originalWidth = Math.max(...rows.map(row => row.maxWidth), 0);
            return {
                fontSize, fontFamily: family, fontScale, stretchX, stretchY, letterSpacing: fitted.effectiveSpacing, rows,
                lineHeight: fontSize * Math.max(1, lineSpacing),
                bounds: { x: centerX - originalWidth / 2, y: top, width: originalWidth, height: fitted.originalHeight },
                totalBounds: { x: centerX - fitted.width / 2, y: top, width: fitted.width, height: fitted.height },
                translationRows, translationFontSize: fitted.translationFontSize, translationFontFamily: translationFamily,
                translationBounds: { x: centerX - fitted.width / 2, y: translationTop, width: fitted.width, height: fitted.translationHeight }
            };
        } finally {
            ctx.restore();
        }
    }

    function getRowTransform(entrance, elapsedSec, availableDuration, rowIndex = 0, angle = 0) {
        const settings = normalizeEntrance(entrance);
        const rotation = finite(angle, 0);
        if (settings.mode === "none") return { scaleX: 1, scaleY: 1, rotation, alpha: 1 };
        const available = Math.max(0, finite(availableDuration, settings.duration / 1000));
        if (available === 0) return { scaleX: 1, scaleY: 1, rotation, alpha: 1 };
        const delay = Math.min(Math.max(0, finite(rowIndex, 0)) * 0.04, available * 0.2);
        const duration = Math.max(0.000001, Math.min(settings.duration / 1000, available - delay));
        const elapsed = finite(elapsedSec, 0) - delay;
        const progress = clamp(elapsed / duration, 0, 1);
        let deformation = settings.intensity * Math.pow(1 - progress, 3);
        if (settings.mode === "elastic") deformation = settings.intensity * Math.exp(-7 * progress) * Math.cos(3 * Math.PI * progress) * (1 - progress);
        deformation = clamp(deformation, -settings.intensity, settings.intensity);
        return {
            scaleX: settings.mode === "stretch-y" ? 1 : 1 + deformation,
            scaleY: settings.mode === "stretch-x" ? 1 : 1 + (settings.mode === "elastic" ? -deformation * 0.55 : deformation),
            rotation,
            alpha: elapsed < 0 ? 0 : 1
        };
    }

    function estimateBeats(audioAnalysis) {
        const frames = audioAnalysis?.frames;
        if (!Array.isArray(frames) || !frames.length || audioAnalysis.usable === false) return [];
        const values = frames.map((frame, index) => Math.max(0, finite(frame.onset, finite(frame.rms, 0) - finite(frames[index - 1]?.rms, 0))));
        const maximum = values.reduce((max, value) => Math.max(max, value), 0);
        if (maximum < 0.00001) return [];
        const average = values.reduce((sum, value) => sum + value, 0) / values.length;
        const threshold = Math.max(0.00001, maximum * 0.12, average * 1.5);
        const beats = [];
        for (let index = 0; index < values.length; index += 1) {
            const onset = values[index];
            if (onset < threshold || onset <= (values[index - 1] || 0) || onset < (values[index + 1] || 0)) continue;
            const time = finite(frames[index].time, index * finite(audioAnalysis.frameDuration, 0.018));
            if (time < 0) continue;
            const previous = beats[beats.length - 1];
            if (!previous || time - previous.time >= 0.2 - 1e-9) beats.push({ time, strength: onset });
            else if (onset > previous.strength) beats[beats.length - 1] = { time, strength: onset };
        }
        return beats.map(beat => beat.time);
    }

    // Causal 0..1 envelope. An estimated beat list is computed once, outside rendering.
    function beatEnvelope(time, settings = {}, beats = []) {
        if (settings?.enabled !== true || !Number.isFinite(Number(time))) return 0;
        const now = Number(time);
        let previous = -Infinity;
        let period = 60 / clamp(finite(settings.bpm, 120), 40, 240);
        if (["audio", "estimated", "auto"].includes(settings.source)) {
            let low = 0;
            let high = beats.length - 1;
            while (low <= high) {
                const middle = (low + high) >> 1;
                const beatTime = finite(typeof beats[middle] === "object" ? beats[middle]?.time : beats[middle], Infinity);
                if (beatTime <= now) {
                    previous = beatTime;
                    low = middle + 1;
                } else high = middle - 1;
            }
        } else {
            const offset = finite(settings.offsetSec ?? settings.offset, 0);
            if (now < offset) return 0;
            previous = offset + Math.floor((now - offset) / period + 1e-10) * period;
        }
        const duration = clamp(finite(settings.pulseDuration, Math.min(0.18, period * 0.65)), 0.025, 0.4);
        const age = now - previous;
        if (age < 0 || age >= duration) return 0;
        return Math.pow(1 - age / duration, 2);
    }

    function resolveExportRange(range, totalDuration) {
        const total = Number(totalDuration);
        const fail = code => {
            const error = new RangeError(code);
            error.code = code;
            throw error;
        };
        if (!Number.isFinite(total) || total <= 0) return fail("export-range-duration");
        if (!range || range.enabled !== true) return { start: 0, end: total, duration: total };
        const start = Number(range.start);
        const end = range.end == null ? total : Number(range.end);
        if (!Number.isFinite(start) || !Number.isFinite(end)) return fail("export-range-invalid");
        if (start < 0 || end > total || start >= end) return fail("export-range-bounds");
        return { start, end, duration: end - start };
    }

    return { createLayout, getRowTransform, seededAngle, estimateBeats, beatEnvelope, resolveExportRange };
});
