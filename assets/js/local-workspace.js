/* Brat Animator Phase 1: local-first workspace storage. No network calls. */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root && root.document) root.BratWorkspace = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    "use strict";

    const DATABASE_NAME = "bratAnimator.workspace.v1";
    const DATABASE_VERSION = 1;
    const PROJECT_STORE = "projects";
    const PROJECT_LIMIT = 20;
    const MAX_PROJECT_BYTES = 5 * 1024 * 1024;
    const TEMPORARY_LIMIT = 1;

    function errorWithCode(message, code) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    function ownerKey(ownerId) {
        const value = String(ownerId || "guest").trim();
        if (!value || value.length > 256) throw errorWithCode("Invalid workspace owner.", "INVALID_OWNER");
        return value;
    }

    function projectKey(ownerId, projectId) {
        const id = String(projectId || "current").trim();
        if (!id || id.length > 256) throw errorWithCode("Invalid project ID.", "INVALID_PROJECT");
        return JSON.stringify([ownerKey(ownerId), id]);
    }

    function copyPayload(payload) {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            throw errorWithCode("Project data must be an object.", "INVALID_PROJECT");
        }
        let serialized;
        try { serialized = JSON.stringify(payload); }
        catch (_) { throw errorWithCode("Project contains data that cannot be saved.", "INVALID_PROJECT"); }
        if (!serialized) throw errorWithCode("Project data is empty.", "INVALID_PROJECT");
        if (serialized.length > MAX_PROJECT_BYTES) throw errorWithCode("Project JSON exceeds the 5 MiB local safety limit.", "PROJECT_TOO_LARGE");
        return JSON.parse(serialized);
    }

    function createStore(options) {
        const config = options || {};
        const indexedDBFactory = config.indexedDB !== undefined ? config.indexedDB : root.indexedDB;
        const now = config.now || Date.now;

        function openDatabase() {
            if (!indexedDBFactory || typeof indexedDBFactory.open !== "function") {
                return Promise.reject(errorWithCode("IndexedDB is unavailable.", "STORAGE_UNAVAILABLE"));
            }
            return new Promise((resolve, reject) => {
                let request;
                try { request = indexedDBFactory.open(DATABASE_NAME, DATABASE_VERSION); }
                catch (error) { reject(error); return; }
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(PROJECT_STORE)) {
                        db.createObjectStore(PROJECT_STORE, { keyPath: "key" });
                    }
                };
                request.onsuccess = () => {
                    const db = request.result;
                    db.onversionchange = () => db.close();
                    resolve(db);
                };
                request.onerror = () => reject(request.error || errorWithCode("Cannot open local workspace.", "STORAGE_UNAVAILABLE"));
                request.onblocked = () => reject(errorWithCode("Close other tabs to upgrade local storage.", "STORAGE_BLOCKED"));
            });
        }

        async function readAll() {
            const db = await openDatabase();
            return new Promise((resolve, reject) => {
                let records;
                let tx;
                try {
                    tx = db.transaction(PROJECT_STORE, "readonly");
                    const request = tx.objectStore(PROJECT_STORE).getAll();
                    request.onsuccess = () => { records = request.result || []; };
                    request.onerror = () => { /* transaction abort handles the failure */ };
                } catch (error) { db.close(); reject(error); return; }
                tx.oncomplete = () => { db.close(); resolve(records || []); };
                tx.onerror = () => { db.close(); reject(tx.error || errorWithCode("Could not read workspace.", "STORAGE_READ_FAILED")); };
                tx.onabort = () => { db.close(); reject(tx.error || errorWithCode("Workspace read aborted.", "STORAGE_READ_FAILED")); };
            });
        }

        async function getProject(ownerId, projectId) {
            const key = projectKey(ownerId, projectId);
            const db = await openDatabase();
            return new Promise((resolve, reject) => {
                let result = null;
                let tx;
                try {
                    tx = db.transaction(PROJECT_STORE, "readonly");
                    const request = tx.objectStore(PROJECT_STORE).get(key);
                    request.onsuccess = () => { result = request.result || null; };
                } catch (error) { db.close(); reject(error); return; }
                tx.oncomplete = () => { db.close(); resolve(result); };
                tx.onerror = () => { db.close(); reject(tx.error || errorWithCode("Could not load project.", "STORAGE_READ_FAILED")); };
                tx.onabort = () => { db.close(); reject(tx.error || errorWithCode("Project read aborted.", "STORAGE_READ_FAILED")); };
            });
        }

        async function saveProject(payload, options) {
            const config = options || {};
            const ownerId = ownerKey(config.ownerId);
            const projectId = String(config.projectId || "current");
            const key = projectKey(ownerId, projectId);
            const kind = config.temporary ? "temporary" : "saved";
            const data = copyPayload(payload);
            const record = {
                key, ownerId, projectId, kind,
                title: String(config.title || "Untitled project").slice(0, 120),
                updatedAt: now(),
                payload: data
            };
            const db = await openDatabase();
            return new Promise((resolve, reject) => {
                let tx;
                let capacityError = null;
                try {
                    tx = db.transaction(PROJECT_STORE, "readwrite");
                    const store = tx.objectStore(PROJECT_STORE);
                    const request = store.getAll();
                    request.onsuccess = () => {
                        const all = request.result || [];
                        const existing = all.find(item => item.key === key);
                        const saved = all.filter(item => item.kind !== "temporary").length;
                        const temporary = all.filter(item => item.kind === "temporary").length;
                        if (!existing && ((kind === "saved" && saved >= PROJECT_LIMIT) ||
                            (kind === "temporary" && temporary >= TEMPORARY_LIMIT))) {
                            capacityError = errorWithCode(
                                kind === "saved" ? "The library already contains 20 projects." : "A temporary project already exists.",
                                "LIBRARY_FULL"
                            );
                            tx.abort();
                            return;
                        }
                        store.put(record);
                    };
                } catch (error) { db.close(); reject(error); return; }
                tx.oncomplete = () => { db.close(); resolve({ ...record, payload: undefined }); };
                tx.onerror = () => { db.close(); reject(capacityError || tx.error || errorWithCode("Could not save project.", "STORAGE_WRITE_FAILED")); };
                tx.onabort = () => { db.close(); reject(capacityError || tx.error || errorWithCode("Project save aborted.", "STORAGE_WRITE_FAILED")); };
            });
        }

        async function deleteProject(ownerId, projectId) {
            const key = projectKey(ownerId, projectId);
            const db = await openDatabase();
            return new Promise((resolve, reject) => {
                let tx;
                try {
                    tx = db.transaction(PROJECT_STORE, "readwrite");
                    tx.objectStore(PROJECT_STORE).delete(key);
                } catch (error) { db.close(); reject(error); return; }
                tx.oncomplete = () => { db.close(); resolve(true); };
                tx.onerror = () => { db.close(); reject(tx.error || errorWithCode("Could not delete project.", "STORAGE_WRITE_FAILED")); };
                tx.onabort = () => { db.close(); reject(tx.error || errorWithCode("Project deletion aborted.", "STORAGE_WRITE_FAILED")); };
            });
        }

        async function listProjects(ownerId) {
            const owner = ownerKey(ownerId);
            const records = await readAll();
            return records.filter(item => item.ownerId === owner)
                .map(({ payload, ...metadata }) => metadata)
                .sort((a, b) => b.updatedAt - a.updatedAt);
        }

        async function estimateStorage() {
            try {
                const storage = config.storageManager || root.navigator?.storage;
                return typeof storage?.estimate === "function" ? await storage.estimate() : null;
            } catch (_) { return null; }
        }

        return {
            getProject,
            saveProject,
            deleteProject,
            listProjects,
            estimateStorage,
            getActive: ownerId => getProject(ownerId, "current"),
            saveActive: (payload, ownerId) => saveProject(payload, { ownerId, projectId: "current" }),
            clearActive: ownerId => deleteProject(ownerId, "current")
        };
    }

    function createAutosave(options) {
        const config = options || {};
        if (!config.store || typeof config.store.saveActive !== "function") {
            throw errorWithCode("Autosave requires a workspace store.", "INVALID_CONFIG");
        }
        const ownerId = ownerKey(config.ownerId);
        const delay = Math.max(100, Number(config.delay) || 700);
        const notify = config.onStatus || function () {};
        const onError = config.onError || function () {};
        const later = config.setTimeout || setTimeout;
        const cancelTimer = config.clearTimeout || clearTimeout;
        let timer = null;
        let pending = null;
        let generation = 0;
        let chain = Promise.resolve();

        function stopTimer() {
            if (timer !== null) cancelTimer(timer);
            timer = null;
        }

        function schedule(payload) {
            pending = copyPayload(payload);
            stopTimer();
            notify("pending");
            timer = later(() => { timer = null; flush().catch(() => {}); }, delay);
        }

        function flush() {
            stopTimer();
            if (pending === null) return chain;
            const snapshot = pending;
            const currentGeneration = generation;
            pending = null;
            const task = chain.catch(() => {}).then(async () => {
                if (generation !== currentGeneration) return false;
                notify("saving");
                try {
                    await config.store.saveActive(snapshot, ownerId);
                    if (generation === currentGeneration) notify("saved");
                    return true;
                } catch (error) {
                    if (generation === currentGeneration) {
                        if (pending === null) pending = snapshot;
                        notify("error", error);
                        onError(error, snapshot);
                    }
                    throw error;
                }
            });
            chain = task;
            return task;
        }

        async function discard() {
            generation += 1;
            stopTimer();
            pending = null;
            await chain.catch(() => {});
            await config.store.clearActive(ownerId);
            notify("cleared");
        }

        return {
            schedule, flush, discard,
            isDirty: () => pending !== null || timer !== null
        };
    }

    return Object.freeze({
        DATABASE_NAME, DATABASE_VERSION, PROJECT_LIMIT, TEMPORARY_LIMIT,
        copyPayload, createStore, createAutosave
    });
});
