const test = require("node:test");
const assert = require("node:assert/strict");
const timing = require("../assets/js/timing.js");
const core = require("../assets/js/core.js");

function segmentedLine() {
    // One displayed word, three native syllable intervals, then another word.
    return timing.buildTimeline([{
        timestamp: 1,
        sourceTimestamp: 1,
        text: "telefonando poi",
        wordTimings: [
            { text: "tele", timestamp: 1, endTimestamp: 1.8 },
            { text: "fona", timestamp: 2, endTimestamp: 2.8 },
            { text: "ndo ", timestamp: 3, endTimestamp: 3.5 },
            { text: "poi", timestamp: 4, endTimestamp: 4.6 }
        ],
        lineEndTimestamp: 4.8
    }])[0];
}

test("several native syllables remain a single timed word", () => {
    const line = segmentedLine();
    assert.equal(line.timedWords.length, 2);
    assert.equal(line.timedWords[0].text, "telefonando");
    assert.equal(line.timedWords[0].nativeSegments.length, 3);
    assert.equal(line.timedWords[0].end, 3.5);
});

test("word reveal shows each completed segment with a continuation hyphen", () => {
    const line = segmentedLine();
    const end = line.timedWords[0].endChar;
    assert.equal(timing.getSegmentAwareText(line, 0.9, -1, "word"), "");
    assert.equal(timing.getSegmentAwareText(line, 1.5, end, "word"), "tele-");
    assert.equal(timing.getSegmentAwareText(line, 2.5, end, "word"), "telefona-");
    assert.equal(timing.getSegmentAwareText(line, 3.1, end, "word"), "telefonando");
    assert.equal(timing.getSegmentAwareText(line, 3.7, end, "word"), "telefonando");
});

test("character reveal preserves original character timing while adding a temporary marker", () => {
    const line = segmentedLine();
    assert.equal(timing.getSegmentAwareText(line, 1.5, 1, "typewriter"), "te-");
    assert.equal(timing.getSegmentAwareText(line, 2.5, 4, "typewriter"), "telef-");
    assert.equal(timing.getSegmentAwareText(line, 3.1, 8, "typewriter"), "telefonan");
    assert.equal(timing.getSegmentAwareText(line, 2.5, 10, "letter-chunks"), "telefona-");
});

test("ordinary lyrics, non-reveal modes and previously completed words are unchanged", () => {
    const line = segmentedLine();
    assert.equal(timing.getSegmentAwareText(line, 2.5, 10, "phrase"), "telefonando");
    assert.equal(timing.getSegmentAwareText(line, 4.1, 14, "word"), "telefonando poi");
    const plain = timing.buildTimeline(core.parseLRC("[00:01] cantando normalmente"))[0];
    assert.equal(timing.getSegmentAwareText(plain, 2, 17, "word"), "cantando normalmen");
});

test("a genuine source hyphen is not duplicated by the continuation marker", () => {
    const line = {
        text: "tele-fonando",
        timedWords: [{
            start: 1, end: 4, startChar: 0, endChar: 12,
            nativeSegments: [
                { start: 1, startChar: 0, endChar: 4 },
                { start: 3, startChar: 5, endChar: 12 }
            ]
        }]
    };
    assert.equal(timing.getSegmentAwareText(line, 2, 12, "word"), "tele-");
});
