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
