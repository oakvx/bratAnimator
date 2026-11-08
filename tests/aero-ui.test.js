const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function file(relative) { return fs.readFileSync(path.join(__dirname, "..", relative), "utf8"); }

test("Frutiger Aero theme is opt-in to dashboard and leaves editor canvas untouched", () => {
    const html = file("index.html");
    const css = file("assets/css/aero-theme.css");
    assert.match(html, /assets\/css\/aero-theme\.css/);
    assert.match(css, /\.studio-dashboard\s*\{/);
    assert.match(css, /\.studio-hero\s*\{/);
    assert.doesNotMatch(css, /\.page-shell\s*\{/);
    assert.doesNotMatch(css, /#previewCanvas\s*\{/);
});

test("7.css is scoped to session dialog instead of injecting global element styles", () => {
    const html = file("index.html");
    assert.match(html, /assets\/css\/win7-app\.css/);
    assert.match(file("assets/css/win7-app.css"), /@import url\("https:\/\/unpkg\.com\/7\.css@0\.21\.1\/dist\/7\.scoped\.css"\)/);
    assert.match(html, /id="studioLogoutDialog" class="studio-modal-backdrop win7"/);
    assert.match(html, /class="studio-modal window active"/);
    assert.match(html, /class="title-bar"/);
    assert.match(html, /class="window-body"/);
});

test("optional synthesized sounds are a dashboard-only user preference", () => {
    const html = file("index.html");
    const source = file("assets/js/dashboard-audio.js");
    assert.match(html, /id="studioSoundToggle"/);
    assert.match(html, /id="studioSettingsSound"/);
    assert.match(source, /AudioContextClass/);
    assert.match(source, /addEventListener\("click", handleClick, \{ capture: true \}\)/);
    assert.match(source, /studio-editor-open/);
    assert.doesNotMatch(source, /\.mp3|\.wav|fetch\(/);
});
