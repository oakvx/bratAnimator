const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require("../assets/js/core.js");
const { assess } = require("../assets/js/export-preflight.js");
const parse = (source, fromZero) => core.parseLRC(source, fromZero);
const base = {
    lyrics: "[00:01.20]First line\n[00:04.45]Second line",
    hasRecorder: true,
    canFast: false,
    audioSelected: false,
    audioLoaded: false,
    size: "1080",
    fps: "30"
};

test("export preflight uses the real timeline parser and accepts valid LRC", () => {
    const result = assess(base, parse);
    assert.equal(result.count, 2);
    assert.equal(result.errors, 0);
    assert.equal(result.warnings, 0);
    assert.equal(result.state, "ready");
    assert.ok(result.checks[0].text.includes("2 timed lyric lines"));
});

test("no lyrics and invalid timestamps are blocking without changing export state", () => {
    for (const lyrics of ["", "hello world", "[bad]not timed"]) {
        const result = assess({ ...base, lyrics }, parse);
        assert.equal(result.count, 0);
        assert.equal(result.state, "blocked");
        assert.ok(result.checks.some(check => check.action === "timing" && check.status === "error"));
    }
});

test("visual-only projects can export without LRC while empty projects remain blocked", () => {
    const result = assess({ ...base, lyrics: "", hasVisualClips: true }, parse);
    assert.equal(result.state, "ready");
    assert.equal(result.errors, 0);
    assert.ok(result.checks.some(check => check.text.includes("video-only")));
    assert.equal(assess({ ...base, lyrics: "", hasVisualClips: false }, parse).state, "blocked");
});

test("no browser video-encoding pipeline is reported as blocking", () => {
    const result = assess({ ...base, hasRecorder: false, canFast: false }, parse);
    assert.equal(result.state, "blocked");
    assert.ok(result.checks.some(check => check.text.includes("video encoding pipeline")));
    const fast = assess({ ...base, hasRecorder: false, canFast: true }, parse);
    assert.equal(fast.errors, 0);
});

test("missing audio is a warning and does not pretend to render a soundtrack", () => {
    const result = assess({ ...base, audioSelected: true, audioLoaded: false }, parse);
    assert.equal(result.state, "warning");
    assert.equal(result.errors, 0);
    assert.equal(result.warnings, 1);
    assert.match(result.checks.find(check => check.status === "warning").text, /silent/);
});

test("audio readiness does not block browsers with a potential fast AAC path", () => {
    const result = assess({ ...base, hasRecorder: false, canFast: true, audioSelected: true, audioLoaded: true }, parse);
    assert.equal(result.state, "ready");
    assert.ok(result.checks.some(check => check.text.includes("codec support")));
});

test("phase 16 recognizes sound from video and audio tracks even without legacy Timing audio", () => {
    const result = assess({ ...base, audioSelected: false, hasTrackAudio: true }, parse);
    assert.equal(result.state, "ready");
    assert.ok(result.checks.some(check => check.text.includes("Multitrack audio")));
});

test("performance warnings are advisory and do not disable export", () => {
    const large = assess({ ...base, size: 1920 }, parse);
    assert.equal(large.state, "warning");
    assert.equal(large.errors, 0);
    assert.ok(large.checks.some(check => check.text.includes("memory")));
    const fast = assess({ ...base, fps: 60 }, parse);
    assert.equal(fast.warnings, 1);
});

test("parser failure stays safe and there are no network or project writes", () => {
    const result = assess(base, () => { throw new Error("malformed input"); });
    assert.equal(result.errors, 1);
    const source = fs.readFileSync(path.join(__dirname, "../assets/js/export-preflight.js"), "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|indexedDB|localStorage|\.saveProject\s*\(/);
});
