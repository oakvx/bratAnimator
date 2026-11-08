const test = require("node:test");
const assert = require("node:assert/strict");
const Workspace = require("../assets/js/local-workspace.js");

function fakeIndexedDB() {
    const records = new Map();
    let initialized = false;
    const db = {
        objectStoreNames: { contains: name => initialized && name === "projects" },
        createObjectStore(name) {
            assert.equal(name, "projects");
            initialized = true;
        },
        close() {},
        transaction(name) {
            assert.equal(name, "projects");
            let running = 0;
            let stopped = false;
            let notified = false;
            const tx = {
                error: null,
                oncomplete: null,
                onerror: null,
                onabort: null,
                abort() {
                    stopped = true;
                    queueMicrotask(() => tx.onabort?.());
                }
            };
            function finished() {
                if (running || stopped || notified) return;
                notified = true;
                queueMicrotask(() => {
                    notified = false;
                    if (!running && !stopped) tx.oncomplete?.();
                });
            }
            function request(work) {
                running++;
                const req = { result: undefined, onsuccess: null, onerror: null };
                queueMicrotask(() => {
                    if (stopped) return;
                    try {
                        req.result = work();
                        req.onsuccess?.();
                    } catch (error) {
                        tx.error = error;
                        stopped = true;
                        req.onerror?.();
                        tx.onerror?.();
                    }
                    running--;
                    finished();
                });
                return req;
            }
            tx.objectStore = () => ({
                getAll: () => request(() => [...records.values()].map(item => structuredClone(item))),
                get: key => request(() => structuredClone(records.get(key))),
                put: record => request(() => records.set(record.key, structuredClone(record))),
                delete: key => request(() => records.delete(key))
            });
            return tx;
        }
    };
    return {
        open(name, version) {
            assert.equal(name, Workspace.DATABASE_NAME);
            assert.equal(version, Workspace.DATABASE_VERSION);
            const req = { result: null, onupgradeneeded: null, onsuccess: null, onerror: null };
            queueMicrotask(() => {
                req.result = db;
                if (!initialized) req.onupgradeneeded?.();
                req.onsuccess?.();
            });
            return req;
        }
    };
}

test("project snapshots are cloned and validated", () => {
    const original = { version: 5, style: { bgColor: "#8ACE00" } };
    const clone = Workspace.copyPayload(original);
    clone.style.bgColor = "red";
    assert.equal(original.style.bgColor, "#8ACE00");
    assert.throws(() => Workspace.copyPayload([]), { code: "INVALID_PROJECT" });
    assert.throws(() => Workspace.copyPayload({ big: "x".repeat(5 * 1024 * 1024) }), { code: "PROJECT_TOO_LARGE" });
});

test("storage is explicitly unavailable without IndexedDB", async () => {
    const store = Workspace.createStore({ indexedDB: null });
    await assert.rejects(store.getActive("guest"), { code: "STORAGE_UNAVAILABLE" });
});

test("local projects are isolated by owner and list excludes payloads", async () => {
    let tick = 1;
    const store = Workspace.createStore({ indexedDB: fakeIndexedDB(), now: () => tick++ });
    await store.saveActive({ version: 5, lyrics: "guest" }, "guest");
    await store.saveActive({ version: 5, lyrics: "account" }, "user:42");
    assert.equal((await store.getActive("guest")).payload.lyrics, "guest");
    assert.equal((await store.getActive("user:42")).payload.lyrics, "account");
    const listed = await store.listProjects("guest");
    assert.equal(listed.length, 1);
    assert.equal(listed[0].payload, undefined);
    await store.clearActive("guest");
    assert.equal(await store.getActive("guest"), null);
    assert.equal((await store.getActive("user:42")).payload.lyrics, "account");
});

test("20 saved projects and a single temporary project are enforced globally", async () => {
    const store = Workspace.createStore({ indexedDB: fakeIndexedDB() });
    for (let i = 0; i < 20; i++) {
        await store.saveProject({ version: 5, lyrics: String(i) }, { ownerId: i % 2 ? "user" : "guest", projectId: "p" + i });
    }
    await assert.rejects(store.saveProject({ version: 5 }, { ownerId: "guest", projectId: "p21" }), { code: "LIBRARY_FULL" });
    await store.saveProject({ version: 5 }, { ownerId: "guest", projectId: "draft", temporary: true });
    await assert.rejects(store.saveProject({ version: 5 }, { ownerId: "user", projectId: "draft2", temporary: true }), { code: "LIBRARY_FULL" });
    await store.saveProject({ version: 5, lyrics: "modified" }, { ownerId: "guest", projectId: "p0" });
    assert.equal((await store.getProject("guest", "p0")).payload.lyrics, "modified");
    await store.deleteProject("guest", "p0");
    await store.saveProject({ version: 5 }, { ownerId: "user", projectId: "new" });
});

test("autosave debounces edits and writes the newest snapshot", async () => {
    const writes = [];
    const events = [];
    const timers = new Map();
    let clock = 0;
    const autosave = Workspace.createAutosave({
        store: { saveActive: async (payload, owner) => writes.push({ payload, owner }) },
        ownerId: "guest",
        onStatus: event => events.push(event),
        setTimeout: fn => { const id = ++clock; timers.set(id, fn); return id; },
        clearTimeout: id => timers.delete(id)
    });
    autosave.schedule({ lyrics: "a" });
    autosave.schedule({ lyrics: "ab" });
    assert.equal(timers.size, 1);
    assert.equal(autosave.isDirty(), true);
    timers.values().next().value();
    await autosave.flush();
    assert.deepEqual(writes, [{ payload: { lyrics: "ab" }, owner: "guest" }]);
    assert.equal(events.at(-1), "saved");
    assert.equal(autosave.isDirty(), false);
});

test("discard invalidates an in-flight save before deleting the project", async () => {
    let finishWrite;
    let markStarted;
    const started = new Promise(resolve => { markStarted = resolve; });
    const actions = [];
    const autosave = Workspace.createAutosave({
        store: {
            saveActive: () => new Promise(resolve => {
                finishWrite = () => { actions.push("write"); resolve(); };
                markStarted();
            }),
            clearActive: async () => { actions.push("delete"); }
        },
        setTimeout: () => 1,
        clearTimeout: () => {}
    });
    autosave.schedule({ lyrics: "a" });
    const writing = autosave.flush();
    await started;
    const clearing = autosave.discard();
    finishWrite();
    await Promise.all([writing, clearing]);
    assert.deepEqual(actions, ["write", "delete"]);
    assert.equal(autosave.isDirty(), false);
});

test("a failed autosave remains recoverable and can be retried", async () => {
    const failures = [];
    const states = [];
    let attempts = 0;
    const autosave = Workspace.createAutosave({
        store: { saveActive: async () => { if (++attempts === 1) throw new Error("quota"); } },
        onError: (error, snapshot) => failures.push([error.message, snapshot.lyrics]),
        onStatus: status => states.push(status),
        setTimeout: () => 1,
        clearTimeout: () => {}
    });
    autosave.schedule({ lyrics: "important" });
    await assert.rejects(autosave.flush(), /quota/);
    assert.equal(autosave.isDirty(), true);
    assert.deepEqual(failures, [["quota", "important"]]);
    await autosave.flush();
    assert.equal(states.at(-1), "saved");
    assert.equal(autosave.isDirty(), false);
});


test("activating an archived project swaps active data without consuming extra slots", async () => {
    const store = Workspace.createStore({ indexedDB: fakeIndexedDB() });
    await store.saveActive({ lyrics: "current lyrics" }, "user:demo");
    await store.saveProject({ lyrics: "archived lyrics" }, { ownerId: "user:demo", projectId: "archive-1", title: "Archived" });
    for (let i = 0; i < 18; i++) {
        await store.saveProject({ lyrics: "other " + i }, { ownerId: "guest", projectId: "other-" + i });
    }
    assert.equal((await store.listProjects("user:demo")).length, 2);
    await store.activateProject("user:demo", "archive-1");
    assert.equal((await store.getActive("user:demo")).payload.lyrics, "archived lyrics");
    assert.equal((await store.getProject("user:demo", "archive-1")).payload.lyrics, "current lyrics");
    await assert.rejects(store.saveProject({ lyrics: "over limit" }, { ownerId: "guest", projectId: "extra" }), { code: "LIBRARY_FULL" });
    await assert.rejects(store.activateProject("user:demo", "does-not-exist"), { code: "PROJECT_NOT_FOUND" });
});

test("logging out with deletion removes only this account's local records", async () => {
    const store = Workspace.createStore({ indexedDB: fakeIndexedDB() });
    await store.saveActive({ lyrics: "guest data" }, "guest");
    await store.saveActive({ lyrics: "member data" }, "user:a");
    await store.saveProject({ lyrics: "member archive" }, { ownerId: "user:a", projectId: "archive-1" });
    await store.saveActive({ lyrics: "other user" }, "user:b");
    assert.equal(await store.deleteOwner("user:a"), 2);
    assert.equal((await store.listProjects("user:a")).length, 0);
    assert.equal((await store.getActive("guest")).payload.lyrics, "guest data");
    assert.equal((await store.getActive("user:b")).payload.lyrics, "other user");
});


test("global workspace counts include the one temporary slot", async () => {
    const store = Workspace.createStore({ indexedDB: fakeIndexedDB() });
    assert.deepEqual(await store.stats(), { saved: 0, temporary: 0, capacity: 20, temporaryCapacity: 1 });
    await store.saveActive({ lyrics: "permanent" }, "guest");
    await store.saveProject({ lyrics: "draft" }, { ownerId: "guest", projectId: "temporary", temporary: true });
    assert.deepEqual(await store.stats(), { saved: 1, temporary: 1, capacity: 20, temporaryCapacity: 1 });
    await assert.rejects(store.saveProject({ lyrics: "other" }, { ownerId: "user:b", projectId: "temporary", temporary: true }), { code: "LIBRARY_FULL" });
});

test("rename preserves the title even when autosave overwrites project content", async () => {
    const store = Workspace.createStore({ indexedDB: fakeIndexedDB() });
    await store.saveActive({ lyrics: "x" }, "guest");
    await store.renameProject("guest", "current", "My Local Music Video");
    await store.saveActive({ lyrics: "after edit" }, "guest");
    assert.equal((await store.getActive("guest")).title, "My Local Music Video");
    await assert.rejects(store.renameProject("guest", "nothing", "test"), { code: "PROJECT_NOT_FOUND" });
    await assert.rejects(store.renameProject("guest", "current", "  "), { code: "INVALID_TITLE" });
});

test("temporary project promotes atomically only when a saved slot exists", async () => {
    const store = Workspace.createStore({ indexedDB: fakeIndexedDB() });
    for (let i = 0; i < 19; i++) {
        await store.saveProject({ lyrics: "existing " + i }, { ownerId: i % 2 ? "user:a" : "guest", projectId: "existing-" + i });
    }
    await store.saveProject({ lyrics: "draft" }, { ownerId: "guest", projectId: "temporary", temporary: true });
    const promoted = await store.promoteTemporary("guest", "Great Edit");
    assert.match(promoted, /^archive-/);
    assert.equal((await store.getProject("guest", promoted)).title, "Great Edit");
    assert.equal((await store.getProject("guest", "temporary")), null);
    assert.deepEqual(await store.stats(), { saved: 20, temporary: 0, capacity: 20, temporaryCapacity: 1 });
    await store.saveProject({ lyrics: "draft 2" }, { ownerId: "guest", projectId: "temporary", temporary: true });
    await assert.rejects(store.promoteTemporary("guest", "no free slot"), { code: "LIBRARY_FULL" });
    assert.equal((await store.getProject("guest", "temporary")).kind, "temporary");
});

test("autosave writes and discards the temporary slot without affecting the current project", async () => {
    const store = Workspace.createStore({ indexedDB: fakeIndexedDB() });
    await store.saveActive({ lyrics: "keep me" }, "guest");
    const auto = Workspace.createAutosave({ store, projectId: "temporary", ownerId: "guest", setTimeout: () => 1, clearTimeout: () => {} });
    auto.schedule({ lyrics: "temporary note" });
    await auto.flush();
    const temporary = await store.getProject("guest", "temporary");
    assert.equal(temporary.payload.lyrics, "temporary note");
    assert.equal(temporary.kind, "temporary");
    await auto.discard();
    assert.equal(await store.getProject("guest", "temporary"), null);
    assert.equal((await store.getActive("guest")).payload.lyrics, "keep me");
});
