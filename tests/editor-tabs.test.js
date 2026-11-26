const test = require("node:test");
const assert = require("node:assert/strict");
const tabs = require("../assets/js/editor-tabs.js");

const HISTORIC = ["lyrics", "timing", "tracks", "design", "canvas", "export", "project"];

test("i quattro tab sono in ordine fisso", () => {
    assert.deepEqual(Object.keys(tabs.GROUPS), ["text", "timeline", "style", "export"]);
    assert.ok(Object.isFrozen(tabs.GROUPS));
});

test("le sezioni storiche finiscono nel tab giusto", () => {
    assert.equal(tabs.groupOf("lyrics"), "text");
    assert.equal(tabs.groupOf("timing"), "text");
    assert.equal(tabs.groupOf("tracks"), "timeline");
    assert.equal(tabs.groupOf("design"), "style");
    assert.equal(tabs.groupOf("canvas"), "style");
    assert.equal(tabs.groupOf("export"), "export");
    assert.equal(tabs.groupOf("project"), "export");
});

test("un nome di gruppo resta se stesso, uno sconosciuto va su testo", () => {
    assert.equal(tabs.groupOf("style"), "style");
    assert.equal(tabs.groupOf("timeline"), "timeline");
    assert.equal(tabs.groupOf("boh"), "text");
    assert.equal(tabs.groupOf(undefined), "text");
});

test("ogni sezione storica sta in esattamente un gruppo", () => {
    const all = Object.keys(tabs.GROUPS).flatMap(group => tabs.sectionsOf(group));
    assert.deepEqual([...all].sort(), [...HISTORIC].sort());
    assert.deepEqual(tabs.sectionsOf("style"), ["design", "canvas"]);
    assert.deepEqual(tabs.sectionsOf("nope"), []);
});
