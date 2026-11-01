const test = require("node:test");
const assert = require("node:assert/strict");
const lyrics = require("../assets/js/lyrics.js");
const core = require("../assets/js/core.js");
const timing = require("../assets/js/timing.js");

const document = {
    version: "1.0", metadata: { title: "Example", artist: "Singer", duration_ms: 15000 },
    lines: [{ text: "Hello world", start_ms: 1234, end_ms: 7000, words: [
        { text: "Hello ", start_ms: 1456, end_ms: 2100 },
        { text: "world", start_ms: 4100, end_ms: 6700 }
    ] }, { text: "Another voice", start_ms: 5000, end_ms: 8000 }]
};
function imported(data = document) { return lyrics.parse(JSON.stringify(data), "song.json"); }
function timeline(result, options = {}, zero = false) {
    return timing.buildTimeline(core.parseLRC(result.lyrics, zero, core.reconcileLyricRows(result.rows)), null, options);
}
const intervals = line => line.timedWords.map(word => [word.start, word.end]);

test("Lyricsfile YAML and JSON preserve exact word starts, ends, gaps and overlapping lines", () => {
    const yaml = require("../vendor/js-yaml.min.js");
    const result = lyrics.parse(yaml.dump(document), "song.lyricsfile.yaml");
    assert.equal(result.metadata.trackName, "Example");
    assert.equal(result.metadata.duration, 15);
    assert.equal(result.nativeWordCount, 2);
    for (const speed of [0.5, 1, 2]) {
        const [line] = timeline(result, { speed });
        assert.deepEqual(intervals(line), [[1.456, 2.1], [4.1, 6.7]]);
        assert.ok(line.timedWords.every(word => word.explicitEnd));
        assert.equal(line.displayEnd, 7);
        assert.equal(line.vocalEnd, 6.7);
    }
    assert.deepEqual(intervals(timeline(imported())[0]), intervals(timeline(result)[0]));
});

test("native timing survives project JSON, millisecond row edits and start-from-zero", () => {
    const result = imported();
    const rows = core.reconcileLyricRows(result.rows);
    const project = core.migrateProjectPayload(JSON.parse(JSON.stringify({ lyrics: result.lyrics, lyricRows: rows, lyricsProvider: "lrc.red", metadata: { source: "lrc.red", sourceUrl: "https://lrc.red/s/GBABC1234567" } })));
    assert.equal(project.metadata.sourceUrl, "https://lrc.red/s/GBABC1234567");
    assert.equal(project.lyricsProvider, "lrc.red");
    const shifted = core.shiftRows(project.lyricRows, 1.001);
    const lrc = core.rowsToLrc(shifted);
    assert.ok(lrc.startsWith("[00:02.235]"));
    const [line] = timing.buildTimeline(core.parseLRC(lrc, false, shifted));
    assert.ok(Math.abs(line.timedWords[0].start - 2.457) < 1e-9);
    assert.ok(Math.abs(line.timedWords[1].end - 7.701) < 1e-9);
    const [zero] = timeline(result, {}, true);
    assert.ok(Math.abs(zero.timedWords[0].start - 0.222) < 1e-9);
    assert.ok(Math.abs(zero.timedWords[1].end - 5.466) < 1e-9);
});

test("native timing bypasses audio guidance and estimates only missing intervals", () => {
    const data = structuredClone(document);
    data.lines = [{ text: "One two three", start_ms: 1000, end_ms: 7000, words: [
        { text: "One ", start_ms: 1200, end_ms: 3000 },
        { text: "two ", start_ms: 3200 },
        { text: "three", start_ms: 5000, end_ms: 6500 }
    ] }];
    const result = imported(data);
    const audio = { usable: true, duration: 15, frameDuration: 0.1, frames: Array.from({ length: 150 }, (_, index) => ({ time: index / 10, rms: index % 2 })), lowRms: 0, highRms: 1 };
    const [line] = timing.buildTimeline(core.parseLRC(result.lyrics, false, result.rows), audio, { speed: 2 });
    assert.deepEqual(intervals(line).filter((_, i) => i !== 1), [[1.2, 3], [5, 6.5]]);
    assert.equal(line.timedWords[1].start, 3.2);
    assert.ok(line.timedWords[1].end <= 5);
    assert.equal(line.timedWords[1].explicitEnd, undefined);
});

test("editing text drops stale native timestamps", () => {
    const result = imported();
    const rows = core.reconcileLyricRows(result.rows);
    rows[0].text = "Different text";
    const [line] = timing.buildTimeline(core.parseLRC(core.rowsToLrc(rows), false, rows));
    assert.equal(line.text, "Different text");
    assert.ok(line.timedWords.every(word => !word.explicitEnd));
});

test("plain Lyricsfile, YAML blocks and safe scalar types are accepted", () => {
    const result = lyrics.parse('version: "1.0"\nmetadata:\n  title: on\n  artist: yes\nplain: |\n  First line\n\n  Second line\n');
    assert.equal(result.metadata.trackName, "on");
    assert.equal(result.lyrics, "First line\n\nSecond line\n");
    assert.equal(result.nativeWordCount, 0);
    assert.equal(lyrics.parse("[00:01] existing", "song.lrc").lyrics, "[00:01] existing");
});

test("rejects malformed YAML, unsupported versions, invalid times and oversized files", () => {
    for (const source of [
        'version: "2.0"\nmetadata: {}\nplain: hi',
        'version: "1.0"\nversion: "1.0"\nmetadata: {}\nplain: hi',
        'version: "1.0"\nmetadata: !!js/function function(){}\nplain: hi',
        'version: "1.0"\nmetadata: {}\nlines: wrong',
        'version: "1.0"\nmetadata: {}\nlines: [{text: hi, start_ms: -1}]',
        'version: "1.0"\nmetadata: {}\nlines: [{text: hi, start_ms: 2000, end_ms: 1000}]'
    ]) assert.throws(() => lyrics.parse(source, "song.yaml"));
    assert.throws(() => lyrics.parse("a".repeat(lyrics.MAX_SIZE + 1)));
    const wrong = structuredClone(document);
    wrong.lines[0].words[0].text = "Wrong ";
    assert.throws(() => imported(wrong), /do not match/);
});

test("SRT and WebVTT retain line ends, overlap, multiline text and word intervals", () => {
    const result = lyrics.parse('1\r\n00:00:01,234 --> 00:00:04,567\r\n<i>Hello</i> &amp;\r\nworld\r\n\r\n2\r\n00:00:03,000 --> 00:00:05,000\r\nAgain', "song.srt");
    assert.equal(result.rows[0].text, "Hello & world");
    assert.equal(timeline(result)[0].displayEnd, 4.567);
    const vtt = lyrics.parse('WEBVTT\n\nNOTE comment\nignored\n\ncue-id\n00:01.000 --> 00:04.000 align:start\nHello <00:02.500>world\n', "song.vtt");
    assert.deepEqual(intervals(timeline(vtt)[0]), [[1, 2.5], [2.5, 4]]);
});

test("clock expressions handle hours, offsets, frames, ticks and invalid seconds", () => {
    for (const [text, expected] of [["01:02:03.456", 3723.456], ["02:03.456", 123.456], ["1234ms", 1.234], ["2m", 120], ["1.5s", 1.5], ["75f", 2.5], ["50t", 50]]) assert.equal(lyrics.parseClock(text), expected);
    assert.equal(lyrics.parseClock("00:00:02:15", { frame: 30 }), 2.5);
    assert.equal(lyrics.parseClock("00:99.000"), null);
    assert.equal(core.parseLRC("[123:45.678] long track")[0].timestamp, 7425.678);
});
