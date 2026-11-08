/* Brat Animator — Sound Hub UI.
 * Media stays in existing IndexedDB. The only action that alters the editor
 * is the explicit "Usa nel progetto" command (with replace confirmation).
 */
(function (root) {
    "use strict";
    const $ = id => root.document.getElementById(id);
    const api = root.BratSoundHub;
    const editor = root.BratEditorWorkspace;
    if (!api || !editor || !$("studioSoundsView")) return;

    const library = api.createLibrary();
    const audio = $("studioSoundPlayer");
    let view = "home";
    let filter = "all";
    let selectedCollection = "";
    let previewId = null;
    let previewUrl = null;
    let previewOwner = null;
    let busy = false;
    let refreshSerial = 0;
    let collectionMode = "create";
    let collectionId = "";
    let confirmation = null;

    function setNotice(message, error = false) {
        const element = $("studioSoundNotice");
        element.hidden = !message;
        element.textContent = message || "";
        element.dataset.error = String(error);
    }
    function node(tag, className, text) {
        const element = root.document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = String(text);
        return element;
    }
    function button(text, title, action, className = "") {
        const element = node("button", className, text);
        element.type = "button";
        if (title) element.title = title;
        element.addEventListener("click", action);
        return element;
    }
    function bytes(value) {
        if (!Number.isFinite(value)) return "";
        if (value < 1024 * 1024) return (value / 1024).toFixed(0) + " KiB";
        return (value / (1024 * 1024)).toFixed(1) + " MiB";
    }
    function clearPreview() {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;
        previewId = null;
        previewOwner = null;
        $("studioSoundNowPlaying").textContent = "Nessun audio selezionato";
    }
    async function preview(track) {
        try {
            const owner = editor.owner();
            if (previewId === track.id && previewOwner === owner) {
                if (audio.paused) await audio.play();
                else audio.pause();
                return;
            }
            const file = await library.getAudio(owner, track.id);
            clearPreview();
            previewUrl = URL.createObjectURL(file.blob);
            previewId = track.id;
            previewOwner = owner;
            audio.src = previewUrl;
            $("studioSoundNowPlaying").textContent = track.name;
            try { await audio.play(); }
            catch (_) { setNotice("Premi Play nel lettore per ascoltare questo audio."); }
        } catch (error) {
            setNotice("Non riesco a riprodurre questo file: " + error.message, true);
        }
    }
    function confirmDialog(title, message) {
        if (confirmation) return Promise.resolve(false);
        $("studioSoundConfirmTitle").textContent = title;
        $("studioSoundConfirmText").textContent = message;
        $("studioSoundConfirmDialog").hidden = false;
        $("studioSoundConfirmNo").focus();
        return new Promise(resolve => { confirmation = resolve; });
    }
    function resolveConfirm(value) {
        $("studioSoundConfirmDialog").hidden = true;
        const resolve = confirmation;
        confirmation = null;
        resolve?.(Boolean(value));
    }
    async function useInProject(track) {
        if (busy) return;
        busy = true;
        try {
            await editor.whenReady();
            const previous = editor.snapshot()?.audio || {};
            const hasPrevious = Boolean(previous.assetId || previous.url || previous.name);
            if (hasPrevious && previous.assetId !== track.assetId) {
                const approved = await confirmDialog(
                    "Sostituire l'audio?",
                    "Il progetto usa già un audio. Vuoi sostituirlo con \"" + track.name +
                    "\"? Testi, effetti e timing rimarranno, ma potrebbe essere necessario risincronizzarli."
                );
                if (!approved) return;
            }
            if (previous.assetId !== track.assetId) {
                await editor.useSoundHubAudio(track.assetId);
            }
            await library.markUsed(editor.owner(), track.id);
            clearPreview();
            setNotice("");
            root.BratStudio?.show("editor");
        } catch (error) {
            setNotice("Impossibile usare l'audio: " + error.message, true);
        } finally { busy = false; }
    }
    async function removeTrack(track) {
        if (busy) return;
        const okay = await confirmDialog(
            "Rimuovere dalla libreria?",
            "Rimuovere \"" + track.name +
            "\" dal Sound Hub? I progetti che lo utilizzano non vengono modificati e i file condivisi non vengono cancellati."
        );
        if (!okay) return;
        busy = true;
        try {
            await library.deleteTrack(editor.owner(), track.id);
            if (previewId === track.id) clearPreview();
            await refresh();
        } catch (error) {
            setNotice(error.message, true);
        } finally { busy = false; }
    }
    function collectionDialog(mode, collection = null) {
        collectionMode = mode;
        collectionId = collection?.id || "";
        $("studioSoundCollectionTitle").textContent = mode === "rename" ? "Rinomina raccolta" : "Nuova raccolta";
        $("studioSoundCollectionName").value = collection?.name || "";
        $("studioSoundCollectionDialog").hidden = false;
        $("studioSoundCollectionName").focus();
    }
    function closeCollectionDialog() { $("studioSoundCollectionDialog").hidden = true; }
    async function submitCollection(event) {
        event.preventDefault();
        if (busy) return;
        const title = $("studioSoundCollectionName").value.trim();
        if (!title) return;
        busy = true;
        try {
            if (collectionMode === "rename") await library.renameCollection(editor.owner(), collectionId, title);
            else await library.createCollection(editor.owner(), title);
            closeCollectionDialog();
            await refresh();
        } catch (error) {
            setNotice(error.message, true);
        } finally { busy = false; }
    }
    async function removeCollection(item) {
        const okay = await confirmDialog(
            "Eliminare la raccolta?",
            "Eliminare \"" + item.name + "\"? Gli audio rimarranno nella libreria."
        );
        if (!okay) return;
        try {
            await library.deleteCollection(editor.owner(), item.id);
            if (selectedCollection === item.id) { filter = "all"; selectedCollection = ""; }
            await refresh();
        } catch (error) {
            setNotice(error.message, true);
        }
    }
    async function importFiles() {
        if (busy) return;
        const files = [...($("studioSoundFileInput").files || [])];
        if (!files.length) return;
        busy = true;
        let imported = 0, duplicates = 0;
        const problems = [];
        try {
            for (const file of files) {
                try {
                    const item = await library.importFile(file, editor.owner());
                    if (item.duplicate) duplicates++;
                    else imported++;
                } catch (error) {
                    problems.push(file.name + ": " + error.message);
                }
            }
            await refresh();
            setNotice(
                imported + " audio importati, " + duplicates + " duplicati ignorati." +
                (problems.length ? " Errori: " + problems.join("; ") : ""),
                Boolean(problems.length)
            );
        } finally {
            $("studioSoundFileInput").value = "";
            busy = false;
        }
    }
    async function renderCollections(collections) {
        const container = $("studioSoundCollections");
        container.replaceChildren();
        for (const collection of collections) {
            const row = node("div", "studio-sound-collection-entry");
            const selected = filter === "collection" && selectedCollection === collection.id;
            const label = button(collection.name, "Mostra questa raccolta", () => {
                filter = "collection";
                selectedCollection = collection.id;
                refresh().catch(error => setNotice(error.message, true));
            }, selected ? "is-selected" : "");
            label.setAttribute("aria-pressed", String(selected));
            const rename = button("✎", "Rinomina raccolta " + collection.name, () => collectionDialog("rename", collection));
            rename.setAttribute("aria-label", "Rinomina " + collection.name);
            const remove = button("×", "Elimina raccolta " + collection.name, () => removeCollection(collection));
            remove.setAttribute("aria-label", "Elimina " + collection.name);
            row.append(label, rename, remove);
            container.append(row);
        }
    }
    async function renderTrack(track, collections) {
        const row = node("div", "studio-sound-row");
        const icon = node("span", "studio-sound-disc");
        icon.setAttribute("aria-hidden", "true");
        const main = node("div", "studio-sound-row-main");
        const title = node("strong", "", track.name);
        const subtitle = node("small", "", bytes(track.size) +
            (track.lastUsedAt ? " · usato di recente" : ""));
        main.append(title, subtitle);
        const actions = node("div", "studio-sound-row-actions");
        actions.append(
            button("▶", "Ascolta " + track.name, () => preview(track)),
            button(track.favorite ? "♥" : "♡", track.favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti", async () => {
                try {
                    await library.setFavorite(editor.owner(), track.id, !track.favorite);
                    await refresh();
                } catch (error) { setNotice(error.message, true); }
            }, track.favorite ? "is-favorite" : ""),
            button("Usa nel progetto", "Inserisci questo audio nel progetto aperto", () => useInProject(track), "studio-accent-button")
        );
        if (collections.length) {
            const select = node("select");
            select.setAttribute("aria-label", "Raccolte di " + track.name);
            const placeholder = node("option", "", "Raccolte…");
            placeholder.value = "";
            select.append(placeholder);
            for (const collection of collections) {
                const included = track.collections?.includes(collection.id);
                const option = node("option", "", (included ? "✓ " : "+ ") + collection.name);
                option.value = collection.id;
                select.append(option);
            }
            select.value = "";
            select.addEventListener("change", async () => {
                if (!select.value) return;
                const id = select.value;
                const included = track.collections?.includes(id);
                try {
                    await library.setCollectionMembership(editor.owner(), track.id, id, !included);
                    await refresh();
                } catch (error) { setNotice(error.message, true); }
            });
            actions.append(select);
        }
        actions.append(button("×", "Rimuovi " + track.name + " dalla libreria", () => removeTrack(track)));
        row.append(icon, main, actions);
        return row;
    }
    async function refresh() {
        const serial = ++refreshSerial;
        const owner = editor.owner();
        const [allTracks, collections, stats] = await Promise.all([
            library.listTracks(owner),
            library.listCollections(owner),
            library.stats(owner)
        ]);
        if (serial !== refreshSerial || owner !== editor.owner()) return;
        $("studioSoundStats").textContent = stats.count + " audio · " + bytes(stats.size);
        await renderCollections(collections);
        root.document.querySelectorAll("[data-sound-filter]").forEach(element => {
            const active = filter === element.dataset.soundFilter;
            element.classList.toggle("is-selected", active);
            element.setAttribute("aria-pressed", String(active));
        });
        const search = $("studioSoundSearch").value.trim().toLocaleLowerCase("it");
        const tracks = allTracks.filter(track => {
            if (filter === "favorites" && !track.favorite) return false;
            if (filter === "recent" && !track.lastUsedAt) return false;
            if (filter === "collection" && !track.collections?.includes(selectedCollection)) return false;
            return !search || track.name.toLocaleLowerCase("it").includes(search);
        });
        if (filter === "recent") tracks.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
        const list = $("studioSoundList");
        list.replaceChildren();
        if (!tracks.length) {
            const empty = node("div", "studio-sound-blank");
            empty.append(
                node("strong", "", allTracks.length ? "Nessun risultato" : "La libreria è vuota"),
                node("span", "", allTracks.length
                    ? "Cambia filtro o ricerca."
                    : "Importa un file audio dal tuo dispositivo.")
            );
            list.append(empty);
            return;
        }
        for (const track of tracks) list.append(await renderTrack(track, collections));
    }
    function setView(next) {
        view = next;
        if (next !== "sounds") {
            if (previewUrl) clearPreview();
            return;
        }
        const owner = editor.owner();
        if (previewOwner && previewOwner !== owner) clearPreview();
        refresh().catch(error => setNotice(error.message, true));
    }

    $("studioSoundImport").addEventListener("click", () => $("studioSoundFileInput").click());
    $("studioSoundFileInput").addEventListener("change", () =>
        importFiles().catch(error => setNotice(error.message, true)));
    $("studioSoundNewCollection").addEventListener("click", () => collectionDialog("create"));
    $("studioSoundRefresh").addEventListener("click", () =>
        refresh().catch(error => setNotice(error.message, true)));
    $("studioSoundSearch").addEventListener("input", () =>
        refresh().catch(error => setNotice(error.message, true)));
    root.document.querySelectorAll("[data-sound-filter]").forEach(element => element.addEventListener("click", () => {
        filter = element.dataset.soundFilter;
        selectedCollection = "";
        refresh().catch(error => setNotice(error.message, true));
    }));
    $("studioSoundCollectionForm").addEventListener("submit", submitCollection);
    $("studioSoundCollectionCancel").addEventListener("click", closeCollectionDialog);
    $("studioSoundConfirmYes").addEventListener("click", () => resolveConfirm(true));
    $("studioSoundConfirmNo").addEventListener("click", () => resolveConfirm(false));
    root.document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        if (!$("studioSoundCollectionDialog").hidden) closeCollectionDialog();
        if (!$("studioSoundConfirmDialog").hidden) resolveConfirm(false);
    });
    root.addEventListener("brat:studio-view", event => setView(event.detail?.view || "home"));
    root.addEventListener("pagehide", clearPreview);
    audio.addEventListener("error", () => {
        if (!audio.src) return;
        setNotice("Questo file non è riproducibile dal browser. Prova un MP3 o WAV.", true);
    });

    root.BratSoundHubUI = Object.freeze({ refresh, setView });
    setView(root.BratStudio?.getView?.() || "home");
})(typeof window !== "undefined" ? window : globalThis);
