const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const SoundHub = require("../assets/js/sound-hub.js");

function memoryIndexedDB() {
    const databases = new Map();
    const active = { failed: false };
    function createDB(name) {
        const maps = new Map();
        const db = {
            objectStoreNames: { contains: store => maps.has(store) },
            createObjectStore(store) {
                maps.set(store, new Map());
            },
            close() {},
            transaction(names) {
                const tx = { oncomplete: null, onerror: null, onabort: null, error: null };
                let count = 0, completeScheduled = false, aborted = false;
                function finish() {
                    if (count > 0 || aborted || completeScheduled) return;
                    completeScheduled = true;
                    queueMicrotask(() => {
                        completeScheduled = false;
                        if (count === 0 && !aborted) tx.oncomplete?.();
                    });
                }
                function request(task) {
                    count++;
                    const req = { result:undefined, onsuccess:null, onerror:null };
                    queueMicrotask(() => {
                        if (aborted) return;
                        try {
                            req.result = task();
                            req.onsuccess?.();
                        } catch (error) {
                            tx.error = error;
                            aborted = true;
                            req.onerror?.();
                            tx.onerror?.();
                            return;
                        }
                        count--;
                        finish();
                    });
                    return req;
                }
                tx.abort = () => {
                    aborted = true;
                    queueMicrotask(() => tx.onabort?.());
                };
                tx.objectStore = store => {
                    assert.ok(maps.has(store), "missing store " + store);
                    const map = maps.get(store);
                    return {
                        get: key => request(() => structuredClone(map.get(key) ?? undefined)),
                        getAll: () => request(() => [...map.values()].map(x => structuredClone(x))),
                        put: value => request(() => { map.set(value.key ?? value.id, structuredClone(value)); return value.key ?? value.id; }),
                        delete: key => request(() => map.delete(key))
                    };
                };
                return tx;
            }
        };
        return db;
    }
    return {
        open(name) {
            const req = { result:null, onupgradeneeded:null, onsuccess:null, onerror:null };
            queueMicrotask(() => {
                if (!databases.has(name)) {
                    req.result = createDB(name);
                    databases.set(name,req.result);
                    req.onupgradeneeded?.();
                } else req.result = databases.get(name);
                req.onsuccess?.();
            });
            return req;
        },
        databases
    };
}

function audioFile(data, name = "My Song.mp3") {
    const blob = new Blob([data], { type: "audio/mpeg" });
    blob.name = name;
    return blob;
}
function createLibrary() {
    const indexedDB = memoryIndexedDB();
    let count = 0;
    return {
        library: SoundHub.createLibrary({
            indexedDB,
            subtle: webcrypto.subtle,
            now: () => ++count,
            randomId: () => "collection-" + ++count
        }),
        indexedDB
    };
}

test("no external account, URL or backend is required to use Sound Hub", async () => {
    const lib = SoundHub.createLibrary({ indexedDB: null });
    await assert.rejects(lib.listTracks("guest"), { code: "STORAGE_UNAVAILABLE" });
});

test("rejects invalid audio, zero-byte files, and oversize media", () => {
    assert.throws(() => SoundHub.validateFile({ size: 12, name: "attack.js", type: "application/javascript", arrayBuffer: async () => new ArrayBuffer(12) }), { code: "UNSUPPORTED_TYPE" });
    assert.throws(() => SoundHub.validateFile(audioFile("", "empty.mp3")), { code: "EMPTY_AUDIO" });
    assert.throws(() => SoundHub.validateFile({ size: SoundHub.MAX_FILE_BYTES + 1, name: "big.mp3", type: "audio/mpeg", arrayBuffer: async () => new ArrayBuffer(0) }), { code: "FILE_TOO_LARGE" });
});

test("SHA-256 deduplicates identical audio without duplicating media blobs", async () => {
    const { library, indexedDB } = createLibrary();
    const first = await library.importFile(audioFile("same binary", "song A.mp3"), "guest");
    const repeat = await library.importFile(audioFile("same binary", "song A reimport.mp3"), "guest");
    assert.equal(first.id, repeat.id);
    assert.equal(repeat.duplicate, true);
    assert.equal((await library.listTracks("guest")).length, 1);
    assert.equal((await library.getAudio("guest", first.id)).blob.size, 11);
    // The same file is one binary even if two owners each have their own entry.
    const secondOwner = await library.importFile(audioFile("same binary", "personal.mp3"), "user:42");
    assert.equal(secondOwner.assetId, first.assetId);
    assert.equal((await library.listTracks("user:42")).length, 1);
    assert.equal(indexedDB.databases.get(SoundHub.MEDIA_DB_NAME).transaction(["media"]).objectStore("media") !== undefined,true);
});

test("favorites, recents and collections are scoped to the current owner", async () => {
    const { library } = createLibrary();
    const t = await library.importFile(audioFile("distinct", "beat.mp3"), "guest");
    await library.importFile(audioFile("distinct", "beat.mp3"), "user:42");
    const first = await library.createCollection("guest", "Nostalgia");
    const another = await library.createCollection("user:42", "Private");
    assert.equal((await library.listCollections("guest")).length, 1);
    await library.setFavorite("guest", t.id, true);
    await library.markUsed("guest", t.id);
    await library.setCollectionMembership("guest", t.id, first.id, true);
    await library.setCollectionMembership("guest", t.id, first.id, true);
    const updated = await library.getTrack("guest", t.id);
    assert.equal(updated.favorite, true);
    assert.ok(updated.lastUsedAt > 0);
    assert.deepEqual(updated.collections, [first.id]);
    const other = await library.getTrack("user:42", t.id);
    assert.equal(other.favorite, false);
    assert.deepEqual(other.collections, []);
    assert.deepEqual((await library.listCollections("user:42")).map(c => c.id),[another.id]);
    await library.renameCollection("guest", first.id, "Retro");
    assert.equal((await library.listCollections("guest"))[0].name, "Retro");
    await library.deleteCollection("guest", first.id);
    assert.deepEqual((await library.getTrack("guest", t.id)).collections, []);
});

test("deleting library references never deletes project-shared binary media", async () => {
    const { library } = createLibrary();
    const track = await library.importFile(audioFile("keep this blob"), "guest");
    await library.importFile(audioFile("keep this blob"), "user:other");
    await library.deleteTrack("guest", track.id);
    assert.equal((await library.listTracks("guest")).length, 0);
    assert.equal((await library.getAudio("user:other",track.id)).blob.size, 14);
    const readded = await library.importFile(audioFile("keep this blob"), "guest");
    assert.equal(readded.assetId, track.assetId);
});

test("Sound Hub UI is visible, uses explicit insertion and retains historic editor", () => {
    const fs = require("node:fs");
    const path = require("node:path");
    const fromRoot = file => fs.readFileSync(path.join(__dirname,"..",file),"utf8");
    const html = fromRoot("index.html");
    const js = fromRoot("assets/js/sound-hub-ui.js");
    const dashboard = fromRoot("assets/js/studio-dashboard.js");
    assert.match(html,/id="studioSoundsView"/);
    assert.match(html,/id="studioSoundFileInput"/);
    assert.match(html,/id="studioSoundCollections"/);
    assert.match(html,/id="studioSoundPlayer"/);
    assert.match(js,/useSoundHubAudio/);
    assert.match(js,/Sostituire l'audio/);
    assert.match(dashboard,/studioSoundsView"\)\.hidden = next !== "sounds"/);
    assert.match(html,/vendor\/7css\/7\.scoped\.css/);
    assert.match(html,/assets\/css\/studio-win7\.css/);
    assert.match(fromRoot("vendor/7css/7.scoped.css"),/7\.css v0\.21\.0/);
    assert.match(html,/class="studio-classic-window window glass active"/);
    assert.doesNotMatch(html,/BRAT WORKSPACE \/ 2000|CREATOR STUDIO|YOUR NEXT EDIT STARTS HERE/);
});
