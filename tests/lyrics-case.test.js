const test = require("node:test");
const assert = require("node:assert/strict");
const { lowercaseLyrics, lowercaseLyricRows } = require("../assets/js/lyrics-case.js");

test("lowercase all lyric words without altering LRC metadata or timestamps", () => {
    const input = "[ar:Charli XCX]\r\n[ti:Song TITLE]\r\n[00:01.20] HELLO WORLD <00:02.21>ÉTÉ È BELLO\r\n\r\n[00:03,50] CI VEDIAMO";
    assert.equal(lowercaseLyrics(input),
        "[ar:Charli XCX]\r\n[ti:Song TITLE]\r\n[00:01.20] hello world <00:02.21>été è bello\r\n\r\n[00:03,50] ci vediamo");
});
test("plain lyrics, multilingual characters and original newlines remain intact", () => {
    assert.equal(lowercaseLyrics("Ä Ö Ü Ñ\n\nHELLO\rCIAO"), "ä ö ü ñ\n\nhello\rciao");
    assert.equal(lowercaseLyrics(""), "");
});
test("lowercasing word-synced imported rows preserves native start/end timing and input immutability", () => {
    const original = [{
        id: "row-1", time: 1.2, text: "HELLO RAP", translation: "CIAO",
        originalText: "HELLO RAP", inlineText: "<00:01.20>HELLO <00:01.50>RAP",
        timing: { text: "HELLO RAP", time: 1.2, end: 2.5,
            words: [{ text: "HELLO ", start: 1.2, end: 1.5 }, { text: "RAP", start: 1.5, end: 2.5 }] }
    }];
    const updated = lowercaseLyricRows(original);
    assert.equal(updated[0].text, "hello rap");
    assert.equal(updated[0].inlineText, "<00:01.20>hello <00:01.50>rap");
    assert.equal(updated[0].translation, "ciao");
    assert.deepEqual(updated[0].timing.words.map(w => w.start), [1.2, 1.5]);
    assert.equal(updated[0].timing.end, 2.5);
    assert.equal(updated[0].timing.words[0].text, "hello ");
    assert.equal(original[0].text, "HELLO RAP");
    assert.equal(original[0].timing.words[0].text, "HELLO ");
});
