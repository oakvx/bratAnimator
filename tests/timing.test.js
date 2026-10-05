const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../assets/js/core.js");
const timing = require("../assets/js/timing.js");

const timeline = (text, zero = false, audio = null) => timing.buildTimeline(core.parseLRC(text, zero), audio);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
function audioBuffer(channels, sampleRate = 1000) {
    return { numberOfChannels: channels.length, sampleRate, length: channels[0].length,
        duration: channels[0].length / sampleRate, getChannelData: index => channels[index] };
}

test("text weighting accounts for punctuation and estimated syllables", () => {
    assert.ok(timing.wordWeight("hello!") > timing.wordWeight("hello"));
    assert.ok(timing.wordWeight("extraordinary") > timing.wordWeight("cat"));
    assert.equal(timing.tokenize("don't stop").filter(token => !token.isSpace).length, 2);
});

test("graphemes preserve combining marks and joined emoji", () => {
    assert.deepEqual(timing.graphemes("e\u0301👩‍💻!").map(item => item.char), ["e\u0301", "👩‍💻", "!"]);
    const [line] = timeline("[00:00] e\u0301 👩‍💻!");
    assert.deepEqual(line.chars.map(char => char.char), ["e\u0301", "👩‍💻", "!"]);
    const source = Array.from(line.text);
    line.chars.forEach(char => assert.equal(source.slice(char.startChar, char.endChar + 1).join(""), char.char));
});

test("CJK text without spaces has multiple words and valid indices", () => {
    const tokens = timing.tokenize("你好世界。再见！");
    assert.ok(tokens.length > 1);
    assert.equal(tokens.map(token => token.text).join(""), "你好世界。再见！");
    tokens.forEach(token => assert.equal(Array.from("你好世界。再见！").slice(token.startChar, token.endChar + 1).join(""), token.text));
});

test("closely spaced lines never overlap or get a forced minimum length", () => {
    const lines = timeline("[00:01.00] one two three\n[00:01.08] next\n[00:01.12] last");
    close(lines[0].displayEnd, 1.08);
    close(lines[1].displayEnd, 1.12);
    assert.ok(lines[0].analysis.warnings.some(warning => warning.includes("Dense")));
    lines.slice(0, -1).forEach((line, index) => assert.ok(line.chars.every(char => char.timestamp < lines[index + 1].timestamp)));
});

test("word and character schedules are monotonic and span the line", () => {
    const [line] = timeline("[00:00] Don't stop, dancing now!\n[00:08] next");
    close(line.timedWords[0].start, 0);
    close(line.timedWords.at(-1).end, 8);
    assert.ok(line.chars.at(-1).timestamp > 6);
    line.timedWords.forEach((word, index) => {
        assert.ok(word.start <= word.end);
        if (index) close(word.start, line.timedWords[index - 1].end);
    });
    line.chars.forEach((char, index) => assert.ok(!index || char.timestamp >= line.chars[index - 1].timestamp));
});

test("Enhanced LRC exact anchors support multi-word segments and a terminal timestamp", () => {
    const [line] = timeline("[00:10] <00:10.20>Hello beautiful <00:12.00>world<00:13.50>");
    close(line.timedWords[0].start, 10.2);
    assert.ok(line.timedWords[1].start > 10.2 && line.timedWords[1].start < 12);
    close(line.timedWords[2].start, 12);
    close(line.chars.find(char => char.wordIndex === 2).timestamp, 12);
    close(line.displayEnd, 13.5);
    assert.equal(line.analysis.timingSource, "enhanced");
    assert.deepEqual(line.analysis.warnings, []);
});

test("repeated line timestamps shift Enhanced LRC word and end times", () => {
    const lines = timeline("[00:10][00:20] <00:10.20>hello <00:11.00>world<00:12.00>");
    close(lines[1].timedWords[0].start, 20.2);
    close(lines[1].timedWords[1].start, 21);
    close(lines[1].displayEnd, 22);
});

test("offset applies to the whole file, even when metadata comes last", () => {
    const [line] = timeline("[00:10] <00:10.10>hello<00:11.00>\n[offset:500]");
    close(line.timestamp, 10.5);
    close(line.timedWords[0].start, 10.6);
    close(line.displayEnd, 11.5);
});

test("start from zero normalizes lines, words, boundaries and preserves source time", () => {
    const [line] = timeline("[00:10] <00:10.50>hello\n[00:12]\n[00:14] next", true);
    close(line.sourceTimestamp, 10);
    close(line.timestamp, 0);
    close(line.timedWords[0].start, 0.5);
    close(line.displayEnd, 2);
    close(timeline("[00:10] hello")[0].timestamp, 10);
});

test("empty timestamp rows create instrumental gaps, not drawable lyrics", () => {
    const lines = timeline("[00:01] hello\n[00:03]\n[00:06] again");
    assert.equal(lines.length, 2);
    close(lines[0].displayEnd, 3);
    close(lines[1].displayStart, 6);
});

test("malformed word timestamps are bounded and reported", () => {
    const [line] = timeline("[00:01] <00:03>hello <00:02>world\n[00:04] next");
    close(line.timedWords[1].start, 3);
    assert.ok(line.analysis.warnings.length);
    assert.ok(line.chars.every(char => Number.isFinite(char.timestamp) && char.timestamp >= 1 && char.timestamp <= 4));
});

test("vocal-role prefixes do not break Enhanced word alignment", () => {
    const [line] = timeline("[00:01] <00:01.20>(bg) hello <00:02>world");
    assert.equal(line.role, "background");
    close(line.timedWords[0].start, 1.2);
    assert.deepEqual(line.analysis.warnings, []);
});

test("audio energy cannot cancel antiphase stereo channels", () => {
    const positive = new Float32Array(1000).fill(0.5);
    const negative = new Float32Array(1000).fill(-0.5);
    const mono = timing.analyzeAudioEnergy(audioBuffer([positive]));
    const stereo = timing.analyzeAudioEnergy(audioBuffer([positive, negative]));
    close(stereo.highRms, mono.highRms);
    close(stereo.highRms, 0.5);
});

test("silent and constant-energy audio safely fall back to text estimates", () => {
    for (const amplitude of [0, 0.5]) {
        const audio = timing.analyzeAudioEnergy(audioBuffer([new Float32Array(3000).fill(amplitude)]));
        assert.equal(audio.usable, false);
        const [line] = timeline("[00:00] hello world", false, audio);
        assert.equal(line.analysis.timingSource, "estimated");
        assert.ok(line.chars.every(char => Number.isFinite(char.timestamp)));
    }
});

test("audio nudges estimated words but never explicit timestamps", () => {
    const samples = Float32Array.from({ length: 5000 }, (_, index) => index % 1000 < 800 ? 0.7 : 0.02);
    const audio = timing.analyzeAudioEnergy(audioBuffer([samples]));
    assert.equal(audio.usable, true);
    const [line] = timeline("[00:00] <00:00.20>one two <00:02.00>three four<00:04.00>", false, audio);
    close(line.timedWords[0].start, 0.2);
    close(line.timedWords[2].start, 2);
    close(line.displayEnd, 4);
    line.timedWords.forEach(word => assert.ok(word.start <= word.end && word.start >= 0.2 && word.end <= 4));
});

test("audio guidance addresses source time after timeline normalization", () => {
    const frames = Array.from({ length: 200 }, (_, index) => ({ time: index * 0.1, rms: index === 110 ? 0 : 1 }));
    const audio = { duration: 20, frames, frameDuration: 0.1, lowRms: 0, highRms: 1, usable: true };
    const normal = timeline("[00:10] one two\n[00:12] next", false, audio)[0];
    const shifted = timeline("[00:10] one two\n[00:12] next", true, audio)[0];
    normal.timedWords.forEach((word, index) => close(word.start - 10, shifted.timedWords[index].start));
});

test("invalid seconds are not accepted as a valid timestamp", () => {
    assert.equal(core.parseLRC("[00:99] invalid").length, 0);
});

test("cached timed tokens reconstruct original spacing", () => {
    const [line] = timeline("[00:00] one  two!");
    assert.equal(timing.getTimedWordTokens(line).map(token => token.text).join(""), line.text);
    assert.equal(timing.getTimedWordTokens(line), line.timedTokens);
});

test("normalizing and shifting editable rows preserve Enhanced timings and empty boundaries", () => {
    const input = "[00:10] <00:10.20>Hello <00:11.00>world<00:12.00>\n[00:13]\n[00:15] next";
    const rows = core.lrcToRows(input);
    assert.equal(rows[1].text, "");
    const normalized = core.rowsToLrc(rows);
    close(timeline(normalized)[0].timedWords[1].start, 11);
    close(timeline(normalized)[0].displayEnd, 12);
    const shifted = timeline(core.rowsToLrc(core.shiftRows(rows, 2)));
    close(shifted[0].timedWords[0].start, 12.2);
    close(shifted[0].displayEnd, 14);
    assert.match(core.rowsToLrc(core.shiftRows(rows, 2)), /\[00:15.00\]\n/);
});

test("editable repeated Enhanced rows preserve their relative word timings", () => {
    const normalized = core.rowsToLrc(core.lrcToRows("[00:10][00:20] <00:10.20>hello<00:12.00>"));
    const lines = timeline(normalized);
    close(lines[1].timedWords[0].start, 20.2);
    close(lines[1].displayEnd, 22);
});

test("edited text drops stale word anchors instead of assigning them to unrelated words", () => {
    const rows = core.lrcToRows("[00:10] <00:10.20>hello <00:11>world");
    rows[0].text = "different lyrics";
    assert.equal(core.parseLRC(core.rowsToLrc(rows))[0].wordTimings.length, 0);
});

test("timestamp rounding carries correctly into the next minute", () => {
    assert.equal(core.secondsToTag(59.999), "[01:00.00]");
    assert.equal(core.parseLRC(`${core.secondsToTag(59.999)} hello`)[0].timestamp, 60);
});

test("word timestamp precision survives normalization and shifting", () => {
    const rows = core.lrcToRows("[00:10] <00:10.123>hello<00:11.456>");
    close(timeline(core.rowsToLrc(rows))[0].timedWords[0].start, 10.123);
    const [shifted] = timeline(core.rowsToLrc(core.shiftRows(rows, 0.1)));
    close(shifted.timedWords[0].start, 10.223);
    close(shifted.displayEnd, 11.556);
});
