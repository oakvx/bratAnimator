const test = require("node:test");
const assert = require("node:assert/strict");
const api = require("../assets/js/win7-start-menu.js");

function fixture() {
    const handlers = new Map();
    function el(id, dataset = {}, textContent = "") {
        const listeners = new Map();
        const attrs = new Map();
        return {
            id, dataset, textContent, value: "", hidden: false, disabled: false,
            focusCount: 0, clickCount: 0,
            addEventListener(type, callback) { listeners.set(type, callback); },
            setAttribute(name, value) { attrs.set(name, String(value)); },
            getAttribute(name) { return attrs.get(name) || null; },
            focus() { this.focusCount++; },
            click() { this.clickCount++; },
            contains(target) { return target === this; },
            closest() { return this.dataset.startView || this.dataset.startAction ? this : null; },
            fire(type, target = this, key = "") {
                const event = { target, key, preventDefault() {}, stopPropagation() {} };
                listeners.get(type)?.(event);
                return event;
            }
        };
    }
    const menu = el("studioStartMenu"); menu.hidden = true;
    const start = el("studioStartButton");
    const search = el("studioStartSearch");
    const empty = el("studioStartEmpty"); empty.hidden = true;
    const results = el("studioStartResults");
    const entries = [
        el("new", { startAction: "new", startKeywords: "nuovo progetto video" }, "Nuovo progetto"),
        el("sounds", { startView: "sounds", startKeywords: "musica sound hub audio" }, "Sound Hub"),
        el("projects", { startView: "projects", startKeywords: "progetti archivio" }, "Progetti"),
        el("account", { startAction: "account" }, "Account"),
        el("close", { startAction: "close" }, "Chiudi finestra")
    ];
    results.querySelectorAll = () => entries;
    menu.contains = target => target === menu || target === search || entries.includes(target);
    const newButton = el("studioNewProject");
    const accountButton = el("studioNavAccount");
    const elements = { studioStartMenu:menu, studioStartButton:start, studioStartSearch:search, studioStartEmpty:empty,
        studioStartResults:results, studioNewProject:newButton, studioNavAccount:accountButton };
    const document = {
        body: { classList: { contains: () => false } },
        getElementById(id) { return elements[id] || null; },
        addEventListener(type, callback) { handlers.set("document:" + type, callback); },
        fire(type, target, key) { handlers.get("document:" + type)?.({target,key}); }
    };
    const calls = [];
    const win = {
        addEventListener(type, callback) { handlers.set("window:" + type, callback); },
        emit(type) { handlers.get("window:" + type)?.(); },
        BratStudio: { show(view) { calls.push(view); } },
        BratWin7ShellInstance: { restore() { calls.push("restore"); }, close() { calls.push("close"); } }
    };
    const controller = api.createStartMenu(document, win);
    return {menu,start,search,empty,entries,document,win,newButton,accountButton,controller,calls};
}

test("Start search is case and accent insensitive, with no external service", () => {
    assert.equal(api.matchesQuery("Impostazioni", "IMPOSTA"), true);
    assert.equal(api.matchesQuery("Musíca locale", "musica"), true);
    assert.equal(api.matchesQuery("Sound Hub", "bratcode"), false);
    assert.equal(api.matchesQuery("BRATCODE", ""), true);
    const source = require("node:fs").readFileSync(require("node:path").join(__dirname, "../assets/js/win7-start-menu.js"), "utf8");
    assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|localStorage|indexedDB/);
});

test("Start opens, filters, handles keyboard input and dismisses outside clicks", () => {
    const f = fixture();
    assert.equal(f.controller.isOpen(), false);
    f.start.fire("click");
    assert.equal(f.controller.isOpen(), true);
    assert.equal(f.start.getAttribute("aria-expanded"), "true");
    assert.equal(f.search.focusCount, 1);
    f.search.value = "MÚSICA";
    f.search.fire("input");
    assert.deepEqual(f.entries.filter(entry => !entry.hidden).map(entry => entry.id), ["sounds"]);
    f.search.fire("keydown"); // The listener is attached to the menu, not the input.
    f.menu.fire("keydown", f.search, "ArrowDown");
    assert.equal(f.entries[1].focusCount, 1);
    f.search.value = "parola inesistente";
    f.search.fire("input");
    assert.equal(f.empty.hidden, false);
    f.menu.fire("keydown", f.search, "Escape");
    assert.equal(f.controller.isOpen(), false);
    assert.equal(f.start.focusCount, 1);
    f.start.fire("click");
    f.document.fire("pointerdown", f.newButton);
    assert.equal(f.controller.isOpen(), false);
});

test("Start routes to the existing local studio without bypassing its APIs", () => {
    const f = fixture();
    f.start.fire("click");
    f.menu.fire("click", f.entries[1]);
    assert.deepEqual(f.calls, ["restore","sounds"]);
    assert.equal(f.controller.isOpen(), false);
    f.start.fire("click");
    f.menu.fire("click", f.entries[0]);
    assert.equal(f.newButton.clickCount, 1);
    f.start.fire("click");
    f.menu.fire("click", f.entries[3]);
    assert.equal(f.accountButton.clickCount, 1);
    f.start.fire("click");
    f.menu.fire("click", f.entries[4]);
    assert.equal(f.calls.at(-1), "close");
    f.start.fire("click");
    f.win.emit("brat:studio-view");
    assert.equal(f.controller.isOpen(), false);
});

test("Start menu stays inert when the editor is foregrounded", () => {
    const f = fixture();
    f.document.body.classList.contains = value => value === "studio-editor-open";
    f.controller.open();
    assert.equal(f.controller.isOpen(), false);
});
