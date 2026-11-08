/* Kinetic collage: deterministic, resolution-independent word layouts.
   This module has no DOM dependencies and is shared by preview and all exports. */
(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratKinetic = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    "use strict";
    const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
    const finite = (n, fallback) => Number.isFinite(Number(n)) ? Number(n) : fallback;
    function hash(source) {
        let h = 2166136261;
        for (const c of String(source)) {
            h ^= c.codePointAt(0);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }
    function noise(seed, salt) {
        let v = hash(String(seed) + ":" + salt) + 0x6D2B79F5 | 0;
        v = Math.imul(v ^ v >>> 15, v | 1);
        v ^= v + Math.imul(v ^ v >>> 7, v | 61);
        return ((v ^ v >>> 14) >>> 0) / 4294967296;
    }
    function normalize(style) {
        return {
            maxWords: clamp(Math.round(finite(style?.kineticWords, 6)), 2, 9),
            variation: clamp(finite(style?.kineticVariation, 72), 0, 100) / 100,
            motion: clamp(finite(style?.kineticMotion, 55), 0, 100) / 100,
            fontScale: clamp(finite(style?.fontScale, 1), 0.1, 2),
            fontFamily: String(style?.fontFamily || "Arial, Helvetica, sans-serif"),
            positionX: clamp(finite(style?.positionX, 0), -0.25, 0.25),
            verticalPosition: clamp(finite(style?.verticalPosition, 0), -0.25, 0.25)
        };
    }
    function getWords(line) {
        if (!line) return [];
        const native = Array.isArray(line.timedWords) ? line.timedWords : [];
        const clean = native.filter(w => String(w.text || "").trim() && Number.isFinite(w.start));
        if (clean.length) return clean.map(w => ({
            text: String(w.text).trim(), start: w.start, end: Number.isFinite(w.end) ? w.end : w.start + 0.3
        }));
        const pieces = String(line.text || "").match(/\S+/gu) || [];
        const start = finite(line.displayStart, 0);
        const duration = Math.max(0.1, finite(line.vocalEnd, start + 2) - start);
        return pieces.map((text, index) => ({
            text, start: start + duration * index / pieces.length,
            end: start + duration * (index + 1) / pieces.length
        }));
    }
    function rowCounts(count, sceneSeed) {
        if (count <= 2) return Array(count).fill(1);
        if (count === 3) return noise(sceneSeed, "split") < 0.5 ? [1, 2] : [2, 1];
        if (count === 4) return noise(sceneSeed, "split") < 0.5 ? [1, 2, 1] : [2, 2];
        if (count === 5) return noise(sceneSeed, "split") < 0.5 ? [1, 2, 2] : [2, 1, 2];
        if (count === 6) return noise(sceneSeed, "split") < 0.5 ? [1, 2, 3] : [2, 2, 2];
        if (count === 7) return [2, 2, 3];
        if (count === 8) return [2, 3, 3];
        return [2, 2, 2, 3];
    }
    function measureScene(ctx, chosen, width, height, options, sceneSeed) {
        const shortSide = Math.min(width, height);
        const base = Math.min(width * 0.135, height * 0.265) * options.fontScale;
        const sizePattern = [0.98, 0.55, 1.26, 0.68, 1.18, 0.46, 1.33, 0.75, 1.15];
        const rows = [];
        const counts = rowCounts(chosen.length, sceneSeed);
        const safeWidth = width * 0.81;
        const safeHeight = height * 0.68;
        let cursor = 0;
        for (let r = 0; r < counts.length; r += 1) {
            const items = chosen.slice(cursor, cursor + counts[r]);
            cursor += counts[r];
            const measurements = items.map((word, index) => {
                const ordinal = cursor - counts[r] + index;
                const emphasis = ordinal === chosen.length - 1 ? 1.24 : 1;
                const randomFactor = 0.78 + noise(sceneSeed, ordinal + ":" + word.text) * 0.5;
                const ratio = 1 + ((sizePattern[ordinal % sizePattern.length] * randomFactor * emphasis) - 1) * options.variation;
                const size = Math.max(4, base * ratio);
                ctx.font = '400 ' + size + 'px ' + options.fontFamily;
                return { text: word.text, start: word.start, size, width: ctx.measureText(word.text).width };
            });
            const gap = Math.max(4, shortSide * 0.009);
            rows.push({
                items: measurements,
                width: measurements.reduce((total, w) => total + w.width, 0) + Math.max(0, measurements.length - 1) * gap,
                height: Math.max(...measurements.map(w => w.size)),
                gap
            });
        }
        const measuredHeight = rows.reduce((total, row) => total + row.height * 0.91, 0);
        const longest = Math.max(...rows.map(row => row.width), 1);
        const scale = Math.min(1, safeWidth / longest, safeHeight / Math.max(measuredHeight, 1));
        const totalHeight = measuredHeight * scale;
        let top = height * (0.5 + options.verticalPosition) - totalHeight / 2;
        const nodes = [];
        for (let r = 0; r < rows.length; r += 1) {
            const row = rows[r];
            const rowWidth = row.width * scale;
            const displacement = (noise(sceneSeed, "row" + r) - 0.5) * width * 0.115;
            const xCenter = clamp(width * (0.5 + options.positionX) + displacement,
                width * 0.08 + rowWidth / 2, width * 0.92 - rowWidth / 2);
            let x = xCenter - rowWidth / 2;
            for (const word of row.items) {
                const w = word.width * scale;
                nodes.push({
                    text: word.text, start: word.start, size: word.size * scale,
                    x: x + w / 2, y: top + row.height * scale * 0.78,
                    width: w
                });
                x += w + row.gap * scale;
            }
            top += row.height * scale * 0.91;
        }
        return nodes;
    }
    function buildFrame(ctx, line, time, width, height, style, seed = 1337) {
        if (!ctx || width <= 0 || height <= 0 || !line) return { groups: [], activeIndex: -1 };
        const options = normalize(style);
        const words = getWords(line);
        if (!words.length) return { groups: [], activeIndex: -1 };
        let active = -1;
        for (let i = 0; i < words.length; i += 1) {
            if (time >= words[i].start) active = i;
            else break;
        }
        if (active < 0) return { groups: [], activeIndex: -1 };
        const lineSeed = String(seed) + ":" + (line.sourceRowId || line.lineIndex || line.displayStart || line.text || "");
        function groupFor(index) {
            const windowStart = Math.max(0, index - options.maxWords + 1);
            const chosen = words.slice(windowStart, index + 1);
            return measureScene(ctx, chosen, width, height, options, lineSeed + ":" + index);
        }
        const duration = 0.44 - options.motion * 0.27;
        const fraction = clamp((time - words[active].start) / duration, 0, 1);
        const eased = fraction * fraction * (3 - 2 * fraction);
        const groups = [];
        if (active > 0 && eased < 1) {
            groups.push({ nodes: groupFor(active - 1), alpha: 1 - eased,
                translateY: -height * 0.012 * eased * options.motion });
        }
        groups.push({ nodes: groupFor(active), alpha: active > 0 ? eased : 1,
            translateY: height * 0.012 * (1 - eased) * options.motion });
        return { groups, activeIndex: active, activeWord: words[active].text };
    }
    // Keep the latest words from previous lyric lines: short LRC lines still form
    // a complete composition instead of returning to a one-word slide.
    function buildTimelineFrame(ctx, timeline, time, width, height, style, seed = 1337) {
        if (!Array.isArray(timeline)) return { groups: [], activeIndex: -1 };
        const activeLine = timeline.find(line => time >= line.displayStart && time < line.displayEnd);
        if (!activeLine || !String(activeLine.text || "").trim()) return { groups: [], activeIndex: -1 };
        const stream = timeline
            .filter(line => line.displayStart <= activeLine.displayStart && String(line.text || "").trim())
            .flatMap(getWords)
            .sort((a, b) => a.start - b.start);
        return buildFrame(ctx, { sourceRowId: "kinetic-stream", timedWords: stream },
            time, width, height, style, seed);
    }
    return { buildFrame, buildTimelineFrame, getWords, normalize, rowCounts };
});
