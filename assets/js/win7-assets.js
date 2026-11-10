/* User-supplied Windows 7 artwork and sounds, stored in this browser. */
(function (root) {
    "use strict";
    const document = root.document;
    const input = document.getElementById("studioWin7Files");
    const status = document.getElementById("studioWin7AssetsStatus");
    const remove = document.getElementById("studioWin7RemoveAssets");
    const soundFiles = root.BratWindows7SoundPack.files;
    const files = new Map([
        ["activity.bmp", ["boot", "image/bmp", 20]],
        ["activity.png", ["boot", "image/png", 20]],
        ["img0.jpg", ["wallpaper", "image/jpeg", 12]],
        ["start-orb.png", ["orb", "image/png", 1]],
        ["taskbar.png", ["taskbar", "image/png", 1]],
        ["folder.ico", ["folder", "image/x-icon", 1]],
        ["music.ico", ["music", "image/x-icon", 1]],
        ["user.bmp", ["user", "image/bmp", 1]],
        ...Object.entries(soundFiles).map(([event, name]) => [name, ["sound:" + event, "audio/wav", 4]])
    ]);
    const urls = new Map();

    function transact(mode, operation) {
        return new Promise((resolve, reject) => {
            const open = root.indexedDB.open("bratAnimator.win7Assets", 1);
            open.onupgradeneeded = () => open.result.createObjectStore("assets", { keyPath: "key" });
            open.onerror = () => reject(open.error);
            open.onsuccess = () => {
                const db = open.result;
                let transaction;
                let request;
                try {
                    transaction = db.transaction("assets", mode);
                    request = operation(transaction.objectStore("assets"));
                } catch (error) {
                    transaction?.abort();
                    db.close();
                    reject(error);
                    return;
                }
                transaction.oncomplete = () => { db.close(); resolve(request?.result); };
                transaction.onabort = () => { db.close(); reject(transaction.error); };
            };
        });
    }

    async function decodeImage(url) {
        const image = new root.Image();
        image.src = url;
        await image.decode();
        return image;
    }

    async function validate(file, key, blob) {
        if (key.startsWith("sound:")) {
            const header = new TextDecoder().decode(await blob.slice(0, 12).arrayBuffer());
            if (!header.startsWith("RIFF") || !header.endsWith("WAVE")) {
                throw new Error(file.name + ": serve un file WAV valido.");
            }
            return;
        }
        const url = URL.createObjectURL(blob);
        try {
            const { naturalWidth: width, naturalHeight: height } = await decodeImage(url);
            const valid = {
                boot: width === 200 && height === 21000,
                orb: width >= 24 && width <= 256 && height === width * 3,
                taskbar: width <= 512 && height <= 128
            }[key] ?? (width <= 8192 && height <= 8192);
            if (!valid) throw new Error();
        } catch (_) {
            throw new Error(file.name + ": formato o dimensioni non validi. Controlla la guida.");
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    function apply(records) {
        for (const url of urls.values()) URL.revokeObjectURL(url);
        urls.clear();
        for (const { key, blob } of records) urls.set(key, URL.createObjectURL(blob));

        for (const key of ["wallpaper", "orb", "taskbar"]) {
            const url = urls.get(key);
            if (url) document.body.style.setProperty("--win7-" + key, 'url("' + url + '")');
            else document.body.style.removeProperty("--win7-" + key);
        }
        document.body.classList.toggle("win7-has-orb", urls.has("orb"));
        for (const image of document.querySelectorAll("[data-win7-image]")) {
            const url = urls.get(image.dataset.win7Image);
            if (url) image.src = url;
            else image.removeAttribute("src");
            image.hidden = !url;
        }
        const count = records.filter(({ key }) => key.startsWith("sound:")).length;
        status.textContent = records.length
            ? `${records.length - count} immagini e ${count} suoni salvati in questo browser.`
            : "Nessun file installato.";
    }

    async function load() {
        apply(await transact("readonly", store => store.getAll()));
    }

    const ready = load()
        .then(() => { if (!input.disabled) remove.disabled = !urls.size; })
        .catch(() => { status.textContent = "Impossibile leggere i file del tema da questo browser."; });

    async function update(operation) {
        input.disabled = remove.disabled = true;
        try {
            await ready;
            await operation();
            await load();
        } catch (error) {
            status.textContent = error instanceof DOMException
                ? "Impossibile salvare i file del tema in questo browser."
                : error?.message || "Impossibile salvare i file del tema.";
        } finally {
            input.disabled = false;
            remove.disabled = !urls.size;
        }
    }

    input.addEventListener("change", () => {
        const selection = Array.from(input.files);
        input.value = "";
        if (!selection.length) return;
        update(async () => {
            const records = new Map();
            for (const file of selection) {
                const spec = files.get(file.name.toLowerCase());
                if (!spec) throw new Error(file.name + ": nome non riconosciuto. Controlla la guida.");
                const [key, mime, limit] = spec;
                if (!file.size || file.size > limit * 1024 * 1024 || records.has(key)) {
                    throw new Error(file.name + ": file vuoto, troppo grande o duplicato.");
                }
                const blob = file.slice(0, file.size, mime);
                await validate(file, key, blob);
                records.set(key, { key, blob });
            }
            await transact("readwrite", store => {
                for (const record of records.values()) store.put(record);
            });
        });
    });
    remove.addEventListener("click", () => update(() => transact("readwrite", store => store.clear())));

    root.BratWin7Assets = Object.freeze({
        ready,
        getUrl: key => urls.get(key),
        async loadBoot() {
            await ready;
            const url = urls.get("boot");
            return url ? decodeImage(url) : null;
        }
    });
})(window);
