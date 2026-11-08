const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function file(relative) { return fs.readFileSync(path.join(__dirname, "..", relative), "utf8"); }

test("the complete official 7.css is vendored, scoped and loaded before app layout", () => {
    const html=file("index.html");
    const vendor=file("vendor/7css/7.scoped.css");
    const app=file("assets/css/studio-win7.css");
    assert.match(vendor,/7\.css v0\.21\.0/);
    assert.ok(vendor.length > 60000,"complete distribution, not a custom imitation");
    assert.match(vendor,/\.win7\b/);
    assert.match(html,/href="vendor\/7css\/7\.scoped\.css"/);
    assert.match(html,/href="assets\/css\/studio-win7\.css"/);
    assert.ok(html.indexOf('vendor/7css/7.scoped.css') < html.indexOf('assets/css/studio-win7.css'));
    assert.doesNotMatch(html,/href="assets\/css\/(?:aero-theme|classic-desktop|win7-app|studio-dashboard)\.css"/);
    assert.match(app,/#studioMainWindow/);
    assert.doesNotMatch(app,/#previewCanvas\s*\{|\.stage-canvas-zone\s*\{/);
});

test("native 7.css modal wrappers are visible without URL :target", () => {
    const html=file("index.html");
    const css=file("assets/css/studio-win7.css");
    for (const id of [
        "studioAuthDialog","studioProjectDialog","studioLogoutDialog",
        "studioTikTokDialog","studioSoundCollectionDialog","studioSoundConfirmDialog"
    ]) {
        const start=html.indexOf('id="'+id+'"');
        const first=html.indexOf('<section',start);
        assert.ok(start > 0 && first > start,id);
        const opener=html.slice(start-5,first);
        assert.match(opener,/role="dialog" aria-modal="true"/,id+" has accessible dialog");
        assert.doesNotMatch(html.slice(first,first+120),/role="dialog"/,id+" avoids hidden target-only 7.css rule");
    }
    assert.match(css,/\.studio-modal-backdrop\.win7 > \.studio-modal\.window\.active/);
    assert.match(css,/backdrop-filter:none/);
    assert.match(css,/visibility:visible;opacity:1/);
    assert.match(html,/class="title-bar"/);
    assert.match(html,/class="window-body"/);
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
