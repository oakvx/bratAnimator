const test = require("node:test");
const assert = require("node:assert/strict");
const { TEMPLATES, applyTemplate } = require("../assets/js/editor-templates.js");

function documentFixture() {
    const ids = ["formatPresetSelect","themePresetSelect","lyricsDisplayModeSelect","animationModeSelect","exportFpsSelect"];
    const choices = {
        formatPresetSelect: ["square","vertical","story","landscape","cover"],
        themePresetSelect: ["classic","dark-green","white-label","pink","blue","kinetic-blue","custom"],
        lyricsDisplayModeSelect: ["brat","music","beautiful","kinetic"],
        animationModeSelect: ["typewriter","word","letter-chunks","phrase","line","fade"],
        exportFpsSelect: ["24","30","60"]
    };
    const events = [];
    const controls = Object.fromEntries(ids.map(id => [id, {
        id, value: choices[id][0], options: choices[id].map(value => ({ value })),
        dispatchEvent(event) { events.push([id,event.type]); return true; }
    }]));
    return { getElementById(id) { return controls[id] || null; }, controls, events };
}

test("four templates only target existing compatible native editor selects", () => {
    const doc = documentFixture();
    assert.equal(Object.keys(TEMPLATES).length, 4);
    for (const key of Object.keys(TEMPLATES)) {
        const applied = applyTemplate(doc, key);
        assert.equal(applied.name, TEMPLATES[key].name);
        for (const [id, value] of Object.entries(applied.controls)) assert.equal(doc.controls[id].value, value);
    }
    assert.equal(doc.events.length, 20);
    assert.ok(doc.events.some(([id, event]) => id === "animationModeSelect" && event === "input"));
    assert.ok(doc.events.some(([id, event]) => id === "formatPresetSelect" && event === "change"));
});

test("template apply is atomic if a target control or option is missing", () => {
    const doc = documentFixture();
    const original = doc.controls.formatPresetSelect.value;
    doc.controls.themePresetSelect.options = [{value:"classic"}];
    assert.throws(() => applyTemplate(doc,"kinetic-reels"), /not compatible|non è compatibile/i);
    assert.equal(doc.controls.formatPresetSelect.value, original);
    assert.deepEqual(doc.events, []);
    assert.throws(() => applyTemplate(doc, "missing"), /non disponibile/);
});

test("templates never modify lyric text, media or credentials", () => {
    const doc = documentFixture();
    const lyrics = { value: "[00:01.00]My lyric" };
    const media = { value: "private.mp3" };
    const base = doc.getElementById;
    doc.getElementById = id => ({lyricsInput: lyrics, audioFileInput:media})[id] || base.call(doc, id);
    applyTemplate(doc,"music-vertical");
    assert.equal(lyrics.value, "[00:01.00]My lyric");
    assert.equal(media.value, "private.mp3");
    for(const template of Object.values(TEMPLATES)) {
        assert.deepEqual(Object.keys(template.controls).sort(),[
            "animationModeSelect","exportFpsSelect","formatPresetSelect",
            "lyricsDisplayModeSelect","themePresetSelect"
        ]);
    }
});
