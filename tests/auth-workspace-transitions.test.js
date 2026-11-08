const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function harness() {
    // Exercise the actual private controller with its UI/storage boundaries stubbed.
    const source = fs.readFileSync(require.resolve("../assets/js/studio-dashboard.js"), "utf8");
    const start = source.indexOf("    function queueAuthChange(user)");
    const end = source.indexOf("    // Register dashboard controls", start);
    assert.ok(start >= 0 && end > start);
    const root = {};
    vm.runInNewContext(`
        let authChanging = Promise.resolve(), currentUserId = null, initialSessionHandled = false;
        let recoveryPending = false, view = "editor", ownerId = "guest";
        const switches = [], errors = [];
        const editor = { owner: () => ownerId, switchOwner: async owner => { ownerId = owner; },
            store: { getActive: async () => null } };
        const profile = () => {}, renderProjects = async () => {}, refreshCode = async () => {};
        const viewSwitch = value => { view = value; switches.push(value); };
        const closeAuth = () => {}, notify = message => errors.push(message);
        ${source.slice(start, end)}
        globalThis.controller = {
            async dispatch(user) { queueAuthChange(user); await authChanging; },
            setView(value) { view = value; },
            snapshot() { return { view, owner: ownerId, switches: [...switches], errors: [...errors] }; }
        };
    `, root);
    return root.controller;
}

test("duplicate initial guest sessions preserve the open editor", async () => {
    const app = harness();
    await app.dispatch(null);
    await app.dispatch(null);
    assert.equal(app.snapshot().view, "editor");
    assert.equal(app.snapshot().switches.length, 0);
    assert.equal(app.snapshot().errors.length, 0);
});

test("session refresh for the same account preserves the current dashboard view", async () => {
    const app = harness();
    await app.dispatch({ id: "account-one" });
    app.setView("sounds");
    await app.dispatch({ id: "account-one" });
    assert.equal(app.snapshot().view, "sounds");
    assert.equal(app.snapshot().owner, "user:account-one");
});

test("account switches and logout still select the correct local owner", async () => {
    const app = harness();
    await app.dispatch({ id: "account-one" });
    assert.equal(app.snapshot().owner, "user:account-one");
    await app.dispatch({ id: "account-two" });
    assert.equal(app.snapshot().owner, "user:account-two");
    app.setView("editor");
    await app.dispatch(null);
    assert.equal(app.snapshot().owner, "guest");
    assert.equal(app.snapshot().view, "home");
});
