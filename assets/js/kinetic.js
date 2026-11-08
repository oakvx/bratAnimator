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
    // A compact typographic cluster is built once for each word group.
    // Its geometry NEVER depends on the current playback time: words appear
    // incrementally, without recentering, blur, crossfades or opacity flashing.
    function rowCounts(count, sceneSeed) {
        // Legacy public helper retained for older projects/tests. Rendering no
        // longer uses line/row grouping: boxes are packed in two dimensions.
        if (count < 1) return [];
        if (count <= 2) return Array(count).fill(1);
        return Array.from({ length: Math.ceil(count / 3) }, (_, index) =>
            Math.min(3, count - index * 3));
    }
    function intersects(a, b, gap = 0) {
        return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x
            && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
    }
    function unionBounds(boxes) {
        const left = Math.min(...boxes.map(box => box.x));
        const right = Math.max(...boxes.map(box => box.x + box.width));
        const top = Math.min(...boxes.map(box => box.y));
        const bottom = Math.max(...boxes.map(box => box.y + box.height));
        return { left, right, top, bottom, width: right - left, height: bottom - top };
    }
    function candidates(box, placed, gap, seed) {
        const choices = [];
        function add(x, y) { choices.push({ x, y, width: box.width, height: box.height }); }
        for (const existing of placed) {
            const horizontal = [
                existing.y,
                existing.y + (existing.height - box.height) * 0.5,
                existing.y + existing.height - box.height
            ];
            const vertical = [
                existing.x,
                existing.x + (existing.width - box.width) * 0.5,
                existing.x + existing.width - box.width
            ];
            for (const y of horizontal) {
                add(existing.x + existing.width + gap, y);
                add(existing.x - box.width - gap, y);
            }
            for (const x of vertical) {
                add(x, existing.y + existing.height + gap);
                add(x, existing.y - box.height - gap);
            }
        }
        return choices.filter(candidate =>
            placed.every(other => !intersects(candidate, other, gap * 0.55)));
    }
    function compactPlacement(measured, seed, shortSide, targetAspect) {
        // Place dominant words first, then dock smaller tokens against the
        // nearest edges. This produces the screenshot-like "interlocked" mass
        // instead of equal-width rows or scattered independent coordinates.
        const order = measured.slice().sort((a, b) =>
            b.width * b.height - a.width * a.height || a.index - b.index);
        const placed = [];
        const gap = Math.max(2, shortSide * 0.006);
        for (const item of order) {
            const box = { ...item, x: 0, y: 0 };
            if (!placed.length) { placed.push(box); continue; }
            const options = candidates(box, placed, gap, seed);
            let winner = null;
            let best = Infinity;
            for (let i = 0; i < options.length; i += 1) {
                const candidate = options[i];
                const bounds = unionBounds([...placed, candidate]);
                const area = bounds.width * bounds.height;
                const ratio = bounds.width / Math.max(bounds.height, 1);
                const aspectPenalty = Math.abs(Math.log(ratio / targetAspect));
                const cx = candidate.x + candidate.width / 2;
                const cy = candidate.y + candidate.height / 2;
                const radial = Math.hypot(cx - (bounds.left + bounds.right) / 2,
                    cy - (bounds.top + bounds.bottom) / 2);
                // Candidate jitter is deterministic and small compared to area:
                // randomness shapes the cluster without sacrificing packing.
                const jitter = (noise(seed, "dock:" + item.index + ":" + i) - .5) * .10;
                const score = area * (1 + .20 * aspectPenalty + jitter)
                    + radial * shortSide * .18;
                if (score < best) { best = score; winner = candidate; }
            }
            // The candidate set is nonempty: placement to the right of the
            // rightmost box is always available, even at extreme font sizes.
            placed.push({ ...box, ...(winner || { x: Math.max(...placed.map(p => p.x + p.width)) + gap, y: 0 }) });
        }
        return placed.sort((a, b) => a.index - b.index);
    }
    function measureScene(ctx, chosen, width, height, options, sceneSeed) {
        const shortSide = Math.min(width, height);
        const base = Math.min(width * .17, height * .30) * options.fontScale;
        const patterns = [1.27, .53, 1.03, .62, 1.40, .48, .91, .71, 1.22];
        const measured = chosen.map((word, index) => {
            const randomness = .83 + noise(sceneSeed, "size:" + index + ":" + word.text) * .39;
            const pattern = patterns[(index + Math.floor(noise(sceneSeed, "style") * 4)) % patterns.length];
            const ratio = 1 + (pattern * randomness - 1) * options.variation;
            const size = Math.max(4, base * ratio);
            ctx.font = "400 " + size + "px " + options.fontFamily;
            return {
                index, text: word.text, start: word.start, size,
                width: Math.max(1, ctx.measureText(word.text).width),
                height: size * 1.02
            };
        });
        const boxes = compactPlacement(measured, sceneSeed, shortSide,
            clamp(width / height * .90, .85, 2.25));
        const bounds = unionBounds(boxes);
        // Keep a safe area in every aspect ratio, including portrait TikTok.
        const safeWidth = width * .79;
        const safeHeight = height * .63;
        const scale = Math.min(1, safeWidth / Math.max(bounds.width, 1),
            safeHeight / Math.max(bounds.height, 1));
        const scaledWidth = bounds.width * scale;
        const scaledHeight = bounds.height * scale;
        const cx = clamp(width * (.5 + options.positionX), width * .105 + scaledWidth / 2,
            width * .895 - scaledWidth / 2);
        const cy = clamp(height * (.5 + options.verticalPosition), height * .185 + scaledHeight / 2,
            height * .815 - scaledHeight / 2);
        const left = cx - scaledWidth / 2;
        const top = cy - scaledHeight / 2;
        return boxes.map(box => {
            const x = left + (box.x - bounds.left) * scale;
            const y = top + (box.y - bounds.top) * scale;
            const w = box.width * scale;
            const size = box.size * scale;
            return {
                text: box.text, start: box.start,
                size, x: x + w / 2,
                // Alphabetic baseline, approximately 80% from box top.
                y: y + size * .81,
                width: w,
                bounds: {
                    left: x, right: x + w,
                    top: y, bottom: y + box.height * scale
                }
            };
        });
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
        // One entire stanza occupies exactly one canvas composition, regardless
        // of word count. Every word has a fixed position for the whole stanza.
        const sceneSeed = String(seed) + ":" +
            (line.sourceRowId || line.lineIndex || line.displayStart || line.text || "") +
            ":stanza";
        const layout = measureScene(ctx, words, width, height, options, sceneSeed);
        // Instant, opaque reveal at each word's timestamp. No fade, scale pulse,
        // opacity transition or repeated whole-frame flash for rapid lyrics.
        const revealed = layout.filter(node => time >= node.start);
        return {
            groups: [{ nodes: revealed, alpha: 1, translateY: 0 }],
            activeIndex: active,
            activeWord: words[active].text,
            sceneIndex: 0
        };
    }
    // Keep the latest words from previous lyric lines: short LRC lines still form
    // a complete composition instead of returning to a one-word slide.
    function buildTimelineFrame(ctx, timeline, time, width, height, style, seed = 1337) {
        if (!Array.isArray(timeline)) return { groups: [], activeIndex: -1 };
        const activeLine = timeline.find(line => time >= line.displayStart && time < line.displayEnd);
        if (!activeLine || !String(activeLine.text || "").trim()) return { groups: [], activeIndex: -1 };
        const stream = timeline
            .filter(line => String(line.text || "").trim())
            .flatMap(getWords)
            .sort((a, b) => a.start - b.start);
        return buildFrame(ctx, { sourceRowId: "kinetic-stream", timedWords: stream },
            time, width, height, style, seed);
    }
    return { buildFrame, buildTimelineFrame, getWords, normalize, rowCounts };
});
