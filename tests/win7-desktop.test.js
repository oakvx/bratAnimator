const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Boot = require("../assets/js/win7-boot.js");
const Menu = require("../assets/js/win7-window-menu.js");

function fakeBoot(reduced = false) {
    const classes = new Set();
    const overlayClasses = new Set();
    const events = new Map();
    const emitted = [];
    let completion;
    let progressTicker;
    const overlay = {
        hidden: true,
        classList: { add(name) { overlayClasses.add(name); } },
        setAttribute(name, value) { this[name] = value; }
    };
    const progress = {
        value: 0,
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; }
    };
    const skip = {
        listeners: {},
        addEventListener(event, cb) { this.listeners[event] = cb; },
        removeEventListener(event) { delete this.listeners[event]; },
        click() { this.listeners.click?.(); }
    };
    const ids = {studioBoot:overlay, studioBootSkip:skip, studioBootProgress:progress};
    const document = {
        body: { classList: {
            add(name) { classes.add(name); }, remove(name) { classes.delete(name); }
        }},
        getElementById(id) { return ids[id]; },
        addEventListener(event, callback) { events.set(event, callback); },
        removeEventListener(event) { events.delete(event); }
    };
    const win = {
        matchMedia() { return { matches: reduced }; },
        setTimeout(fn) { completion = fn; return 1; },
        clearTimeout() { completion = null; },
        setInterval(fn) { progressTicker = fn; return 2; },
        clearInterval() { progressTicker = null; },
        CustomEvent: class {
            constructor(type, detail) { this.type = type; this.detail = detail.detail; }
        },
        dispatchEvent(event) { emitted.push(event); }
    };
    return { document, win, overlay, skip, progress, classes, events, emitted,
        complete() { completion?.(); }, tick() { progressTicker?.(); } };
}

test("boot sequence shows its visual overlay and completes to desktop once", async () => {
    const ctx = fakeBoot();
    const boot = Boot.createBoot(ctx.document, ctx.win, {duration:1000});
    assert.equal(boot.isVisible(), true);
    assert.equal(ctx.overlay.hidden, false);
    assert.ok(ctx.classes.has("studio-booting"));
    assert.equal(ctx.progress.value, 0);
    ctx.complete();
    const result = await boot.ready;
    assert.equal(result.reason, "completed");
    assert.equal(result.skipped, false);
    assert.equal(ctx.overlay.hidden, true);
    assert.equal(ctx.progress.value, 100);
    assert.equal(ctx.emitted.length, 1);
    assert.equal(ctx.emitted[0].type, "brat:studio-boot-finished");
    assert.equal(boot.finish(), false, "completion must be idempotent");
    assert.equal(ctx.emitted.length, 1);
});
test("Escape/skip exits safely and never leaves timer or handlers running", async () => {
    const ctx = fakeBoot();
    const boot = Boot.createBoot(ctx.document, ctx.win, {duration:1800});
    assert.equal(ctx.events.has("keydown"), true);
    ctx.skip.click();
    assert.equal((await boot.ready).skipped, true);
    assert.equal(boot.wasSkipped(), true);
    assert.equal(ctx.events.has("keydown"), false);
    assert.equal(ctx.skip.listeners.click, undefined);
    assert.equal(ctx.classes.has("studio-booting"), false);
    assert.equal(ctx.classes.has("studio-boot-complete"), true);
    assert.equal(boot.skip(), undefined);
    assert.equal(ctx.emitted.length, 1);
});
test("prefers-reduced-motion shortens boot without suppressing presentation", () => {
    const ctx = fakeBoot(true);
    const boot = Boot.createBoot(ctx.document, ctx.win);
    assert.equal(boot.duration, Boot.REDUCED_MS);
    boot.skip();
});
test("7.css menubar includes actionable File/Edit/View/Tools/Help groups", () => {
    const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
    const css = fs.readFileSync(path.join(__dirname, "../vendor/7css/7.scoped.css"), "utf8");
    assert.match(html, /id="studioWin7MenuBar" role="menubar"/);
    assert.equal((html.match(/<li role="menuitem" tabindex="[^"]+" aria-haspopup="true"/g) || []).length, 5);
    for (const action of ["new","projects","editor","timeline","minimize","maximize","help","about","settings","sounds"]) {
        assert.ok(html.includes('data-win7-command="' + action + '"'), action + " missing");
    }
    assert.match(css, /\[role=menubar\]/);
    assert.match(css, /\[role=menu\]/);
    assert.equal(Menu.VIEWS.timeline, "editor");
    assert.equal(Menu.VIEWS.sounds, "sounds");
});
test("all boot/menu modules are loaded and precached without binary OS resources", () => {
    const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
    const sw = fs.readFileSync(path.join(__dirname, "../sw.js"), "utf8");
    for (const file of [
        "assets/js/win7-boot.js","assets/js/win7-window-menu.js",
        "assets/css/win7-boot.css","assets/css/win7-desktop-polish.css"
    ]) {
        assert.ok(html.includes(file), "HTML missing "+file);
        assert.ok(sw.includes("./"+file), "service worker missing "+file);
    }
    assert.ok(html.includes('id="studioBootSkip"'));
    assert.ok(html.includes('id="studioShowDesktop"'));
    assert.ok(html.includes('id="studioAboutDialog"'));
    assert.doesNotMatch(sw, /"\.\/assets\/sounds\/windows7\/.*\.wav"/);
});
