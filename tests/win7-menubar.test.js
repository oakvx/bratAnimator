const test = require("node:test");
const assert = require("node:assert/strict");
const Menu = require("../assets/js/win7-window-menu.js");

// dom finto minimo: solo quello che la menubar usa davvero
function node(kind, props = {}) {
    const attrs = new Map(Object.entries(props.attrs || {}));
    const listeners = new Map();
    const self = {
        kind, dataset: props.dataset || {}, parent: null, children: [], focused: 0,
        getAttribute: name => attrs.has(name) ? attrs.get(name) : null,
        setAttribute: (name, value) => attrs.set(name, String(value)),
        addEventListener: (type, fn) => listeners.set(type, fn),
        focus() { self.focused += 1; },
        contains(target) { for (let n = target; n; n = n.parent) if (n === self) return true; return false; },
        closest(selector) {
            for (let n = self; n; n = n.parent) {
                if (selector === "button[data-win7-command]" && n.kind === "button" && n.dataset.win7Command) return n;
                if (selector === "button" && n.kind === "button") return n;
                if (selector === '[aria-haspopup="true"]' && n.getAttribute("aria-haspopup") === "true") return n;
            }
            return null;
        },
        querySelector(selector) {
            const stack = [...self.children];
            while (stack.length) {
                const n = stack.shift();
                if (selector === "button" && n.kind === "button") return n;
                if (selector === "button[data-win7-command]" && n.kind === "button" && n.dataset.win7Command) return n;
                stack.push(...n.children);
            }
            return null;
        },
        append(...kids) { for (const kid of kids) { kid.parent = self; self.children.push(kid); } return self; },
        fire(type, event) { listeners.get(type)?.(event); }
    };
    return self;
}
function event(target, key = "") {
    return { target, key, prevented: false, stopped: false,
        preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
}
function fixture() {
    const menu = node("ul");
    const file = node("li", { attrs: { "aria-haspopup": "true", "aria-expanded": "false" } });
    const edit = node("li", { attrs: { "aria-haspopup": "true", "aria-expanded": "false" } });
    const demo = node("button");
    const undo = node("button", { dataset: { win7Command: "undo" } });
    file.append(node("ul").append(demo));
    edit.append(node("ul").append(undo));
    menu.append(file, edit);
    const docListeners = new Map();
    const document = { addEventListener: (type, fn) => docListeners.set(type, fn) };
    const win = { addEventListener() {} };
    const ran = [];
    const bar = Menu.createMenuBar(menu, { run: command => ran.push(command), document, win });
    return { menu, file, edit, demo, undo, bar, ran, docListeners };
}

test("un bottone senza comando chiude il menu e lascia passare il click", () => {
    const { menu, file, demo, bar, ran } = fixture();
    menu.fire("click", event(file));
    assert.equal(bar.isOpen(), true);
    assert.equal(file.getAttribute("aria-expanded"), "true");
    const click = event(demo);
    menu.fire("click", click);
    assert.equal(bar.isOpen(), false);
    assert.equal(click.prevented, false);
    assert.deepEqual(ran, []);
});

test("un bottone con comando esegue il comando", () => {
    const { menu, edit, undo, bar, ran } = fixture();
    menu.fire("click", event(edit));
    const click = event(undo);
    menu.fire("click", click);
    assert.deepEqual(ran, ["undo"]);
    assert.equal(click.prevented, true);
    assert.equal(bar.isOpen(), false);
});

test("esc chiude e freccia destra passa al menu successivo", () => {
    const { menu, file, edit, bar } = fixture();
    menu.fire("click", event(file));
    menu.fire("keydown", event(file, "ArrowRight"));
    assert.equal(edit.getAttribute("aria-expanded"), "true");
    assert.equal(file.getAttribute("aria-expanded"), "false");
    menu.fire("keydown", event(edit, "Escape"));
    assert.equal(bar.isOpen(), false);
});

test("click fuori dal menu lo chiude", () => {
    const { menu, file, bar, docListeners } = fixture();
    menu.fire("click", event(file));
    docListeners.get("pointerdown")(event(node("div")));
    assert.equal(bar.isOpen(), false);
});
