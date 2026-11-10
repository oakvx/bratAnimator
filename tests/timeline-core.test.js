const test = require("node:test");
const assert = require("node:assert/strict");
const Tracks = require("../assets/js/multitrack.js");
const Timeline = require("../assets/js/timeline-core.js");

function seed() {
    let graph = Tracks.empty();
    graph = Tracks.apply(graph, "add-clip", { trackId: "main-video",
        clip: { kind: "video", name: "A", start: 1, duration: 3, sourceIn: 2, playbackRate: 1.5 } });
    const first = graph.selectedClipId;
    graph = Tracks.apply(graph, "add-clip", { trackId: "main-overlay",
        clip: { kind: "video", name: "B", start: 7, duration: 2 } });
    return { graph, first, second: graph.selectedClipId };
}
test("phase17 timeline ruler and labels use readable adaptive units", () => {
    assert.equal(Timeline.zoom(0), 12);
    assert.equal(Timeline.zoom(900), 240);
    assert.equal(Timeline.rulerStep(48), 2);
    assert.equal(Timeline.rulerStep(12), 10);
    assert.equal(Timeline.secondsToLabel(70.2), "1:10.2");
    assert.equal(Timeline.secondsToLabel(59.99), "1:00");
    assert.equal(Timeline.secondsToLabel(119.99), "2:00");
});
test("moving between compatible lanes is a single deterministic graph operation", () => {
    const { graph, first } = seed();
    const proposed = Timeline.gesture(graph, first, "move", 48 * 2.5, 48,
        { toTrackId: "main-overlay", snap: false });
    assert.equal(proposed.operation, "move-clip");
    assert.equal(proposed.args.start, 3.5);
    const after = Tracks.apply(graph, proposed.operation, proposed.args);
    assert.equal(after.tracks[0].clips.length, 0);
    assert.equal(after.tracks[1].clips.length, 2);
    assert.equal(after.tracks[1].clips.find(c => c.id === first).sourceIn, 2);
});
test("snap aligns either the leading or trailing clip edge to nearest marker", () => {
    const { graph, first } = seed();
    const toEnd = Timeline.gesture(graph, first, "move", (3.96 - 1) * 48, 48,
        { snap: true, playhead: 5 });
    assert.equal(toEnd.snapped, true);
    assert.equal(toEnd.args.start, 4);
    const toStart = Timeline.gesture(graph, first, "move", (6.94 - 1) * 48, 48,
        { snap: true, playhead: 20 });
    assert.equal(toStart.snapped, true);
    assert.equal(toStart.args.start, 7);
    assert.equal(Timeline.gesture(graph, first, "move", (6.94 - 1) * 48, 48,
        { snap: false }).args.start, 6.94);
});
test("trimming left preserves source time mapping and prevents negative sourceIn", () => {
    const { graph, first } = seed();
    const trim = Timeline.gesture(graph, first, "trim-left", 48, 48, { snap: false });
    assert.deepEqual(trim.args, { clipId: first, start: 2, duration: 2 });
    const after = Tracks.apply(graph, trim.operation, trim.args);
    assert.equal(after.tracks[0].clips[0].sourceIn, 3.5);
    const backwards = Timeline.gesture(graph, first, "trim-left", -1000, 48, { snap: false });
    assert.ok(backwards.args.start >= 0);
    assert.ok(backwards.args.start >= 1 - 2 / 1.5 - 1e-9);
});
test("trimming right edits duration without moving sourceIn", () => {
    const { graph, first } = seed();
    const trim = Timeline.gesture(graph, first, "trim-right", 96, 48, { snap: false });
    const after = Tracks.apply(graph, trim.operation, trim.args);
    assert.equal(after.tracks[0].clips[0].duration, 5);
    assert.equal(after.tracks[0].clips[0].start, 1);
    assert.equal(after.tracks[0].clips[0].sourceIn, 2);
});
test("locked/incompatible destination lanes reject gesture without mutation", () => {
    const { graph, first } = seed();
    const frozen = structuredClone(graph);
    assert.throws(() => Timeline.gesture(graph, first, "move", 60, 48,
        { toTrackId: "main-audio" }), /Incompatible/);
    const locked = Tracks.apply(graph, "set-track", { trackId: "main-overlay", locked: true });
    assert.throws(() => Timeline.gesture(locked, first, "move", 60, 48,
        { toTrackId: "main-overlay" }), /locked/);
    assert.deepEqual(graph, frozen);
});
test("snap respects threshold scaling and nearest playhead position", () => {
    const points = [{ at: 4, kind: "clip-start" }, { at: 5, kind: "playhead" }];
    assert.equal(Timeline.snap(4.12, points, 48).time, 4);
    assert.equal(Timeline.snap(4.12, points, 240).snapped, false);
    assert.equal(Timeline.snap(4.95, points, 48).time, 5);
});
