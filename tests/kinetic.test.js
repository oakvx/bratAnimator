const test = require("node:test");
const assert = require("node:assert/strict");
const kinetic = require("../assets/js/kinetic.js");

function context() {
    return {
        font: "12px Arial",
        measureText(text) {
            const size = Number(this.font.match(/([\d.]+)px/)?.[1]) || 12;
            return { width: Array.from(text).reduce((sum, char) =>
                sum + size * (char === " " ? 0.3 : 0.55), 0) };
        }
    };
}
const style = { fontFamily:"Arial, sans-serif", fontScale:1, kineticLines:2,
    kineticSpacing:55, kineticVariation:72, kineticMotion:55 };

function line(text, start, end, index) {
    const parts = text.split(/\s+/);
    return {
        sourceRowId:"line-" + index, text,
        displayStart:start, displayEnd:end, vocalEnd:end - 0.1,
        timedWords:parts.map((word, i) => ({
            text:word, start:start + i * (end - start) / parts.length,
            end:start + (i + 1) * (end - start) / parts.length
        }))
    };
}
const timeline = [
    line("name and world", 0, 3, 0),
    line("say them make our", 3, 7, 1),
    line("sleeping wake up you're", 7, 11, 2)
];
const nodesAt = (time, overrides = {}, seed = 25) =>
    kinetic.buildTimelineFrame(context(), timeline, time, 710, 400,
        { ...style, ...overrides }, seed).groups.at(-1)?.nodes || [];

function assertNoCollisions(nodes) {
    for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
            const a = nodes[i].bounds, b = nodes[j].bounds;
            const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
            const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
            assert.ok(overlapX <= 0.000001 || overlapY <= 0.000001,
                "text collision: " + nodes[i].text + "/" + nodes[j].text);
        }
    }
}

test("every word in the composition accumulates; no rolling word cap", () => {
    assert.deepEqual(nodesAt(2.5).map(n => n.text), ["name", "and", "world"]);
    assert.deepEqual(nodesAt(6.5).map(n => n.text),
        ["name", "and", "world", "say", "them", "make", "our"]);
    assert.deepEqual(nodesAt(7.5).map(n => n.text), ["sleeping"]);
    assert.equal(nodesAt(6.5).length, 7);
});

test("each word appears only after its native timestamp", () => {
    assert.equal(nodesAt(-0.1).length, 0);
    assert.deepEqual(nodesAt(0.01).map(n => n.text), ["name"]);
    assert.deepEqual(nodesAt(3.02).map(n => n.text),
        ["name", "and", "world", "say"]);
});

test("existing words do not change position as new words appear", () => {
    const early = nodesAt(0.45), late = nodesAt(6.7);
    assert.deepEqual(early[0].bounds, late[0].bounds);
    assert.equal(early[0].size, late[0].size);
    assert.equal(early[0].x, late[0].x);
    assert.equal(early[0].y, late[0].y);
});

test("new words fade and scale in individually; older words become fully visible", () => {
    const frame = nodesAt(3.02);
    assert.equal(frame.length, 4);
    assert.equal(frame[0].alpha, 1);
    assert.equal(frame[0].scale, 1);
    assert.ok(frame[3].alpha > 0 && frame[3].alpha < 1);
    assert.ok(frame[3].scale < 1);
    assert.ok(frame[3].offsetY > 0);
});

test("layout is deterministic for seeking and seeded random placement", () => {
    const a = nodesAt(6.7, {}, 1234);
    const b = nodesAt(6.7, {}, 1234);
    assert.deepEqual(a,b);
    assert.notDeepEqual(a.map(n => n.bounds), nodesAt(6.7, {}, 4321).map(n => n.bounds));
});

test("long phrases fit completely on portrait, square and landscape canvases", () => {
    const longWords = "sleeping wake up you're playing this me stupid they take a think wanna picture name world make our say them slowly and finally another word here".split(" ");
    const longLine = line(longWords.join(" "), 0, longWords.length, 7);
    const modes = [[710,400],[1080,1080],[1080,1920],[1920,1080],[3000,3000]];
    for (const [width,height] of modes) {
        for (const settings of [
            style,
            { ...style, kineticSpacing:100, kineticVariation:100, fontScale:2 },
            { ...style, kineticSpacing:0, kineticVariation:0, fontScale:0.1 }
        ]) {
            const nodes = kinetic.buildFrame(context(), longLine, longWords.length-0.2,
                width, height, settings, 55).groups.at(-1).nodes;
            assert.equal(nodes.length, longWords.length);
            assertNoCollisions(nodes);
            for (const node of nodes) {
                assert.ok(node.bounds.x >= width * 0.039);
                assert.ok(node.bounds.y >= height * 0.039);
                assert.ok(node.bounds.x + node.bounds.width <= width * 0.961);
                assert.ok(node.bounds.y + node.bounds.height <= height * 0.961);
            }
        }
    }
});

test("repeated words do not overwrite one another", () => {
    const repeated = line("up up up up up up up up up up up up",0,12,42);
    const nodes = kinetic.buildFrame(context(), repeated,11.5,710,400,style,9).groups[0].nodes;
    assert.equal(nodes.length,12);
    assertNoCollisions(nodes);
});

test("scene size is based on LRC lines rather than a word limit", () => {
    assert.deepEqual(nodesAt(7.5,{kineticLines:3}).map(n=>n.text),
        ["name","and","world","say","them","make","our","sleeping"]);
    assert.deepEqual(nodesAt(6.5,{kineticLines:1}).map(n=>n.text),
        ["say","them","make","our"]);
    assert.equal(kinetic.normalize({kineticLines:100}).lines,4);
    assert.equal(kinetic.normalize({kineticLines:-2}).lines,1);
});

test("instrumental breaks and silent pauses terminate the previous collage", () => {
    const rest = {text:"",displayStart:7,displayEnd:9,timedWords:[]};
    const altered = [timeline[0],rest,line("new scene",9,11,2)];
    const ctx = context();
    assert.equal(kinetic.buildTimelineFrame(ctx,altered,8,710,400,style).groups.length,0);
    assert.deepEqual(kinetic.buildTimelineFrame(ctx,altered,10.5,710,400,style).groups[0].nodes.map(n=>n.text),
        ["new","scene"]);
    assert.equal(kinetic.buildTimelineFrame(ctx,altered,12,710,400,style).groups.length,0);
});

test("long gap without explicit blank line creates a separate composition", () => {
    const song = [line("one two",0,2,0),line("three four",4,6,1)];
    const result = kinetic.buildTimelineFrame(context(),song,5.1,710,400,
        {...style,kineticLines:4},42);
    assert.deepEqual(result.groups[0].nodes.map(n=>n.text),["three","four"]);
});

test("missing enhanced timing is inferred and settings are bounded", () => {
    const bare = {text:"first second third",displayStart:0,displayEnd:3,vocalEnd:3};
    const words = kinetic.buildFrame(context(),bare,2.6,710,400,style,13).groups[0].nodes;
    assert.deepEqual(words.map(n=>n.text),["first","second","third"]);
    assert.equal(kinetic.normalize({kineticSpacing:300}).spacing,100);
    assert.equal(kinetic.normalize({kineticVariation:300}).variation,1);
    assert.equal(kinetic.normalize({kineticMotion:-5}).motion,0);
});
