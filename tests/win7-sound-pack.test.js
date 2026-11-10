const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const packSource = fs.readFileSync(path.join(root, "assets/js/win7-sound-pack.js"), "utf8");
const audioSource = fs.readFileSync(path.join(root, "assets/js/dashboard-audio.js"), "utf8");

function createPage(activated = false, imported = {}) {
    const requested = [];
    const listeners = {};
    const audioEvents = [];
    function Audio(src) {
        requested.push(src);
        this.volume = 1;
        this.preload = "";
        this.addEventListener = (event, listener) => audioEvents.push({ event, listener });
        this.play = () => Promise.resolve();
    }
    const page = {
        URL,
        Audio,
        BratWin7Assets: { getUrl: key => imported[key] },
        AudioContext: class { constructor() { throw new Error("Synthetic UI audio was requested."); } },
        document: {
            baseURI: "https://example.test/bratAnimator/index.html",
            readyState: "complete",
            body: { classList: { contains: () => false } },
            querySelectorAll: () => [],
            addEventListener: (event, handler) => { listeners[event] = handler; }
        },
        localStorage: { getItem: () => null, setItem() {} },
        addEventListener(event, handler) { listeners["window:" + event] = handler; }
    };
    page.globalThis = page;
    vm.runInNewContext(packSource.replace("const installed = false;", "const installed = " + activated + ";"), page);
    vm.runInNewContext(audioSource, page);
    return { page, requested, audioEvents, listeners };
}

test("15 stable optional WAV names are mapped without shipping binary recordings", () => {
    const { page } = createPage();
    const pack = page.BratWindows7SoundPack;
    assert.equal(pack.installed, false);
    assert.equal(Object.keys(pack.files).length, 15);
    const names = Object.values(pack.files);
    assert.equal(new Set(names).size, 15);
    for (const file of names) {
        assert.match(file, /^[a-z0-9-]+\.wav$/);
        assert.equal(fs.existsSync(path.join(root, "assets/sounds/windows7", file)), false,
            "The example package must not ship third-party WAV audio: " + file);
    }
    assert.equal(pack.resolve("navigation"), "assets/sounds/windows7/navigation-start.wav");
    assert.equal(pack.resolve("../secret"), null);
    assert.equal(pack.resolve("missing"), null);
});
test("the shell is silent without an installed recording", () => {
    const { page, requested } = createPage();
    assert.equal(page.BratDashboardAudio.isEnabled(), true);
    page.BratDashboardAudio.play("menu");
    assert.equal(requested.length, 0);
    assert.equal(page.BratDashboardAudio.packStatus().installed, false);
});
test("enabled pack selects correct local assets and volume without external origin", () => {
    const { page, requested } = createPage(true);
    assert.equal(page.BratDashboardAudio.packStatus().installed, true);
    page.BratDashboardAudio.play("navigation");
    assert.deepEqual(requested, ["https://example.test/bratAnimator/assets/sounds/windows7/navigation-start.wav"]);
});
test("a locally imported WAV takes priority over the hosted mapping", () => {
    const { page, requested } = createPage(true, { "sound:navigation": "blob:https://example.test/recording" });
    page.BratDashboardAudio.play("navigation");
    assert.deepEqual(requested, ["blob:https://example.test/recording"]);
});
test("window and Start events route to their intended Windows 7 placeholders", () => {
    const { page } = createPage();
    const route = page.BratDashboardAudio.soundForButton;
    const button = (id, selector = "", dataset = {}) => ({
        id, dataset, matches: pattern => pattern.split(",").some(s => s.trim() === selector)
    });
    assert.equal(route(button("studioWindowMinimize")), "minimize");
    assert.equal(route(button("studioWindowMaximize")), "maximize");
    assert.equal(route(button("studioWindowClose")), "close");
    assert.equal(route(button("studioStartButton")), "menu");
    assert.equal(route(button("", "", { startAction: "close" })), "logoff");
    assert.equal(route(button("", "[data-studio-view]")), "navigation");
    assert.equal(route(button("studioTaskbarApp")), "restore");
    assert.equal(route(button("studioNavAccount")), "click");
});
test("script ordering and offline cache include configuration, never optional WAV files", () => {
    const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
    const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
    const a = html.indexOf('src="assets/js/win7-sound-pack.js"');
    const b = html.indexOf('src="assets/js/dashboard-audio.js"');
    assert.ok(a > 0 && b > a, "The pack must load before the audio runtime");
    assert.match(sw, /"\.\/assets\/js\/win7-sound-pack\.js"/);
    assert.doesNotMatch(sw, /"\.\/assets\/sounds\/windows7\/.*\.wav"/i);
    const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
    assert.match(gitignore, /assets\/sounds\/windows7\/\*\.wav/);
});
