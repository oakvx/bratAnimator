const test = require("node:test");
const assert = require("node:assert/strict");
const kinetic = require("../assets/js/kinetic.js");

function canvasContext() {
    return {
        font: "12px Arial",
        measureText(text) {
            const size = Number(this.font.match(/([\d.]+)px/)?.[1] || 12);
            return { width: Array.from(text).reduce((sum, char) =>
                sum + size * (char === " " ? 0.3 : 0.55), 0) };
        }
    };
}
const style = { fontFamily: "Arial, sans-serif", fontScale: 1,
    kineticWords: 6, kineticVariation: 72, kineticMotion: 55 };

function line(text, start, end, index) {
    const parts = text.split(/\s+/);
    return {
        sourceRowId: "line-" + index, lineIndex: index,
        text, displayStart: start, displayEnd: end,
        vocalEnd: end - 0.1,
        timedWords: parts.map((word, i) => ({
            text: word, start: start + i * ((end - start) / parts.length),
            end: start + (i + 1) * ((end - start) / parts.length)
        }))
    };
}
const timeline = [
    line("name and world", 0, 3, 0),
    line("say them make our", 3, 7, 1),
    line("sleeping wake up you're", 7, 11, 2)
];

test("kinetic collage renders timed words in order and carries previous lines", () => {
    const ctx = canvasContext();
    const frame = kinetic.buildTimelineFrame(ctx, timeline, 4.4, 710, 400, style, 123);
    const words = frame.groups.at(-1).nodes.map(node => node.text);
    assert.deepEqual(words, ["name", "and", "world", "say", "them"]);
    assert.equal(frame.activeWord, "them");
    assert.equal(frame.groups.length, 1);
});

test("composition is deterministic for random seeks and the export canvas", () => {
    const ctx = canvasContext();
    const a = kinetic.buildTimelineFrame(ctx, timeline, 5.62, 1080, 1920, style, 1234);
    const b = kinetic.buildTimelineFrame(ctx, timeline, 5.62, 1080, 1920, style, 1234);
    assert.deepEqual(a, b);
    assert.notDeepEqual(a, kinetic.buildTimelineFrame(ctx, timeline, 5.62, 1080, 1920, style, 1235));
});

test("a whole stanza fits in one composition, even beyond six words", () => {
    const ctx = canvasContext();
    const frame = kinetic.buildTimelineFrame(ctx, timeline, 10.9, 1080, 1080, style, 321);
    const nodes = frame.groups.at(-1).nodes;
    assert.equal(nodes.length, 11);
    assert.equal(frame.sceneIndex, 0);
    assert.ok(new Set(nodes.map(node => Math.round(node.size))).size > 1);
    assert.equal(nodes.at(-1).text, "you're");
});

test("words stay completely opaque and never cross-fade or flash", () => {
    const ctx = canvasContext();
    for (const seconds of [0.01, 1.01, 2.01, 3.01, 3.06, 3.10, 3.4, 4.1, 4.4, 5.3, 6.2, 7.3, 8.1, 10.9]) {
        const frame = kinetic.buildTimelineFrame(ctx, timeline, seconds, 1080, 1080, style, 1);
        assert.equal(frame.groups.length, 1, "one stable opaque composition");
        assert.equal(frame.groups[0].alpha, 1, "no text opacity transitions");
        assert.equal(frame.groups[0].translateY, 0, "no motion blur induced by bouncing frames");
    }
});

test("existing words keep exactly the same position when new words appear in a scene", () => {
    const ctx = canvasContext();
    const prev = kinetic.buildTimelineFrame(ctx, timeline, 3.1, 710, 400, style, 77);
    const next = kinetic.buildTimelineFrame(ctx, timeline, 4.4, 710, 400, style, 77);
    const left = prev.groups[0].nodes;
    const right = next.groups[0].nodes;
    assert.equal(right.length, left.length + 1);
    for (let i = 0; i < left.length; i++) assert.deepEqual(right[i], left[i],
        "No recomposition of existing word '" + left[i].text + "'");
});

test("word boxes form a non-overlapping compact cluster rather than uniform aligned rows", () => {
    const ctx = canvasContext();
    for (const [width,height] of [[710,400],[1080,1080],[1080,1920],[1920,1080]]) {
        const frame = kinetic.buildTimelineFrame(ctx, timeline, 5.9, width, height, style, 42);
        const nodes = frame.groups[0].nodes;
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i].bounds;
            assert.ok(a.left >= width * .09 && a.right <= width * .91, "horizontal margin");
            assert.ok(a.top >= height * .17 && a.bottom <= height * .83, "vertical margin");
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j].bounds;
                const overlap = a.left < b.right - .2 && a.right > b.left + .2
                    && a.top < b.bottom - .2 && a.bottom > b.top + .2;
                assert.equal(overlap, false, "word boxes cannot overlap");
            }
        }
        assert.ok(new Set(nodes.map(n => Math.round(n.bounds.top))).size >= 2,
            "organic staggered composition requires at least two baselines");
    }
});

test("geometry stays inside the canvas for portrait, square and landscape", () => {
    const ctx = canvasContext();
    const aspectRatios = [[710,400], [1080,1080], [1080,1920], [1920,1080], [3000,3000]];
    const variants = [
        style,
        { ...style, kineticWords: 9, kineticVariation: 100, fontScale: 2 },
        { ...style, kineticWords: 2, kineticVariation: 0, fontScale: 0.1 }
    ];
    for (const [width,height] of aspectRatios) {
        for (const settings of variants) {
            const frame = kinetic.buildTimelineFrame(ctx, timeline, 10.1, width, height, settings, 987);
            for (const group of frame.groups) {
                for (const word of group.nodes) {
                    assert.ok(Number.isFinite(word.x) && Number.isFinite(word.y));
                    assert.ok(word.x - word.width / 2 >= width * 0.05, "word left bound");
                    assert.ok(word.x + word.width / 2 <= width * 0.95, "word right bound");
                    assert.ok(word.y - word.size > 0, "word top bound");
                    assert.ok(word.y + word.size * 0.35 < height, "word bottom bound");
                }
            }
        }
    }
});

test("empty instrumental lines and gaps do not keep stray text", () => {
    const ctx = canvasContext();
    const rest = { text:"", displayStart:7, displayEnd:9, timedWords:[] };
    const scene = [timeline[0], { ...rest }];
    assert.equal(kinetic.buildTimelineFrame(ctx, scene, 8, 1080, 1080, style).groups.length, 0);
    assert.equal(kinetic.buildTimelineFrame(ctx, scene, 15, 1080, 1080, style).groups.length, 0);
    assert.equal(kinetic.buildTimelineFrame(ctx, scene, -1, 1080, 1080, style).groups.length, 0);
});

test("settings are bounded and missing word-timing has a deterministic fallback", () => {
    assert.deepEqual(
        [kinetic.normalize({ kineticWords: 200 }).maxWords,
         kinetic.normalize({ kineticWords: -8 }).maxWords,
         kinetic.normalize({ kineticVariation: 800 }).variation],
        [9,2,1]
    );
    const ctx = canvasContext();
    const frame = kinetic.buildFrame(ctx, {
        text:"this is a lyric", displayStart:0, vocalEnd:4, timedWords:[]
    }, 3.5, 710, 400, style);
    assert.equal(frame.activeWord, "lyric");
});

test("explicit stanza boundary clears the previous canvas immediately", () => {
    const ctx = canvasContext();
    const verses = [
        { ...line("three fast words", 0, 1.5, 0), stanzaIndex: 0 },
        { ...line("plus four more words", 1.5, 3.5, 1), stanzaIndex: 0 },
        { ...line("fresh second verse", 3.5, 5.5, 2), stanzaIndex: 1 }
    ];
    const before = kinetic.buildTimelineFrame(ctx, verses, 3.3, 1080, 1920, style, 12);
    assert.ok(before.groups[0].nodes.some(node => node.text === "three"));
    const after = kinetic.buildTimelineFrame(ctx, verses, 3.51, 1080, 1920, style, 12);
    assert.deepEqual(after.groups[0].nodes.map(node => node.text), ["fresh"]);
    assert.ok(!after.groups[0].nodes.some(node => node.text === "three"));
    assert.equal(after.groups[0].alpha, 1);
});

test("long vocal pause starts a fresh stanza for imported lyrics without separators", () => {
    const ctx = canvasContext();
    const verses = [line("first part", 0, 2, 0), line("second part", 7, 9, 1)];
    const a = kinetic.buildTimelineFrame(ctx, verses, 1.8, 710, 400, style);
    const b = kinetic.buildTimelineFrame(ctx, verses, 7.1, 710, 400, style);
    assert.deepEqual(a.groups[0].nodes.map(n => n.text), ["first", "part"]);
    assert.deepEqual(b.groups[0].nodes.map(n => n.text), ["second"]);
    assert.equal(kinetic.buildTimelineFrame(ctx, verses, 5, 710, 400, style).groups.length, 0);
});

test("rapid rap words reveal at exact timestamps without fade, scale or whole-frame opacity changes", () => {
    const ctx = canvasContext();
    const words = Array.from({ length: 28 }, (_, i) => "flow" + i);
    const fast = [{ ...line(words.join(" "), 0, 1.4, 0), stanzaIndex: 0 }];
    const start = kinetic.buildTimelineFrame(ctx, fast, 0.01, 1080, 1920, style, 35);
    const mid = kinetic.buildTimelineFrame(ctx, fast, 0.73, 1080, 1920, style, 35);
    const end = kinetic.buildTimelineFrame(ctx, fast, 1.35, 1080, 1920, style, 35);
    assert.equal(start.groups[0].nodes.length, 1);
    assert.equal(mid.groups[0].nodes.length, 15);
    assert.equal(end.groups[0].nodes.length, words.length);
    for (const frame of [start, mid, end]) {
        assert.equal(frame.groups.length, 1);
        assert.equal(frame.groups[0].alpha, 1);
        assert.equal(frame.groups[0].translateY, 0);
        assert.ok(frame.groups[0].nodes.every(node => !("opacity" in node) && !("scale" in node)));
    }
    for (let i = 0; i < mid.groups[0].nodes.length; i += 1)
        assert.deepEqual(mid.groups[0].nodes[i], end.groups[0].nodes[i]);
});
