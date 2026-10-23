const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../assets/js/core.js");

test("legacy projects migrate to inert v5 features and stable persisted identities", () => {
    for (const version of [2, 3, 4]) {
        const project = core.migrateProjectPayload({ version, lyrics: "[00:01] <00:01.1>Hello <00:01.5>world\n[00:03] again" });
        assert.equal(project.version, 5);
        assert.equal(project.seed, 1337);
        assert.equal(project.lyricRows.length, 2);
        assert.equal(project.style.entrance.mode, "none");
        assert.equal(project.style.entrance.randomAngles, false);
        assert.equal(project.beatEffects.enabled, false);
        assert.equal(project.exportRange.enabled, false);
        assert.deepEqual(project.fonts, []);
        assert.equal(project.lyricRows[0].inlineText, "<00:01.1>Hello <00:01.5>world");
        const restored = core.migrateProjectPayload(JSON.parse(JSON.stringify(project)));
        assert.deepEqual(restored, project);
    }
});

test("v5 stores phrase styles, translations, fonts and seeds without binary fonts", () => {
    const project = core.migrateProjectPayload({
        version: 5, seed: 4294967297,
        lyricRows: [{ id: "chorus", time: 12, text: "Hello", translation: "Ciao", style: { fontScale: 0.4, entrance: { mode: "elastic", randomAngles: true, seed: 25 } } }],
        fonts: [{ id: "font-1", name: "My font.ttf", family: "Custom One", assetId: "font-asset", blob: {} }],
        beatEffects: { enabled: true, source: "manual", bpm: 140 },
        exportRange: { enabled: true, start: 2, end: 8 }
    });
    assert.equal(project.seed, 1);
    assert.equal(project.lyricRows[0].id, "chorus");
    assert.equal(project.lyricRows[0].translation, "Ciao");
    assert.equal(project.lyricRows[0].style.fontScale, 0.4);
    assert.equal(project.lyricRows[0].style.entrance.seed, 25);
    assert.deepEqual(project.fonts, [{ id: "font-1", name: "My font.ttf", family: "Custom One", assetId: "font-asset" }]);
    assert.equal(project.beatEffects.bpm, 140);
    assert.deepEqual(project.exportRange, { enabled: true, start: 2, end: 8 });
});

test("new settings clamp finite values and reject invalid numeric values", () => {
    assert.deepEqual(core.normalizeEntrance(null), { mode: "none", duration: 320, intensity: 0.15, angle: 8, randomAngles: false, seed: 0 });
    assert.deepEqual(core.normalizeEntrance({ mode: "stretch-x", duration: 9999, intensity: -1, angle: 100, randomAngles: true, seed: -1 }), {
        mode: "stretch-x", duration: 800, intensity: 0, angle: 15, randomAngles: true, seed: 4294967295
    });
    assert.equal(core.normalizeEntrance({ duration: NaN, intensity: Infinity, angle: "invalid" }).duration, 320);
    assert.equal(core.normalizeEntrance({ duration: NaN, intensity: Infinity, angle: "invalid" }).intensity, 0.15);
    assert.deepEqual(core.normalizeBeatEffects({ enabled: true, source: "manual", bpm: 500, pulse: 2, offset: NaN }), {
        enabled: true, source: "manual", bpm: 240, offset: 0, pulse: 0.1, textPulse: true, backgroundZoom: false, colorCycle: false
    });
    assert.deepEqual(core.normalizeExportRange({ enabled: true, start: -10, end: Infinity }), { enabled: true, start: 0, end: null });
});

test("reconciliation preserves identities across timing, order and text edits", () => {
    const previous = [
        { id: "first", time: 1, text: "Same", translation: "Uno", style: { textColor: "#112233" } },
        { id: "second", time: 2, text: "Same", translation: "Due", style: {} },
        { id: "third", time: 3, text: "Another", translation: "Tre", style: {} }
    ];
    const rows = core.reconcileLyricRows([
        { id: "second", time: 20, text: "Changed" },
        { time: 10, text: "Same" },
        { time: 3, text: "Edited" },
        { time: 4, text: "New" }
    ], previous);
    assert.deepEqual(rows.slice(0, 3).map(row => row.id), ["second", "first", "third"]);
    assert.deepEqual(rows.slice(0, 3).map(row => row.translation), ["Due", "Uno", "Tre"]);
    assert.equal(rows[1].style.textColor, "#112233");
    assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
    rows[1].style.textColor = "#ffffff";
    assert.equal(previous[0].style.textColor, "#112233");
});

test("reconciliation reserves explicit IDs and repairs duplicate incoming identities", () => {
    const old = [{ id: "reserved", time: 1, text: "Same", translation: "Saved" }];
    const rows = core.reconcileLyricRows([{ time: 1, text: "Same" }, { id: "reserved", time: 2, text: "Edited" }, { id: "reserved", time: 3, text: "Duplicate" }], old);
    assert.equal(rows[1].id, "reserved");
    assert.equal(rows[1].translation, "Saved");
    assert.notEqual(rows[0].id, "reserved");
    assert.equal(new Set(rows.map(row => row.id)).size, 3);
});

test("exact matches across the document precede repeated-text fallback matches", () => {
    const previous = [{ id: "first", time: 1, text: "Same", translation: "Uno" }, { id: "second", time: 2, text: "Same", translation: "Due" }];
    const reconciled = core.reconcileLyricRows([{ time: 3, text: "Same" }, { time: 1, text: "Same" }], previous);
    assert.deepEqual(reconciled.map(row => row.id), ["second", "first"]);
    assert.deepEqual(reconciled.map(row => row.translation), ["Due", "Uno"]);
});

test("split, duplicate, merge and move follow phrase metadata rules", () => {
    const original = [{ id: "first", time: 1, text: "Hello world", translation: "Ciao mondo", style: { entrance: { mode: "elastic" } } }, { id: "second", time: 4, text: "Again", translation: "Ancora", style: {} }];
    const split = core.splitRow(original, 0, 5);
    assert.equal(split[0].id, "first");
    assert.notEqual(split[1].id, "first");
    assert.equal(split[0].translation, "Ciao mondo");
    assert.equal(split[1].translation, "");
    assert.deepEqual(split[1].style, split[0].style);
    assert.notEqual(split[1].style, split[0].style);
    const duplicate = core.duplicateRow(split, 0);
    assert.notEqual(duplicate[1].id, duplicate[0].id);
    assert.equal(duplicate[1].translation, "Ciao mondo");
    const merged = core.mergeRows(original, 0);
    assert.equal(merged[0].id, "first");
    assert.equal(merged[0].translation, "Ciao mondo Ancora");
    assert.equal(merged[0].style.entrance.mode, "elastic");
    const moved = core.moveRow(original, 0, 1);
    assert.deepEqual(moved.map(row => row.id), ["second", "first"]);
    assert.deepEqual(original.map(row => row.id), ["first", "second"]);
});

test("plain translation associates only when line counts match", () => {
    const primary = [{ id: "a", time: 1, text: "One" }, { id: "b", time: 2, text: "Two" }];
    const match = core.associateTranslations(primary, "Uno\nDue");
    assert.deepEqual(match.rows.map(row => row.translation), ["Uno", "Due"]);
    assert.deepEqual(match.unmatched, []);
    assert.deepEqual(match.rows.map(row => row.id), ["a", "b"]);
    const mismatch = core.associateTranslations(primary, "Uno\nDue\nTre");
    assert.deepEqual(mismatch.rows.map(row => row.translation), ["", ""]);
    assert.deepEqual(mismatch.unmatched, [{ text: "Uno" }, { text: "Due" }, { text: "Tre" }]);
    assert.equal(Object.hasOwn(primary[0], "translation"), false);
});

test("LRC translation uses one-to-one nearest timestamps within 20 ms", () => {
    const primary = [{ id: "a", time: 1, text: "One" }, { id: "b", time: 2, text: "Two" }];
    const result = core.associateTranslations(primary, "[00:01.020]Uno\n[00:01.010]Extra\n[00:02.021]Fuori\n[00:02.000]Due");
    assert.deepEqual(result.rows.map(row => row.translation), ["Extra", "Due"]);
    assert.deepEqual(result.unmatched, [{ time: 1.02, text: "Uno" }, { time: 2.021, text: "Fuori" }]);
    assert.equal(core.associateTranslations([{ time: 1, text: "One" }], "[00:01.020]Uno").rows[0].translation, "Uno");
});

test("parsed timeline rows can retain source row identities after normalization", () => {
    const rows = [{ id: "a", time: 10, text: "Hello" }, { id: "b", time: 15, text: "Again" }];
    const parsed = core.parseLRC("[00:10]Hello\n[00:15]Again", true, rows);
    assert.deepEqual(parsed.map(line => line.sourceRowId), ["a", "b"]);
    assert.deepEqual(parsed.map(line => line.timestamp), [0, 5]);
});
