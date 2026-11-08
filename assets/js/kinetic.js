/* Kinetic collage: every word of the current lyric phrase is retained and
   revealed at its own timestamp. Layout is seeded, collision-aware, and shared
   by preview and exports. No DOM overlays, network access or randomness. */
(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratKinetic = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    "use strict";
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
    const finite = (n, fallback) => Number.isFinite(Number(n)) ? Number(n) : fallback;
    const cache = new Map();
    function hash(source) {
        let h = 2166136261;
        for (const c of String(source)) {
            h ^= c.codePointAt(0);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }
    function noise(seed, salt) {
        let n = hash(String(seed) + ":" + salt) + 0x6D2B79F5 | 0;
        n = Math.imul(n ^ n >>> 15, n | 1);
        n ^= n + Math.imul(n ^ n >>> 7, n | 61);
        return ((n ^ n >>> 14) >>> 0) / 4294967296;
    }
    function normalize(style) {
        return {
            lines: clamp(Math.round(finite(style?.kineticLines, 2)), 1, 4),
            spacing: clamp(finite(style?.kineticSpacing, 55), 0, 100),
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
        const clean = native.filter(word => String(word.text || "").trim() && Number.isFinite(word.start));
        if (clean.length) return clean.map(word => ({
            text: String(word.text).trim(),
            start: word.start, end: Number.isFinite(word.end) ? word.end : word.start + 0.3
        }));
        const pieces = String(line.text || "").match(/\S+/gu) || [];
        const start = finite(line.displayStart, 0);
        const duration = Math.max(0.1, finite(line.vocalEnd, start + 2) - start);
        return pieces.map((text, index) => ({
            text, start: start + duration * index / pieces.length,
            end: start + duration * (index + 1) / pieces.length
        }));
    }
    function contains(outer, inner) {
        const epsilon = 0.000001;
        return inner.x >= outer.x - epsilon && inner.y >= outer.y - epsilon &&
            inner.x + inner.width <= outer.x + outer.width + epsilon &&
            inner.y + inner.height <= outer.y + outer.height + epsilon;
    }
    function intersect(a, b) {
        return a.x < b.x + b.width - 0.000001 &&
            a.x + a.width > b.x + 0.000001 &&
            a.y < b.y + b.height - 0.000001 &&
            a.y + a.height > b.y + 0.000001;
    }
    // MaxRects-style free-space splitting: each new rectangle fits in an
    // existing hole and subtracts its occupied area before the next placement.
    function subtract(free, used) {
        if (!intersect(free, used)) return [free];
        const result = [];
        const right = free.x + free.width;
        const bottom = free.y + free.height;
        const usedRight = used.x + used.width;
        const usedBottom = used.y + used.height;
        if (used.x > free.x) result.push({ x: free.x, y: free.y,
            width: used.x - free.x, height: free.height });
        if (usedRight < right) result.push({ x: usedRight, y: free.y,
            width: right - usedRight, height: free.height });
        if (used.y > free.y) result.push({ x: free.x, y: free.y,
            width: free.width, height: used.y - free.y });
        if (usedBottom < bottom) result.push({ x: free.x, y: usedBottom,
            width: free.width, height: bottom - usedBottom });
        return result.filter(box => box.width > 0.001 && box.height > 0.001);
    }
    function prune(free) {
        const unique = [];
        for (let i = 0; i < free.length; i += 1) {
            if (free.some((other, index) => index !== i &&
                contains(other, free[i]) &&
                (!contains(free[i], other) || index < i))) continue;
            unique.push(free[i]);
        }
        return unique;
    }
    function fitBoxes(ctx, words, width, height, options, seed, scale) {
        const shortest = Math.min(width, height);
        const space = shortest * (0.005 + options.spacing * 0.00026) * Math.max(0.015, scale);
        const base = Math.min(width * 0.145, height * 0.245) * options.fontScale * scale;
        const safeWidth = width * 0.82;
        const safeHeight = height * 0.68;
        const left = clamp(width * (0.5 + options.positionX * 0.3) - safeWidth / 2,
            width * 0.04, width * 0.96 - safeWidth);
        const top = clamp(height * (0.5 + options.verticalPosition * 0.3) - safeHeight / 2,
            height * 0.04, height * 0.96 - safeHeight);
        let holes = [{ x: left, y: top, width: safeWidth, height: safeHeight }];
        const pattern = [1.34, 0.61, 1.07, 0.71, 1.42, 0.53, 1.17, 0.85, 1.26, 0.62];
        const measured = words.map((word, index) => {
            const patternIndex = (index + Math.floor(noise(seed, "pattern") * pattern.length)) % pattern.length;
            const factor = pattern[patternIndex] * (0.82 + noise(seed, index + ":" + word.text) * 0.36);
            const size = Math.max(0.05, base * (1 + (factor - 1) * options.variation));
            ctx.font = "400 " + size + "px " + options.fontFamily;
            const widthText = Math.max(0.01, ctx.measureText(word.text).width);
            return {
                ...word, index, size, width: widthText,
                widthBox: widthText + space * 2,
                heightBox: size * 1.13 + space * 2
            };
        });
        // Larger words claim space first. Rendering order still follows LRC time.
        const order = [...measured].sort((a, b) =>
            b.widthBox * b.heightBox - a.widthBox * a.heightBox || a.index - b.index);
        const placed = new Array(words.length);
        for (const word of order) {
            let best = null;
            for (let holeIndex = 0; holeIndex < holes.length; holeIndex += 1) {
                const hole = holes[holeIndex];
                if (hole.width + 0.000001 < word.widthBox ||
                    hole.height + 0.000001 < word.heightBox) continue;
                const freeX = hole.width - word.widthBox;
                const freeY = hole.height - word.heightBox;
                for (let corner = 0; corner < 4; corner += 1) {
                    const x = hole.x + ((corner & 1) ? freeX : 0);
                    const y = hole.y + ((corner & 2) ? freeY : 0);
                    const random = noise(seed, word.index + ":" + holeIndex + ":" + corner);
                    // Favor a tight fit while allowing the seeded corner choice
                    // to scatter words into distinct empty regions.
                    const score = Math.min(freeX, freeY) / shortest * 50 +
                        freeX * freeY / (safeWidth * safeHeight) * 30 +
                        random * 26;
                    if (!best || score < best.score) best = {
                        x, y, width: word.widthBox, height: word.heightBox, score
                    };
                }
            }
            if (!best) return null;
            const bounds = { x: best.x, y: best.y, width: best.width, height: best.height };
            placed[word.index] = {
                text: word.text, start: word.start, size: word.size, width: word.width,
                x: bounds.x + space + word.width / 2,
                y: bounds.y + space + word.size * 0.84,
                bounds
            };
            holes = prune(holes.flatMap(hole => subtract(hole, bounds)));
        }
        return placed;
    }
    function layout(ctx, words, width, height, options, seed) {
        const key = JSON.stringify([words.map(word => [word.text, word.start]), width, height, options, seed]);
        if (cache.has(key)) return cache.get(key);
        // Fit the complete phrase before revealing its first word. All subsequent
        // words therefore occupy stable, non-overlapping positions without jumps.
        let best = fitBoxes(ctx, words, width, height, options, seed, 1);
        if (!best) {
            let low = 0.0001;
            let high = 1;
            best = fitBoxes(ctx, words, width, height, options, seed, low);
            if (!best) return [];
            for (let pass = 0; pass < 15; pass += 1) {
                const mid = (low + high) / 2;
                const attempt = fitBoxes(ctx, words, width, height, options, seed, mid);
                if (attempt) { best = attempt; low = mid; }
                else high = mid;
            }
        }
        if (cache.size >= 128) cache.delete(cache.keys().next().value);
        cache.set(key, best);
        return best;
    }
    function buildFrame(ctx, line, time, width, height, style, seed = 1337) {
        if (!ctx || !(width > 0) || !(height > 0) || !line)
            return { groups: [], activeIndex: -1 };
        const words = getWords(line);
        if (!words.length) return { groups: [], activeIndex: -1 };
        const options = normalize(style);
        const phraseSeed = String(seed) + ":" +
            (line.sourceRowId ?? line.lineIndex ?? line.displayStart ?? line.text ?? "");
        const allNodes = layout(ctx, words, width, height, options, phraseSeed);
        const entranceDuration = 0.43 - options.motion * 0.28;
        const visible = [];
        let activeIndex = -1;
        for (let index = 0; index < allNodes.length; index += 1) {
            if (time < words[index].start) continue;
            activeIndex = index;
            const progress = clamp((time - words[index].start) / entranceDuration, 0, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            visible.push({
                ...allNodes[index],
                alpha: progress,
                scale: 0.87 + ease * 0.13,
                offsetY: (1 - ease) * Math.min(width, height) * 0.014
            });
        }
        return {
            groups: visible.length ? [{ nodes: visible, alpha: 1, translateY: 0 }] : [],
            activeIndex, activeWord: activeIndex >= 0 ? words[activeIndex].text : null
        };
    }
    function buildTimelineFrame(ctx, timeline, time, width, height, style, seed = 1337) {
        if (!Array.isArray(timeline)) return { groups: [], activeIndex: -1 };
        const activeIndex = timeline.findIndex(item => time >= item.displayStart && time < item.displayEnd);
        if (activeIndex < 0 || !String(timeline[activeIndex].text || "").trim())
            return { groups: [], activeIndex: -1 };
        const { lines } = normalize(style);
        let scenes = [];
        let current = [];
        let indices = [];
        for (let i = 0; i < timeline.length; i += 1) {
            const line = timeline[i];
            if (!String(line.text || "").trim()) {
                if (current.length) { scenes.push({ lines: current, indices }); current = []; indices = []; }
                continue;
            }
            const previous = current.at(-1);
            const gap = previous
                ? Number(line.displayStart) - finite(previous.vocalEnd, previous.displayEnd)
                : 0;
            if (current.length && (current.length >= lines || gap > 0.85)) {
                scenes.push({ lines: current, indices });
                current = []; indices = [];
            }
            current.push(line);
            indices.push(i);
        }
        if (current.length) scenes.push({ lines: current, indices });
        const scene = scenes.find(item => item.indices.includes(activeIndex));
        if (!scene) return { groups: [], activeIndex: -1 };
        const first = scene.lines[0];
        const last = scene.lines.at(-1);
        const groupedLine = {
            sourceRowId: "scene:" + scene.indices[0] + ":" +
                (first.sourceRowId ?? first.displayStart),
            displayStart: first.displayStart, displayEnd: last.displayEnd,
            timedWords: scene.lines.flatMap(getWords)
        };
        // Every word of the complete scene is fitted once. Words remain visible
        // until the next scene, even if the active LRC row changes.
        return buildFrame(ctx, groupedLine, time, width, height, style, seed);
    }
    return { buildFrame, buildTimelineFrame, getWords, normalize, fitBoxes, clearCache: () => cache.clear() };
});
