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

        async function activateProject(ownerId, projectId) {
            const owner = ownerKey(ownerId);
            const sourceKey = projectKey(owner, projectId);
            const activeKey = projectKey(owner, "current");
            if (sourceKey === activeKey) return true;
            const db = await openDatabase();
            return new Promise((resolve, reject) => {
                let tx;
                let missing = false;
                try {
                    tx = db.transaction(PROJECT_STORE, "readwrite");
                    const store = tx.objectStore(PROJECT_STORE);
                    const sourceRequest = store.get(sourceKey);
                    sourceRequest.onsuccess = () => {
                        const source = sourceRequest.result;
                        if (!source) { missing = true; tx.abort(); return; }
                        const activeRequest = store.get(activeKey);
                        activeRequest.onsuccess = () => {
                            const active = activeRequest.result;
                            store.put({ ...source, key: activeKey, projectId: "current", kind: "saved", updatedAt: now() });
                            if (active && (active.payload?.lyrics?.trim() || active.payload?.audio?.assetId || active.payload?.background?.assetId)) {
                                store.put({ ...active, key: sourceKey, projectId, kind: "saved", updatedAt: now() });
                            } else {
                                store.delete(sourceKey);
                            }
                        };
                    };
                } catch (error) { db.close(); reject(error); return; }
                tx.oncomplete = () => { db.close(); resolve(true); };
                tx.onerror = () => { db.close(); reject(tx.error || errorWithCode("Could not switch project.", "STORAGE_WRITE_FAILED")); };
                tx.onabort = () => { db.close(); reject(missing
                    ? errorWithCode("Project not found.", "PROJECT_NOT_FOUND")
                    : tx.error || errorWithCode("Project switch aborted.", "STORAGE_WRITE_FAILED")); };
            });
        }

        async function stats() {
            const all = await readAll();
            return {
                saved: all.filter(item => item.kind !== "temporary").length,
                temporary: all.filter(item => item.kind === "temporary").length,
                capacity: PROJECT_LIMIT,
                temporaryCapacity: TEMPORARY_LIMIT
            };
        }

        async function renameProject(ownerId, projectId, title) {
            const key = projectKey(ownerId, projectId);
            const normalized = String(title || "").trim().slice(0, 120);
            if (!normalized) throw errorWithCode("Project name cannot be empty.", "INVALID_TITLE");
            const db = await openDatabase();
            return new Promise((resolve, reject) => {
                let tx, missing = false;
                try {
                    tx = db.transaction(PROJECT_STORE, "readwrite");
                    const request = tx.objectStore(PROJECT_STORE).get(key);
                    request.onsuccess = () => {
                        if (!request.result) { missing = true; tx.abort(); return; }
                        tx.objectStore(PROJECT_STORE).put({ ...request.result, title: normalized });
                    };
                } catch (error) { db.close(); reject(error); return; }
                tx.oncomplete = () => { db.close(); resolve(true); };
                tx.onerror = () => { db.close(); reject(tx.error || errorWithCode("Rename failed.", "STORAGE_WRITE_FAILED")); };
                tx.onabort = () => { db.close(); reject(missing
                    ? errorWithCode("Project not found.", "PROJECT_NOT_FOUND")
                    : tx.error || errorWithCode("Rename aborted.", "STORAGE_WRITE_FAILED")); };
            });
        }

        async function promoteTemporary(ownerId, title) {
            const owner = ownerKey(ownerId);
            const tmpKey = projectKey(owner, "temporary");
            const projectId = "archive-" + (root.crypto?.randomUUID?.() || String(now()) + "-" + Math.random().toString(36).slice(2));
            const key = projectKey(owner, projectId);
            const db = await openDatabase();
            return new Promise((resolve, reject) => {
                let tx, failure = null;
                try {
                    tx = db.transaction(PROJECT_STORE, "readwrite");
                    const store = tx.objectStore(PROJECT_STORE);
                    const request = store.getAll();
                    request.onsuccess = () => {
                        const all = request.result || [];
                        const source = all.find(item => item.key === tmpKey && item.kind === "temporary");
                        if (!source) { failure = errorWithCode("Temporary project not found.", "PROJECT_NOT_FOUND"); tx.abort(); return; }
                        if (all.filter(item => item.kind !== "temporary").length >= PROJECT_LIMIT) {
                            failure = errorWithCode("Free a permanent project slot first.", "LIBRARY_FULL");
                            tx.abort(); return;
                        }
                        store.put({
                            ...source, key, projectId, kind: "saved", updatedAt: now(),
                            title: String(title || source.title || "Untitled project").slice(0, 120)
                        });
                        store.delete(tmpKey);
                    };
                } catch (error) { db.close(); reject(error); return; }
                tx.oncomplete = () => { db.close(); resolve(projectId); };
                tx.onerror = () => { db.close(); reject(failure || tx.error || errorWithCode("Promotion failed.", "STORAGE_WRITE_FAILED")); };
                tx.onabort = () => { db.close(); reject(failure || tx.error || errorWithCode("Promotion aborted.", "STORAGE_WRITE_FAILED")); };
            });
        }

        async function deleteOwner(ownerId) {
            const owner = ownerKey(ownerId);
            const db = await openDatabase();
            return new Promise((resolve, reject) => {
                let tx;
                let removed = 0;
                try {
                    tx = db.transaction(PROJECT_STORE, "readwrite");
                    const store = tx.objectStore(PROJECT_STORE);
                    const request = store.getAll();
                    request.onsuccess = () => {
                        for (const record of request.result || []) {
                            if (record.ownerId !== owner) continue;
                            store.delete(record.key);
                            removed++;
                        }
                    };
                } catch (error) { db.close(); reject(error); return; }
                tx.oncomplete = () => { db.close(); resolve(removed); };
                tx.onerror = () => { db.close(); reject(tx.error || errorWithCode("Could not delete owner projects.", "STORAGE_WRITE_FAILED")); };
                tx.onabort = () => { db.close(); reject(tx.error || errorWithCode("Owner project deletion aborted.", "STORAGE_WRITE_FAILED")); };
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
            deleteOwner,
            activateProject,
            listProjects,
            stats,
            renameProject,
            promoteTemporary,
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
        const projectId = String(config.projectId || "current");
        const temporary = projectId === "temporary";
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
                    await (temporary
                        ? config.store.saveProject(snapshot, { ownerId, projectId, temporary: true })
                        : config.store.saveActive(snapshot, ownerId));
                    if (generation === currentGeneration) notify(pending === null ? "saved" : "pending");
                    return true;
                } catch (error) {
                    if (generation === currentGeneration) {
                        if (pending === null) pending = snapshot;
                        notify("error", error);
                        // Preserve the latest pending edit, not a stale failed write.
                        onError(error, pending);
                    }
                    throw error;
                }
            });
            chain = task;
            return task;
        }

        function discard() {
            generation += 1;
            stopTimer();
            pending = null;
            // Deletion is part of the same queue: an immediate new edit cannot
            // race ahead of the clear and then be removed accidentally.
            const deletion = chain.catch(() => {}).then(async () => {
                await (temporary ? config.store.deleteProject(ownerId, projectId) : config.store.clearActive(ownerId));
                notify("cleared");
            });
            chain = deletion;
            return deletion;
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
