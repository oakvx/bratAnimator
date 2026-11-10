const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Menu = require("../assets/js/win7-window-menu.js");

test("the boot dialog renders supplied frames and starts hidden", () => {
    const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
    assert.match(html, /<dialog id="studioBoot"[^>]+hidden>/);
    assert.match(html, /<canvas id="studioBootFrames" width="200" height="200"/);
    assert.doesNotMatch(html, /win7-boot-pane|studioBootProgress/);
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
        "assets/js/win7-boot.js","assets/js/win7-assets.js","assets/js/win7-window-menu.js",
        "assets/css/win7-boot.css","assets/css/win7-desktop-polish.css"
    ]) {
        assert.ok(html.includes(file), "HTML missing "+file);
        assert.ok(sw.includes("./"+file), "service worker missing "+file);
    }
    assert.ok(html.includes('id="studioBootSkip"'));
    assert.ok(html.includes('id="studioShowDesktop"'));
    assert.ok(html.includes('id="studioAboutDialog"'));
    assert.doesNotMatch(sw, /"(?:[^"]*activity\.(?:bmp|png)|[^"]*windows7\/.*\.wav)"/);
    assert.ok(html.indexOf('src="assets/js/win7-sound-pack.js"') < html.indexOf('src="assets/js/win7-assets.js"'));
    assert.ok(html.indexOf('src="assets/js/win7-assets.js"') < html.indexOf('src="assets/js/win7-boot.js"'));
});
