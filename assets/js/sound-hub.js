/* Brat Animator Phase 4 — browser-resident Sound Hub.
 * Audio bytes use the existing bratAnimator.media.v1 database, shared with
 * project assets. Only metadata/collection references live in Sound Hub DB.
 * No network, streaming services, cloud uploads or runtime dependencies.
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root && root.document) root.BratSoundHub = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    "use strict";

    const DB_NAME = "bratAnimator.soundhub.v1";
    const DB_VERSION = 1;
    const TRACKS = "tracks";
    const COLLECTIONS = "collections";
    const MEDIA_DB_NAME = "bratAnimator.media.v1";
    const MEDIA_STORE = "media";
    const MAX_FILE_BYTES = 256 * 1024 * 1024;
    const ALLOWED_EXTENSIONS = /\.(?:mp3|wav|wave|m4a|aac|ogg|oga|opus|flac|aiff?|webm)$/i;

    function failure(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }
    function ownerKey(value) {
        const owner = String(value || "guest").trim();
        if (owner.length > 256 || !owner) throw failure("INVALID_OWNER", "Identità locale non valida.");
        return owner;
    }
    function trackKey(owner, id) { return JSON.stringify([ownerKey(owner), String(id)]); }
    function collectionKey(owner, id) { return JSON.stringify([ownerKey(owner), String(id)]); }
    function isAudioFile(file) {
        const mime = String(file?.type || "").toLowerCase();
        return Boolean(file && typeof file.arrayBuffer === "function" && typeof file.size === "number" &&
            ((mime.startsWith("audio/") && mime !== "audio/x-mpegurl") || ALLOWED_EXTENSIONS.test(file.name || "")));
    }
    function validateFile(file) {
        if (!isAudioFile(file)) throw failure("UNSUPPORTED_TYPE", "Importa un file audio supportato (MP3, M4A, WAV, FLAC, OGG, AAC o WebM).");
        if (file.size <= 0) throw failure("EMPTY_AUDIO", "Il file audio è vuoto.");
        if (file.size > MAX_FILE_BYTES) throw failure("FILE_TOO_LARGE", "Il singolo file supera 256 MiB. Non esiste un limite al numero di brani; il browser ha comunque una quota.");
    }
    function createLibrary(options = {}) {
        const idb = options.indexedDB !== undefined ? options.indexedDB : root.indexedDB;
        const subtle = options.subtle !== undefined ? options.subtle : root.crypto?.subtle;
        const now = options.now || Date.now;
        const randomId = options.randomId || (() => root.crypto?.randomUUID?.() || String(now()) + "-" + Math.random().toString(36).slice(2));

        function open(name, upgrade) {
            if (!idb || typeof idb.open !== "function")
                return Promise.reject(failure("STORAGE_UNAVAILABLE", "IndexedDB non è disponibile."));
            return new Promise((resolve, reject) => {
                let request;
                try { request = idb.open(name, 1); }
                catch (error) { reject(error); return; }
                request.onupgradeneeded = () => {
                    try { upgrade(request.result); }
                    catch (error) { reject(error); }
                };
                request.onsuccess = () => {
                    const db = request.result;
                    db.onversionchange = () => db.close();
                    resolve(db);
                };
                request.onerror = () => reject(request.error || failure("STORAGE_UNAVAILABLE", "Impossibile aprire l'archivio audio."));
                request.onblocked = () => reject(failure("STORAGE_BLOCKED", "Chiudi le altre schede per aggiornare l'archivio."));
            });
        }
        function openLibrary() {
            return open(DB_NAME, db => {
                if (!db.objectStoreNames.contains(TRACKS)) db.createObjectStore(TRACKS, { keyPath: "key" });
                if (!db.objectStoreNames.contains(COLLECTIONS)) db.createObjectStore(COLLECTIONS, { keyPath: "key" });
            });
        }
        function openMedia() {
            return open(MEDIA_DB_NAME, db => {
                if (!db.objectStoreNames.contains(MEDIA_STORE))
                    db.createObjectStore(MEDIA_STORE, { keyPath: "id" });
            });
        }
        function operate(dbPromise, stores, mode, callback) {
            return dbPromise.then(db => new Promise((resolve, reject) => {
                let tx, result;
                try {
                    tx = db.transaction(stores, mode);
                    callback(tx, value => { result = value; });
                } catch (error) { db.close(); reject(error); return; }
                tx.oncomplete = () => { db.close(); resolve(result); };
                tx.onerror = () => { db.close(); reject(tx.error || failure("STORAGE_FAILED", "Operazione locale non riuscita.")); };
                tx.onabort = () => { db.close(); reject(tx.error || failure("STORAGE_ABORTED", "Operazione locale annullata.")); };
            }));
        }

        function readOne(store, key) {
            return operate(openLibrary(), [store], "readonly", (tx, finish) => {
                const request = tx.objectStore(store).get(key);
                request.onsuccess = () => finish(request.result || null);
            });
        }
        function all(store) {
            return operate(openLibrary(), [store], "readonly", (tx, finish) => {
                const request = tx.objectStore(store).getAll();
                request.onsuccess = () => finish(request.result || []);
            });
        }
        function put(store, record) {
            return operate(openLibrary(), [store], "readwrite", (tx, finish) => {
                tx.objectStore(store).put(record);
                finish(record);
            });
        }

        async function fingerprint(file) {
            if (!subtle || typeof subtle.digest !== "function") {
                throw failure("HASH_UNAVAILABLE", "Per deduplicare gli audio serve Web Crypto (HTTPS o localhost).");
            }
            const digest = await subtle.digest("SHA-256", await file.arrayBuffer());
            return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, "0")).join("");
        }
        function mediaId(id) { return "sound-" + id; }

        function ensureMedia(id, file) {
            return operate(openMedia(), [MEDIA_STORE], "readwrite", (tx, finish) => {
                const store = tx.objectStore(MEDIA_STORE);
                const request = store.get(id);
                request.onsuccess = () => {
                    if (!request.result) {
                        store.put({
                            id, blob: file, name: String(file.name || "Audio").slice(0, 180),
                            kind: "audio", savedAt: new Date(now()).toISOString()
                        });
                    }
                    finish(id);
                };
            });
        }

        async function importFile(file, ownerId = "guest") {
            const owner = ownerKey(ownerId);
            validateFile(file);
            const id = await fingerprint(file);
            const key = trackKey(owner, id);
            const existing = await readOne(TRACKS, key);
            if (existing) {
                // Do not change favorites or collections, and do not rewrite binary.
                return { ...existing, duplicate: true };
            }
            const assetId = mediaId(id);
            await ensureMedia(assetId, file);
            const record = {
                key, ownerId: owner, id, assetId,
                name: String(file.name || "Audio senza nome").slice(0, 180),
                mime: String(file.type || "audio/*").slice(0, 100),
                size: file.size, favorite: false, collections: [],
                addedAt: now(), lastUsedAt: 0
            };
            // May race with another tab importing this same file: in that case
            // prefer the record already committed with its existing user tags.
            return operate(openLibrary(), [TRACKS], "readwrite", (tx, finish) => {
                const store = tx.objectStore(TRACKS);
                const request = store.get(key);
                request.onsuccess = () => {
                    if (!request.result) store.put(record);
                    finish(request.result ? { ...request.result, duplicate: true } : record);
                };
            });
        }
        async function listTracks(ownerId = "guest") {
            const owner = ownerKey(ownerId);
            return (await all(TRACKS)).filter(track => track.ownerId === owner)
                .sort((a, b) => b.addedAt - a.addedAt);
        }
        function getTrack(ownerId, id) { return readOne(TRACKS, trackKey(ownerId, id)); }

        async function getAudio(ownerId, id) {
            const track = await getTrack(ownerId, id);
            if (!track) throw failure("NOT_FOUND", "Questo audio non è nella tua libreria locale.");
            const media = await operate(openMedia(), [MEDIA_STORE], "readonly", (tx, finish) => {
                const request = tx.objectStore(MEDIA_STORE).get(track.assetId);
                request.onsuccess = () => finish(request.result || null);
            });
            if (!media?.blob) throw failure("MISSING_MEDIA", "File audio mancante. Importa nuovamente il file.");
            return { ...track, blob: media.blob };
        }

        function editTrack(ownerId, id, mutate) {
            const key = trackKey(ownerId, id);
            return operate(openLibrary(), [TRACKS], "readwrite", (tx, finish) => {
                const store = tx.objectStore(TRACKS);
                const request = store.get(key);
                request.onsuccess = () => {
                    if (!request.result) { tx.abort(); return; }
                    const updated = mutate({ ...request.result });
                    store.put(updated);
                    finish(updated);
                };
            });
        }
        function setFavorite(ownerId, id, value) {
            return editTrack(ownerId, id, track => ({ ...track, favorite: Boolean(value) }));
        }
        function markUsed(ownerId, id) {
            return editTrack(ownerId, id, track => ({ ...track, lastUsedAt: now() }));
        }
        function deleteTrack(ownerId, id) {
            return operate(openLibrary(), [TRACKS], "readwrite", (tx, finish) => {
                tx.objectStore(TRACKS).delete(trackKey(ownerId, id));
                // Never remove shared media bytes here. Other account libraries
                // or projects may still reference the same stable assetId.
                finish(true);
            });
        }
        async function createCollection(ownerId, name) {
            const owner = ownerKey(ownerId);
            const title = String(name || "").trim().slice(0, 64);
            if (!title) throw failure("INVALID_NAME", "Inserisci un nome per la raccolta.");
            const id = randomId();
            const record = { key: collectionKey(owner, id), ownerId: owner, id, name: title, createdAt: now() };
            await put(COLLECTIONS, record);
            return record;
        }
        async function listCollections(ownerId = "guest") {
            const owner = ownerKey(ownerId);
            return (await all(COLLECTIONS)).filter(item => item.ownerId === owner)
                .sort((a, b) => a.name.localeCompare(b.name, "it"));
        }
        async function renameCollection(ownerId, id, name) {
            const title = String(name || "").trim().slice(0, 64);
            if (!title) throw failure("INVALID_NAME", "Inserisci un nome per la raccolta.");
            const key = collectionKey(ownerId, id);
            return operate(openLibrary(), [COLLECTIONS], "readwrite", (tx, finish) => {
                const store = tx.objectStore(COLLECTIONS);
                const request = store.get(key);
                request.onsuccess = () => {
                    if (!request.result) { tx.abort(); return; }
                    const updated = { ...request.result, name: title };
                    store.put(updated);
                    finish(updated);
                };
            });
        }
        async function setCollectionMembership(ownerId, trackId, collectionId, included) {
            const owner = ownerKey(ownerId);
            return operate(openLibrary(), [TRACKS, COLLECTIONS], "readwrite", (tx, finish) => {
                const trackStore = tx.objectStore(TRACKS);
                const collectionReq = tx.objectStore(COLLECTIONS).get(collectionKey(owner, collectionId));
                collectionReq.onsuccess = () => {
                    if (!collectionReq.result) { tx.abort(); return; }
                    const request = trackStore.get(trackKey(owner, trackId));
                    request.onsuccess = () => {
                        if (!request.result) { tx.abort(); return; }
                        const existing = request.result.collections || [];
                        const collections = included
                            ? [...new Set([...existing, collectionId])]
                            : existing.filter(id => id !== collectionId);
                        const updated = { ...request.result, collections };
                        trackStore.put(updated);
                        finish(updated);
                    };
                };
            });
        }
        async function deleteCollection(ownerId, id) {
            const owner = ownerKey(ownerId);
            return operate(openLibrary(), [TRACKS, COLLECTIONS], "readwrite", (tx, finish) => {
                const trackStore = tx.objectStore(TRACKS);
                const request = trackStore.getAll();
                request.onsuccess = () => {
                    for (const record of request.result || []) {
                        if (record.ownerId !== owner || !record.collections?.includes(id)) continue;
                        trackStore.put({ ...record, collections: record.collections.filter(item => item !== id) });
                    }
                    tx.objectStore(COLLECTIONS).delete(collectionKey(owner, id));
                    finish(true);
                };
            });
        }
        async function stats(ownerId) {
            const tracks = await listTracks(ownerId);
            return {
                count: tracks.length,
                size: tracks.reduce((sum, track) => sum + (track.size || 0), 0),
                favorites: tracks.filter(track => track.favorite).length
            };
        }
        return Object.freeze({
            importFile, listTracks, getTrack, getAudio,
            setFavorite, markUsed, deleteTrack,
            createCollection, listCollections, renameCollection,
            setCollectionMembership, deleteCollection, stats
        });
    }
    return Object.freeze({
        DB_NAME, DB_VERSION, MEDIA_DB_NAME, MAX_FILE_BYTES,
        isAudioFile, validateFile, createLibrary
    });
});
