const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../assets/js/core.js");
const timing = require("../assets/js/timing.js");

test("stanza markers survive LRC parsing and timeline scheduling", () => {
    const source = "[ar:ARTIST]\n[00:01.00] prima riga\n[00:02.00] seconda riga\n\n[Verse 2]\n[00:05.00] TERZA riga\n[00:06.00] quarta riga";
    const parsed = core.parseLRC(source);
    assert.deepEqual(parsed.map(line => line.stanzaIndex), [0, 0, 1, 1]);
    assert.deepEqual(timing.buildTimeline(parsed).map(line => line.stanzaIndex), [0, 0, 1, 1]);
});
test("blank timed lines delimit stanzas without becoming visible lyrics", () => {
    const parsed = core.parseLRC("[00:00.50] song A\n[00:02.50]\n[00:04.00] song B");
    assert.deepEqual(parsed.map(line => line.text), ["song A", "song B"]);
    assert.deepEqual(parsed.map(line => line.stanzaIndex), [0, 1]);
});
test("metadata, repeated blank lines and same-line duplicate timestamps do not introduce extra stanzas", () => {
    const parsed = core.parseLRC("[00:00.10] FIRST\n\n\n[ti:TITLE]\n[00:02.00][00:03.00] SECOND");
    assert.deepEqual(parsed.map(line => line.stanzaIndex), [0, 1, 1]);
    assert.deepEqual(parsed.map(line => line.timestamp), [0.1, 2, 3]);
});
test("without stanza separators consecutive LRC lines remain in the same stanza", () => {
    assert.deepEqual(core.parseLRC("[00:00.00] A\n[00:01.00] B").map(line => line.stanzaIndex), [0, 0]);
});
