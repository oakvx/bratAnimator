const test = require("node:test");
const assert = require("node:assert/strict");
const motion = require("../assets/js/motion.js");

function context(nativeSpacing = false) {
    const stack = [];
    const ctx = {
        font: "10px sans-serif",
        save() { stack.push({ font: this.font, letterSpacing: this.letterSpacing }); },
        restore() { Object.assign(this, stack.pop()); },
        measureText(text) {
            const size = Number(this.font.match(/([\d.]+)px/)?.[1]) || 10;
            const characters = Array.from(text);
            return {
                width: characters.reduce((sum, char) => sum + (char === " " ? 0.3 : 0.57) * size, 0) + (nativeSpacing ? Math.max(0, characters.length - 1) * (parseFloat(this.letterSpacing) || 0) : 0),
                actualBoundingBoxAscent: size * 0.78,
                actualBoundingBoxDescent: size * 0.21
            };
        }
    };
    if (nativeSpacing) ctx.letterSpacing = "0px";
    return ctx;
}

function withinSafeArea(layout, width, height) {
    const tolerance = 0.01;
    for (const bounds of [layout.totalBounds, ...layout.rows.map(row => row.maxBounds)]) {
        assert.ok(bounds.x >= width * 0.05 - tolerance, `left ${bounds.x}`);
        assert.ok(bounds.y >= height * 0.05 - tolerance, `top ${bounds.y}`);
        assert.ok(bounds.x + bounds.width <= width * 0.95 + tolerance, `right ${bounds.x + bounds.width}`);
        assert.ok(bounds.y + bounds.height <= height * 0.95 + tolerance, `bottom ${bounds.y + bounds.height}`);
    }
    for (let index = 1; index < layout.rows.length; index += 1) {
        const previous = layout.rows[index - 1].maxBounds;
        assert.ok(previous.y + previous.height < layout.rows[index].maxBounds.y);
    }
}

test("seeded angles are deterministic, row-specific, and bounded in radians", () => {
    const angles = Array.from({ length: 12 }, (_, index) => motion.seededAngle(789, "phrase-1", index, 15));
    assert.deepEqual(angles, Array.from({ length: 12 }, (_, index) => motion.seededAngle(789, "phrase-1", index, 15)));
    assert.ok(angles.every(angle => Math.abs(angle) <= Math.PI / 12));
    assert.equal(new Set(angles).size, angles.length);
    assert.notEqual(angles[0], motion.seededAngle(790, "phrase-1", 0, 15));
    assert.notEqual(angles[0], motion.seededAngle(789, "phrase-2", 0, 15));
    assert.notEqual(angles[0], motion.seededAngle(789, "phrase-1", 0, 15, 1));
});

test("full-phrase layout is repeatable and has no render-time randomness", () => {
    const ctx = context();
    const style = { entrance: { mode: "elastic", angle: 15, randomAngles: true } };
    const options = { seed: 24, lineId: "line-a" };
    const originalRandom = Math.random;
    Math.random = () => { throw new Error("Rendering must not draw randomness"); };
    try {
        const first = motion.createLayout(ctx, "one two three four five six seven eight nine", 360, 640, style, options);
        assert.deepEqual(first, motion.createLayout(ctx, "one two three four five six seven eight nine", 360, 640, style, options));
        assert.ok(first.rows.length > 1);
        assert.ok(first.rows.every(row => Math.abs(row.angle) > 0));
        withinSafeArea(first, 360, 640);
    } finally {
        Math.random = originalRandom;
    }
});

test("default layout has horizontal rows and preserves measuring context", () => {
    const ctx = context(true);
    ctx.font = "27px Georgia";
    ctx.letterSpacing = "2px";
    const layout = motion.createLayout(ctx, "a long ordinary phrase", 400, 400);
    assert.ok(layout.rows.every(row => row.angle === 0));
    assert.equal(ctx.font, "27px Georgia");
    assert.equal(ctx.letterSpacing, "2px");
});

test("10% font remains proportional with identical wrapping", () => {
    const ctx = context();
    const text = "this phrase wraps in more than one visual row";
    const normal = motion.createLayout(ctx, text, 600, 600);
    const tiny = motion.createLayout(ctx, text, 600, 600, { fontScale: 0.1 });
    assert.deepEqual(tiny.rows.map(row => row.text), normal.rows.map(row => row.text));
    assert.ok(Math.abs(tiny.fontSize / normal.fontSize - 0.1) < 0.00001);
    assert.equal(motion.createLayout(ctx, text, 600, 600, { fontScale: 0.001 }).fontSize, tiny.fontSize);
    assert.ok(tiny.fontSize < 10);
});

test("200% text, every rotated row, translation and musical overshoot fit safely", () => {
    for (const [width, height] of [[320, 320], [390, 844], [1600, 900], [180, 80]]) {
        const layout = motion.createLayout(context(), "Very long original phrase that has many visual lines and should never overlap after rotation", width, height, {
            fontScale: 2, stretch: 1.3, stretchY: 1.3, letterSpacing: 3,
            positionX: 0.98, verticalPosition: -0.3,
            entrance: { mode: "elastic", randomAngles: true, angle: 15, intensity: 0.3 }
        }, {
            seed: "repeatable", lineId: "long-line", beatPulseMax: 0.1,
            translation: { text: "Questa è la traduzione che deve restare orizzontale e leggibile", fontScale: 0.6 }
        });
        withinSafeArea(layout, width, height);
        assert.ok(layout.translationRows.length > 0);
        assert.ok(layout.translationRows.every(row => row.angle === 0));
        assert.ok(layout.translationBounds.y >= layout.bounds.y + layout.bounds.height);
        assert.ok(layout.translationRows.every(row => row.y >= layout.translationBounds.y && row.y <= layout.translationBounds.y + layout.translationBounds.height));
    }
});

test("maximum geometry contains every entrance frame without row overlap", () => {
    const entrance = { mode: "elastic", randomAngles: true, angle: 15, intensity: 0.3, duration: 800 };
    const layout = motion.createLayout(context(), "Stretching words on several visible rows is useful", 390, 390, { entrance, stretch: 1.2, stretchY: 1.3 }, { seed: 718, lineId: "a", beatPulseMax: 0.1 });
    for (const row of layout.rows) {
        for (let time = 0; time <= 1; time += 0.01) {
            const transform = motion.getRowTransform(entrance, time, 1, 0, row.angle);
            const width = row.width * layout.stretchX * transform.scaleX * 1.1;
            const height = row.height * layout.stretchY * transform.scaleY * 1.1;
            const boundWidth = Math.abs(Math.cos(row.angle)) * width + Math.abs(Math.sin(row.angle)) * height;
            const boundHeight = Math.abs(Math.sin(row.angle)) * width + Math.abs(Math.cos(row.angle)) * height;
            assert.ok(boundWidth <= row.maxBounds.width + 1e-8);
            assert.ok(boundHeight <= row.maxBounds.height + 1e-8);
        }
    }
});

test("Unicode code-point reveal positions reconstruct rows without breaking graphemes", () => {
    const text = "ciao 👩🏽‍🚀 mondo e\u0301 davvero 漢字かな";
    const layout = motion.createLayout(context(), text, 160, 300);
    const chars = Array.from(text);
    for (const row of layout.rows) {
        assert.equal(chars.slice(row.startChar, row.endChar + 1).join(""), row.text);
        assert.ok(!row.text.startsWith("\u0301"));
        assert.ok(!row.text.endsWith("\u200d"));
    }
    assert.ok(layout.rows.some(row => row.text.includes("👩🏽‍🚀")));
});

test("long unbroken words and explicit line breaks remain safe", () => {
    const layout = motion.createLayout(context(), "supercalifragilisticexpialidocious\nsecond row\n\nlast", 100, 200, {
        entrance: { mode: "stretch-x", intensity: 0.3, randomAngles: true, angle: 15 }
    }, { lineId: "split" });
    assert.ok(layout.rows.length >= 4);
    withinSafeArea(layout, 100, 200);
});

test("native and fallback letter spacing agree without counting spacing twice", () => {
    const style = { fontScale: 1.8, letterSpacing: 9, entrance: { mode: "stretch-x", intensity: 0.3, randomAngles: true } };
    const native = motion.createLayout(context(true), "a few words to measure", 320, 320, style);
    const fallback = motion.createLayout(context(), "a few words to measure", 320, 320, style);
    assert.deepEqual(native.rows.map(row => row.text), fallback.rows.map(row => row.text));
    assert.ok(Math.abs(native.fontSize - fallback.fontSize) < 0.001);
    withinSafeArea(native, 320, 320);
});

test("stretch entrances finish in short phrases and retain the final angle", () => {
    for (const mode of ["stretch-x", "stretch-y", "elastic"]) {
        const entrance = { mode, duration: 800, intensity: 0.3 };
        const first = motion.getRowTransform(entrance, 0, 0.09, 0, 0.11);
        assert.ok(first.scaleX !== 1 || first.scaleY !== 1);
        const settled = motion.getRowTransform(entrance, 0.09, 0.09, 4, 0.11);
        assert.equal(settled.scaleX, 1);
        assert.equal(settled.scaleY, 1);
        assert.equal(settled.rotation, 0.11);
        assert.equal(settled.alpha, 1);
        assert.deepEqual(settled, motion.getRowTransform(entrance, 5, 0.09, 4, 0.11));
    }
});

test("row staggering is bounded and reset/seek reproduces the same transform", () => {
    const entrance = { mode: "elastic", duration: 320 };
    assert.equal(motion.getRowTransform(entrance, 0.01, 2, 1, 0.2).alpha, 0);
    const later = motion.getRowTransform(entrance, 0.1, 0.2, 100, 0.2);
    assert.equal(later.alpha, 1);
    assert.deepEqual(later, motion.getRowTransform(entrance, 0.1, 0.2, 100, 0.2));
    const disabled = motion.getRowTransform({ mode: "none" }, 0, 1, 0, -0.1);
    assert.deepEqual(disabled, { scaleX: 1, scaleY: 1, rotation: -0.1, alpha: 1 });
    assert.deepEqual(motion.getRowTransform(entrance, 0, 0, 0, 0.2), { scaleX: 1, scaleY: 1, rotation: 0.2, alpha: 1 });
});

test("beat analysis handles silence, simple peaks, and 200 ms refractory windows", () => {
    assert.deepEqual(motion.estimateBeats(null), []);
    assert.deepEqual(motion.estimateBeats({ frames: Array.from({ length: 10 }, (_, index) => ({ time: index / 10, rms: 0, onset: 0 })) }), []);
    const frames = Array.from({ length: 151 }, (_, index) => ({ time: index / 100, onset: 0, rms: 0.01 }));
    for (const index of [20, 70, 120]) frames[index].onset = 0.4;
    frames[25].onset = 0.6;
    assert.deepEqual(motion.estimateBeats({ frames }), [0.25, 0.7, 1.2]);
    assert.deepEqual(motion.estimateBeats({ frames, usable: false }), []);
});

test("beat analysis accepts RMS-only input and does not mutate analysis", () => {
    const analysis = { frameDuration: 0.1, frames: [{ rms: 0 }, { rms: 1 }, { rms: 0 }, { rms: 0 }, { rms: 0.8 }, { rms: 0 }] };
    const before = JSON.stringify(analysis);
    assert.deepEqual(motion.estimateBeats(analysis), [0.1, 0.4]);
    assert.equal(JSON.stringify(analysis), before);
});

test("manual beat envelope respects BPM, offset, disabled effects and causal decay", () => {
    const settings = { enabled: true, source: "manual", bpm: 120, offset: 0.25 };
    assert.equal(motion.beatEnvelope(0.2, settings), 0);
    assert.equal(motion.beatEnvelope(0.25, settings), 1);
    assert.equal(motion.beatEnvelope(0.75, settings), 1);
    assert.ok(motion.beatEnvelope(0.3, settings) > 0 && motion.beatEnvelope(0.3, settings) < 1);
    assert.equal(motion.beatEnvelope(0.5, settings), 0);
    assert.equal(motion.beatEnvelope(0.25, { ...settings, enabled: false }), 0);
    assert.equal(motion.beatEnvelope(NaN, settings), 0);
    assert.equal(motion.beatEnvelope(0), 0);
});

test("audio beat envelope uses persisted peaks with identical seek/export results", () => {
    const settings = { enabled: true, source: "audio" };
    const beats = [0.1, 0.44, 0.97];
    assert.equal(motion.beatEnvelope(0, settings, beats), 0);
    assert.equal(motion.beatEnvelope(0.44, settings, beats), 1);
    assert.equal(motion.beatEnvelope(0.7, settings, beats), 0);
    const preview = motion.beatEnvelope(1.02, settings, beats);
    assert.equal(preview, motion.beatEnvelope(1.02, settings, beats));
    assert.equal(preview, motion.beatEnvelope(1.02, settings, beats.map(time => ({ time }))));
    assert.equal(motion.beatEnvelope(0.5, settings, []), 0);
});

test("export range is full by default and treats explicit intervals as half-open", () => {
    assert.deepEqual(motion.resolveExportRange(null, 12), { start: 0, end: 12, duration: 12 });
    assert.deepEqual(motion.resolveExportRange({ enabled: false, start: 5, end: 7 }, 12), { start: 0, end: 12, duration: 12 });
    assert.deepEqual(motion.resolveExportRange({ enabled: true, start: 2.5, end: 7 }, 12), { start: 2.5, end: 7, duration: 4.5 });
    assert.deepEqual(motion.resolveExportRange({ enabled: true, start: 2.5 }, 12), { start: 2.5, end: 12, duration: 9.5 });
});

test("export range rejects zero/negative duration, empty and out-of-bounds intervals", () => {
    for (const total of [0, -1, NaN, Infinity]) assert.throws(() => motion.resolveExportRange(null, total), { code: "export-range-duration" });
    for (const [start, end] of [[2, 2], [3, 2], [-1, 2], [0, 13], [12, 13]]) {
        assert.throws(() => motion.resolveExportRange({ enabled: true, start, end }, 12), { code: "export-range-bounds" });
    }
    assert.throws(() => motion.resolveExportRange({ enabled: true, start: "bad", end: 5 }, 12), { code: "export-range-invalid" });
});
