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
test("optional shell sounds use recordings and a user preference", () => {
    const html = file("index.html");
    const source = file("assets/js/dashboard-audio.js");
    assert.match(html, /id="studioSoundToggle"/);
    assert.match(html, /id="studioSettingsSound"/);
    assert.match(source, /BratWin7Assets/);
    assert.match(source, /addEventListener\("click", handleClick, \{ capture: true \}\)/);
    assert.match(source, /#studioEditorChrome/);
    assert.doesNotMatch(source, /AudioContext|createOscillator|fetch\(/);
});

test("l'editor è una finestra 7.css con menu, toolbar e barra di stato", () => {
    const html = file("index.html");
    const start = html.indexOf('id="studioEditorChrome"');
    assert.ok(start > 0, "finestra editor mancante");
    const end = html.indexOf('id="permissionNotice"', start);
    assert.ok(end > html.indexOf("</main>", start), "anteprima e timeline devono stare dentro la finestra");
    const editor = html.slice(start, end);
    const menuStart = editor.indexOf('id="editorMenuBar"');
    const menuEnd = editor.indexOf('id="editorToolbar"');
    assert.ok(menuStart > 0 && menuEnd > menuStart, "menubar prima della toolbar");
    const menu = editor.slice(menuStart, menuEnd);
    assert.match(menu, /role="menubar"/);
    for (const id of ["loadDemoBtn", "commandPaletteBtn", "tutorialBtn", "bgBtn", "darkBtn", "togglePanelBtn",
        "textSettingsBtn", "permissionLink"]) {
        assert.match(menu, new RegExp('id="' + id + '"'), id + " deve stare nel menu");
    }
    for (const command of ["undo", "redo", "about", "close-editor"]) {
        assert.match(menu, new RegExp('data-win7-command="' + command + '"'), command + " nel menu");
    }
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), [], "id duplicati");
    assert.equal((menu.match(/class="lang-btn"/g) || []).length, 4, "4 lingue nel menu");
    assert.match(editor, /id="panel"/);
    assert.match(editor, /id="previewCanvas"/);
    const status = editor.slice(editor.indexOf('class="status-bar"'));
    for (const id of ["statusDuration", "statusFormat", "statusFps", "statusLines"]) {
        assert.match(status, new RegExp('id="' + id + '"'));
    }
    assert.doesNotMatch(html, /<header class="topbar/);
    assert.doesNotMatch(html, /class="project-status-bar"/);
    assert.doesNotMatch(menu + editor.slice(menuEnd, editor.indexOf('class="window-body')), /<svg/);
});

test("la x della guida usa l'icona di chiusura 7.css", () => {
    assert.match(file("index.html"), /id="tutorialWindowClose"[^>]*aria-label="Close"/);
});

test("l'editor ha un solo css windows 7, senza !important", () => {
    const html = file("index.html");
    const css = file("assets/css/win7-editor.css");
    assert.doesNotMatch(css, /!important/);
    assert.doesNotMatch(html, /assets\/css\/editor-layout\.css/);
    const vendor = html.indexOf("vendor/7css/7.scoped.css");
    const editor = html.indexOf("assets/css/win7-editor.css");
    assert.ok(editor > vendor, "win7-editor.css dopo 7.css");
    const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m => m[1]);
    assert.equal(links.at(-1), "assets/css/win7-editor.css", "win7-editor.css è l'ultimo foglio di stile");
});
