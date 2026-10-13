const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../assets/js/core.js");
const timing = require("../assets/js/timing.js");

const timeline = (text, zero = false, audio = null, options = {}) => timing.buildTimeline(core.parseLRC(text, zero), audio, options);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const spoken = (text, language) => timing.tokenize(text, language).filter(token => !token.isSpace);
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

test("word and character schedules are monotonic without filling the line slot", () => {
    const [line] = timeline("[00:00] Don't stop, dancing now!\n[00:08] next");
    close(line.timedWords[0].start, 0);
    close(line.slotEnd, 8);
    close(line.vocalEnd, line.timedWords.at(-1).end);
    assert.ok(line.vocalEnd < 3);
    assert.ok(line.chars.at(-1).timestamp < line.vocalEnd);
    line.timedWords.forEach((word, index) => {
        assert.ok(word.start <= word.end);
        if (index) close(word.start, line.timedWords[index - 1].end + line.timedWords[index - 1].pauseDuration);
    });
    line.chars.forEach((char, index) => assert.ok(!index || char.timestamp >= line.chars[index - 1].timestamp));
});

test("Enhanced LRC exact anchors support multi-word segments and a terminal timestamp", () => {
    const [line] = timeline("[00:10] <00:10.20>Hello beautiful <00:12.00>world<00:13.50>");
    close(line.timedWords[0].start, 10.2);
    assert.ok(line.timedWords[1].start > 10.2 && line.timedWords[1].start < 12);
    close(line.timedWords[2].start, 12);
    close(line.chars.find(char => char.wordIndex === 2).timestamp, 12);
    close(line.vocalEnd, 13.5);
    close(line.displayEnd, 14.3);
    assert.equal(line.analysis.timingSource, "enhanced");
    assert.deepEqual(line.analysis.warnings, []);
});

test("repeated line timestamps shift Enhanced LRC word and end times", () => {
    const lines = timeline("[00:10][00:20] <00:10.20>hello <00:11.00>world<00:12.00>");
    close(lines[1].timedWords[0].start, 20.2);
    close(lines[1].timedWords[1].start, 21);
    close(lines[1].vocalEnd, 22);
    close(lines[1].displayEnd, 22.8);
});

test("offset applies to the whole file, even when metadata comes last", () => {
    const [line] = timeline("[00:10] <00:10.10>hello<00:11.00>\n[offset:500]");
    close(line.timestamp, 10.5);
    close(line.timedWords[0].start, 10.6);
    close(line.vocalEnd, 11.5);
    close(line.displayEnd, 12.3);
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
    close(line.vocalEnd, 4);
    close(line.displayEnd, 5);
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
    close(timeline(normalized)[0].vocalEnd, 12);
    close(timeline(normalized)[0].displayEnd, 13);
    const shifted = timeline(core.rowsToLrc(core.shiftRows(rows, 2)));
    close(shifted[0].timedWords[0].start, 12.2);
    close(shifted[0].vocalEnd, 14);
    close(shifted[0].displayEnd, 15);
    assert.match(core.rowsToLrc(core.shiftRows(rows, 2)), /\[00:15.00\]\n/);
});

test("editable repeated Enhanced rows preserve their relative word timings", () => {
    const normalized = core.rowsToLrc(core.lrcToRows("[00:10][00:20] <00:10.20>hello<00:12.00>"));
    const lines = timeline(normalized);
    close(lines[1].timedWords[0].start, 20.2);
    close(lines[1].vocalEnd, 22);
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
    close(shifted.vocalEnd, 11.556);
});

test("a short phrase completes early and holds through the remaining slot", () => {
    const [line, next] = timeline("[00:00] Ciao\n[00:10] nuovo pezzo");
    assert.ok(line.vocalEnd < 1);
    close(line.slotEnd, 10);
    close(line.displayEnd, 10);
    close(next.displayStart, 10);
    close(line.analysis.vocalDuration, line.vocalEnd);
    close(line.analysis.pauseDuration, 10 - line.vocalEnd);
});

test("elongated vowels add a sound hold, not a slower typewriter reveal", () => {
    const plain = timeline("[00:00] ciao mondo\n[00:10] next")[0];
    const elongated = timeline("[00:00] ciaoooooooo mondo\n[00:10] next")[0];
    const word = elongated.timedWords[0];
    close(word.revealEnd, plain.timedWords[0].revealEnd);
    close(word.sustainDuration, 0.35 * Math.sqrt(8 - 2));
    assert.ok(elongated.timedWords[1].start > plain.timedWords[1].start);
    assert.ok(elongated.chars.filter(char => char.wordIndex === 0).every(char => char.timestamp < word.revealEnd));
    assert.equal(elongated.text, "ciaoooooooo mondo");
    assert.equal(elongated.analysis.sustainedWordCount, 1);
});

test("accented equal vowels sustain; ordinary double vowels do not", () => {
    const [accented] = timeline("[00:00] ciaoóòò");
    const [double] = timeline("[00:00] zoo");
    assert.equal(accented.analysis.sustainedWordCount, 1);
    close(accented.timedWords[0].sustainDuration, 0.35 * Math.sqrt(4 - 2));
    assert.equal(double.analysis.sustainedWordCount, 0);
    const [long] = timeline(`[00:00] ${"o".repeat(1000)}`);
    close(long.timedWords[0].sustainDuration, 2.5);
});

test("punctuation creates separate pauses without extending sung words", () => {
    const [line] = timeline("[00:00] ciao, mondo; ancora... fine!\n[00:10] next");
    const pauses = [0.12, 0.18, 0.45, 0.25];
    line.timedWords.forEach((word, index) => {
        close(word.pauseDuration, pauses[index]);
        close(word.revealEnd, word.end);
        if (index < line.timedWords.length - 1) close(line.timedWords[index + 1].start - word.end, pauses[index]);
    });
    close(line.vocalEnd, line.timedWords.at(-1).end);
    close(timeline("[00:00] fine!")[0].vocalEnd, timeline("[00:00] fine")[0].vocalEnd);
});

test("rhythm uses the 25th percentile only after three qualifying samples", () => {
    const text = "one two three four";
    const units = timing.tokenize(text).reduce((sum, token) => sum + token.spokenWeight, 0);
    const parsed = [0, 0.2 * units, 0.5 * units, 0.9 * units].map(timestamp => ({ timestamp, text }));
    const lines = timing.buildTimeline(parsed);
    close(lines[0].analysis.secondsPerUnit, 0.25);
    close(timing.buildTimeline(parsed.slice(0, 3))[0].analysis.secondsPerUnit, 0.28);
    const sustained = parsed.map((line, index) => index === 1 ? { ...line, text: "one two three foooour" } : line);
    close(timing.buildTimeline(sustained)[0].analysis.secondsPerUnit, 0.28);
    const distant = parsed.map((line, index) => ({ ...line, timestamp: index * 13 }));
    close(timing.buildTimeline(distant)[0].analysis.secondsPerUnit, 0.28);
});

test("estimated rhythm is bounded and punctuation is removed from training gaps", () => {
    const text = "one two three four!";
    const units = timing.tokenize(text).reduce((sum, token) => sum + token.spokenWeight, 0);
    for (const [rate, expected] of [[0.1, 0.18], [0.3, 0.3], [0.7, 0.4]]) {
        const parsed = Array.from({ length: 4 }, (_, index) => ({ timestamp: index * (units * rate + 0.25), text }));
        close(timing.buildTimeline(parsed)[0].analysis.secondsPerUnit, expected);
    }
});

test("speed scales text estimates but leaves explicit timestamps unchanged", () => {
    const source = "[00:00] <00:00.20>ciaooo bello, <00:04>mondo<00:07>\n[00:10] next";
    const normal = timeline(source)[0];
    const fast = timeline(source, false, null, { speed: 2 })[0];
    close(normal.timedWords[0].start, fast.timedWords[0].start);
    close(fast.timedWords[0].revealEnd - 0.2, (normal.timedWords[0].revealEnd - 0.2) / 2);
    close(fast.timedWords[0].sustainDuration, normal.timedWords[0].sustainDuration / 2);
    close(fast.timedWords[2].start, 4);
    close(fast.vocalEnd, 7);
    close(fast.displayEnd, 10);
    for (const [speed, expected] of [[0, 0.56], [20, 0.14], [NaN, 0.28], [Infinity, 0.28]]) {
        close(timeline("[00:00] hello", false, null, { speed })[0].analysis.secondsPerUnit, expected);
    }
});

test("Enhanced intervals may contain pauses before the next exact onset", () => {
    const [line] = timeline("[00:00] <00:00.20>hello <00:05>world<00:07>\n[00:10] next");
    close(line.timedWords[0].start, 0.2);
    assert.ok(line.timedWords[0].end < 1);
    close(line.timedWords[1].start, 5);
    assert.ok(line.timedWords[1].revealEnd < 6);
    close(line.timedWords[1].end, 7);
    close(line.vocalEnd, 7);
    close(line.displayEnd, 10);
});

test("last-line visibility uses original media duration with source offset, even without audio guidance", () => {
    const [normal] = timeline("[00:10] ciao", false, null, { mediaDuration: 20 });
    const [shifted] = timeline("[00:10] ciao", true, null, { mediaDuration: 20 });
    close(normal.displayEnd, 20);
    close(shifted.displayEnd, 10);
    close(normal.vocalEnd - 10, shifted.vocalEnd);
    const [fallback] = timeline("[00:00] ciao");
    close(fallback.displayEnd - fallback.vocalEnd, 0.8);
});

test("terminal markers exactly at the media end do not add a fallback hold", () => {
    const [line] = timeline("[00:00] <00:00>hello<00:04>", false, null, { mediaDuration: 4 });
    close(line.vocalEnd, 4);
    close(line.displayEnd, 4);
    assert.deepEqual(line.analysis.warnings, []);
});

test("valid Enhanced timings beyond media duration are preserved and reported", () => {
    const [line] = timeline("[00:00] <00:00>hello <00:04>world<00:06>", false, null, { mediaDuration: 3 });
    close(line.timedWords[1].start, 4);
    close(line.vocalEnd, 6);
    close(line.displayEnd, 6.8);
    assert.ok(line.analysis.warnings.some(warning => warning.includes("Media ends")));
});

test("dense slots compress ordinary reveal, sustain and punctuation without overlap", () => {
    const [line, next] = timeline("[00:00] ciaooo, davvero tante parole!\n[00:00.10] next");
    assert.ok(line.vocalEnd <= next.timestamp);
    close(line.displayEnd, next.timestamp);
    line.timedWords.forEach((word, index) => {
        assert.ok(word.start <= word.revealEnd && word.revealEnd <= word.end && word.end <= next.timestamp);
        if (index) assert.ok(line.timedWords[index - 1].end <= word.start);
    });
    assert.ok(line.chars.every(char => char.timestamp < next.timestamp));
});

test("continuous or silent backing audio never stretches singing to fill the slot", () => {
    for (const amplitude of [0, 0.5]) {
        const audio = timing.analyzeAudioEnergy(audioBuffer([new Float32Array(12000).fill(amplitude)]));
        const [withAudio] = timeline("[00:00] ciao\n[00:10] next", false, audio);
        const [withoutAudio] = timeline("[00:00] ciao\n[00:10] next");
        close(withAudio.vocalEnd, withoutAudio.vocalEnd);
        assert.ok(withAudio.analysis.pauseDuration > 9);
    }
});

test("blank boundaries and repeated timestamps retain their slots while singing finishes early", () => {
    const lines = timeline("[00:10][00:20] ciao\n[00:13]\n[00:24] next", true);
    close(lines[0].slotEnd, 3);
    assert.ok(lines[0].vocalEnd < 1);
    close(lines[1].displayStart, 10);
    close(lines[1].slotEnd, 14);
    assert.ok(lines[1].vocalEnd < 11);
});

test("audio onset nudges remain local and do not move word ends or extend singing", () => {
    const text = "[00:10] one two\n[00:12] next";
    const plain = timeline(text)[0];
    const target = plain.timedWords[1].start;
    const frameDuration = 0.001;
    const quietFrame = Math.ceil((target + 0.005) / frameDuration);
    const audio = {
        duration: 20, frameDuration, lowRms: 0, highRms: 1, usable: true,
        frames: Array.from({ length: 20000 }, (_, index) => ({ time: index * frameDuration, rms: index === quietFrame ? 0 : 1 }))
    };
    const guided = timeline(text, false, audio)[0];
    const shifted = timeline(text, true, audio)[0];
    assert.ok(guided.timedWords[1].start > target);
    assert.ok(guided.timedWords[1].start - target <= 0.06);
    close(guided.timedWords[1].end, plain.timedWords[1].end);
    close(guided.vocalEnd, plain.vocalEnd);
    close(guided.timedWords[1].start - 10, shifted.timedWords[1].start);
});

test("invalid terminal markers are bounded and produce a warning", () => {
    const [outside] = timeline("[00:00] <00:00>hello<00:08>\n[00:05] next");
    close(outside.vocalEnd, 5);
    assert.ok(outside.analysis.warnings.some(warning => warning.includes("Terminal timestamp")));
    const [backwards] = timeline("[00:00] <00:01>hello<00:00.50>\n[00:05] next");
    close(backwards.timedWords[0].start, 1);
    close(backwards.vocalEnd, 1);
    assert.ok(backwards.analysis.warnings.some(warning => warning.includes("before its last word")));
});

test("Italian nuclei account for diphthongs, hiatuses and elisions", () => {
    const cases = { io: 2, mio: 2, miei: 1, tuoi: 1, suoi: 1, ciao: 1, cuore: 2, poeta: 3, paura: 3, aiuto: 3,
        "l'amore": 3, "dell’anima": 4, "l'io": 2, "farmacìa": 4, "poesìa": 4, "perché": 2 };
    for (const [word, expected] of Object.entries(cases)) {
        assert.equal(spoken(word, "it")[0].syllables, expected, word);
    }
});

test("English nuclei account for silent endings, contractions and exceptions", () => {
    const cases = { one: 1, two: 1, make: 1, wanted: 2, loved: 1, dances: 2, bikes: 1,
        little: 2, beautiful: 3, extraordinary: 5, "don't": 1, "we’re": 1, "isn't": 2 };
    for (const [word, expected] of Object.entries(cases)) {
        assert.equal(spoken(word, "en")[0].syllables, expected, word);
    }
    const [line] = timeline("[00:00] one two", false, null, { language: "en" });
    close(line.timedWords[0].end, line.timedWords[1].end - line.timedWords[1].start);
});

test("auto selects Italian and English per line and blends ambiguous phrases", () => {
    const lines = timeline("[00:00] io e il mio cuore\n[00:05] one little love\n[00:10] ciao love amore tonight\n[00:15] sale");
    assert.equal(lines[0].analysis.language, "it");
    assert.equal(lines[1].analysis.language, "en");
    assert.equal(timeline("[00:00] come to me")[0].analysis.language, "en");
    assert.equal(timeline("[00:00] come stai")[0].analysis.language, "it");
    assert.equal(lines[2].analysis.language, "auto");
    assert.deepEqual(lines[2].timedWords.map(word => word.syllables), [1, 1, 3, 2]);
    assert.equal(lines[3].timedWords[0].syllables, 1.5);
    assert.equal(spoken("sale", "it")[0].syllables, 2);
    assert.equal(spoken("sale", "en")[0].syllables, 1);
    assert.equal(timeline("[00:00] sale", false, null, { language: "invalid" })[0].timedWords[0].syllables, 1.5);
});

test("hyphenated compounds retain their spoken parts and original text", () => {
    const [word] = spoken("one-little-love!", "en");
    assert.equal(word.syllables, 4);
    assert.equal(word.text, "one-little-love!");
    close(word.pause, 0.25);
});

test("language selection preserves generic estimates for non-Latin scripts", () => {
    for (const text of ["привет мир", "你好世界。再见！", "안녕하세요", "مرحبا بالعالم"]) {
        const automatic = spoken(text, "auto");
        for (const language of ["it", "en"]) {
            assert.deepEqual(spoken(text, language).map(word => word.spokenWeight), automatic.map(word => word.spokenWeight));
        }
    }
});

test("local tempo follows distant fast and slow sections using at most eight samples", () => {
    const text = "one two three four";
    const units = spoken(text, "en").reduce((sum, word) => sum + word.spokenWeight, 0);
    let timestamp = 0;
    const parsed = Array.from({ length: 25 }, (_, index) => {
        const line = { timestamp, text, role: "lead" };
        timestamp += units * (index < 12 ? 0.2 : 0.38);
        return line;
    });
    const lines = timing.buildTimeline(parsed, null, { language: "en" });
    close(lines[3].analysis.secondsPerUnit, 0.2);
    close(lines[20].analysis.secondsPerUnit, 0.38);
    close(timing.buildTimeline(parsed.slice(0, 3), null, { language: "en" })[0].analysis.secondsPerUnit, 0.28);
});

test("local tempo keeps vocal roles separate at simultaneous timestamps", () => {
    const leadText = "one two three four";
    const bgText = "beautiful extraordinary little people";
    const leadUnits = spoken(leadText, "en").reduce((sum, word) => sum + word.spokenWeight, 0);
    const bgUnits = spoken(bgText, "en").reduce((sum, word) => sum + word.spokenWeight, 0);
    const gap = leadUnits * 0.36;
    const parsed = Array.from({ length: 12 }, (_, index) => [
        { timestamp: index * gap, text: leadText, role: "lead" },
        { timestamp: index * gap, text: bgText, role: "background" }
    ]).flat();
    const lines = timing.buildTimeline(parsed, null, { language: "en" });
    close(lines[10].analysis.secondsPerUnit, 0.36);
    close(lines[11].analysis.secondsPerUnit, Math.max(0.18, gap / bgUnits));
    assert.ok(lines[11].analysis.secondsPerUnit < lines[10].analysis.secondsPerUnit);
});

test("explicit instrumental boundaries and malformed anchors cannot train tempo", () => {
    const text = "one two three four";
    const units = spoken(text, "en").reduce((sum, word) => sum + word.spokenWeight, 0);
    const gap = units * 0.39;
    const parsed = Array.from({ length: 4 }, (_, index) => ({ timestamp: index * gap, text }));
    for (const excluded of [
        { boundaryTimestamp: gap - 0.1 },
        { wordTimings: [{ timestamp: gap + 1, text: "one" }] },
        { wordTimings: [{ timestamp: 0.2, text: "absent" }] },
        { wordTimings: [{ timestamp: 0.5, text: "one" }, { timestamp: 0.2, text: "two" }] },
        { wordEndTimestamp: -1 },
        { text: "one two three foooour" }
    ]) {
        const lines = timing.buildTimeline([{ ...parsed[0], ...excluded }, ...parsed.slice(1)], null, { language: "en" });
        close(lines[1].analysis.secondsPerUnit, 0.28);
    }
});

test("sparse vocal roles fall back to the global tempo before the default", () => {
    const text = "one two three four";
    const units = spoken(text, "en").reduce((sum, word) => sum + word.spokenWeight, 0);
    const parsed = Array.from({ length: 5 }, (_, index) => ({ timestamp: index * units * 0.31, text, role: "lead" }));
    parsed.push({ timestamp: 20, text: "hello", role: "side" });
    close(timing.buildTimeline(parsed, null, { language: "en" }).at(-1).analysis.secondsPerUnit, 0.31);
});

test("Italian and English schedules keep exact anchors, offsets and dense bounds", () => {
    const source = "[00:10][00:20] <00:10.123>one little <00:11.456>mio cuore<00:12.789>\n[00:25]\n[offset:250]";
    for (const language of ["auto", "it", "en"]) {
        for (const speed of [0.5, 1, 2]) {
            const lines = timeline(source, true, null, { language, speed });
            close(lines[0].timedWords[0].start, 0.123);
            close(lines[0].timedWords[2].start, 1.456);
            close(lines[0].vocalEnd, 2.789);
            close(lines[1].timedWords[0].start, 10.123);
            const [dense, next] = timeline("[00:00] io e one little amore!\n[00:00.013] next", false, null, { language, speed });
            dense.timedWords.forEach((word, index) => {
                assert.ok(word.start <= word.revealEnd && word.revealEnd <= word.end && word.end <= next.timestamp);
                if (index) assert.ok(dense.timedWords[index - 1].end <= word.start);
            });
            assert.ok(dense.chars.every((char, index) => Number.isFinite(char.timestamp) && (!index || char.timestamp >= dense.chars[index - 1].timestamp)));
        }
    }
});
