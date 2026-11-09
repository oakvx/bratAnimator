const test = require("node:test");
const assert = require("node:assert/strict");
const Plan = require("../assets/js/export-plan.js");
const Engine = require("../assets/js/export-engine.js");

test("phase 13 plan normalizes dimensions and produces deterministic microsecond frames", () => {
    const plan = Plan.create({ width: 1081, height: 1921, fps: 30, start: 1.8, end: 2.3 });
    assert.deepEqual([plan.width, plan.height, plan.fps, plan.totalFrames], [1082, 1922, 30, 15]);
    assert.equal(Plan.frameAt(plan, 0).sourceTime, 1.8);
    assert.ok(Math.abs(Plan.frameAt(plan, 14).sourceTime - (1.8 + 14 / 30)) < 1e-9);
    assert.equal(Plan.frameAt(plan, 0).timestamp, 0);
    assert.equal(Plan.frameAt(plan, 14).timestamp, 466667);
    assert.ok(Object.isFrozen(plan));
    assert.throws(() => Plan.frameAt(plan, 15), RangeError);
});

test("phase 13 rejects impossible export settings", () => {
    for (const config of [
        { width: 0, height: 1080, fps: 30, start: 0, end: 1 },
        { width: 1920, height: 1080, fps: 0, start: 0, end: 1 },
        { width: 1920, height: 1080, fps: 30, start: 5, end: 4 },
        { width: Infinity, height: 1080, fps: 30, start: 0, end: 1 },
        { width: 1920, height: 1080, fps: 30, start: -1, end: 1 }
    ]) assert.throws(() => Plan.create(config), RangeError);
});

test("clip crop retains absolute source offset instead of restarting audio", () => {
    const plan = Plan.create({ width: 720, height: 720, fps: 24, start: 5, end: 9 });
    const buffer = { duration: 20 };
    const clip = { buffer, start: 3, duration: 10, offset: 2, volume: 0.6 };
    assert.deepEqual(Plan.clipWindow(clip, plan), {
        sourceOffset: 4, destinationOffset: 0, duration: 4,
        clipStart: 3, clipEnd: 13, overlapStart: 5, overlapEnd: 9,
        volume: 0.6, fadeIn: 0, fadeOut: 0
    });
    assert.equal(Plan.clipWindow({ buffer, start: 12, duration: 2 }, plan), null);
    assert.equal(Plan.clipWindow({ buffer, start: 5, muted: true }, plan), null);
});

test("clip start, fade and end values survive export cropping", () => {
    const plan = Plan.create({ width: 720, height: 720, fps: 24, start: 2, end: 8 });
    const window = Plan.clipWindow({
        buffer: { duration: 20 }, start: 1, duration: 8, fadeIn: 2, fadeOut: 2, volume: 0.8
    }, plan);
    assert.ok(Math.abs(Engine.gainAt(window, 2) - 0.4) < 1e-9);
    assert.equal(Engine.gainAt(window, 3), 0.8);
    assert.equal(Engine.gainAt(window, 7), 0.8);
    assert.ok(Math.abs(Engine.gainAt(window, 8) - 0.4) < 1e-9);
});

test("mixed tracks are scheduled separately in the same export timebase", () => {
    const events = [];
    const destination = {};
    const context = {
        createBufferSource: () => ({
            connect() {}, start(...args) { events.push(["start", ...args]); }
        }),
        createGain: () => ({
            connect() {}, gain: {
                setValueAtTime(...args) { events.push(["gain", ...args]); },
                linearRampToValueAtTime(...args) { events.push(["ramp", ...args]); }
            }
        })
    };
    const plan = Plan.create({ width: 720, height: 720, fps: 30, start: 4, end: 8 });
    const clips = [
        { buffer: { duration: 20 }, start: 0, offset: 2, volume: 0.5 },
        { buffer: { duration: 20 }, start: 6, duration: 3, offset: 1, volume: 1 }
    ];
    const nodes = Engine.scheduleAudio(context, destination, clips, plan, 0.25);
    assert.equal(nodes.length, 2);
    assert.deepEqual(events.filter(e => e[0] === "start"), [
        ["start", 0.25, 6, 4],
        ["start", 2.25, 1, 2]
    ]);
});

test("capability probing never promises fast MP4 without required codecs", async () => {
    const plan = Plan.create({ width: 720, height: 1280, fps: 30, start: 0, end: 1 });
    const unavailable = await Engine.probe({
        plan, environment: { MediaRecorder: class {} }, loadMuxer: async () => ({})
    });
    assert.equal(unavailable.fast, false);
    assert.equal(unavailable.fallback, true);
    class VideoEncoder { static async isConfigSupported() { return { supported: true }; } }
    const audioUnsupported = await Engine.probe({
        plan, audioClips: [{ buffer: { duration: 2 } }], environment: {
            VideoEncoder, VideoFrame: class {}, MediaRecorder: class {}
        }, loadMuxer: async () => ({})
    });
    assert.equal(audioUnsupported.fast, false);
    const videoSupported = await Engine.probe({
        plan, environment: { VideoEncoder, VideoFrame: class {} }, loadMuxer: async () => ({})
    });
    assert.equal(videoSupported.fast, true);
});

test("MediaRecorder MIME selection respects audio tracks", () => {
    const environment = { MediaRecorder: { isTypeSupported: type => type === "video/webm;codecs=vp8,opus" } };
    assert.equal(Engine.chooseMime(environment, true), "video/webm;codecs=vp8,opus");
    assert.equal(Engine.chooseMime(environment, false), "");
});
