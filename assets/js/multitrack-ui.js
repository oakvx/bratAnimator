/* Phase 14: minimal track/clip management UI. Visual compositing is phase 15. */
(function () {
    "use strict";
    const API = window.BratTracks;
    const host = window.BratMultitrackHost;
    const byId = id => document.getElementById(id);
    const tracksEl = byId("mtTrackList");
    const clipsEl = byId("mtClipList");
    if (!API || !host || !tracksEl || !clipsEl) return;

    const status = byId("mtStatus");
    const element = (tag, className, content) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (content != null) node.textContent = String(content);
        return node;
    };
    const button = (name, title, click, pressed = null) => {
        const node = element("button", "", title);
        node.type = "button";
        node.setAttribute("aria-label", name);
        if (pressed != null) node.setAttribute("aria-pressed", String(pressed));
        node.addEventListener("click", click);
        return node;
    };
    const message = (text, error = false) => {
        status.textContent = text;
        status.classList.toggle("is-error", error);
    };
    const run = (operation, args) => {
        try {
            const graph = host.apply(operation, args);
            message("Saved to local project • " + graph.tracks.length + " tracks");
        } catch (error) {
            message(error.message || "Cannot edit clip.", true);
        }
    };
    const selection = () => {
        const graph = host.snapshot();
        const track = graph.tracks.find(item => item.id === graph.selectedTrackId);
        const clip = track?.clips.find(item => item.id === graph.selectedClipId) || null;
        return { graph, track, clip };
    };
    const nameField = byId("mtClipName");
    const startField = byId("mtClipStart");
    const durationField = byId("mtClipDuration");
    const kindField = byId("mtClipKind");
    const sourceField = byId("mtClipSource");
    const availableKinds = kind => kind === "video" ? ["video", "image"] :
        kind === "overlay" ? ["image", "video", "text"] :
            kind === "lyrics" ? ["text"] : ["audio"];

    function render() {
        const { graph, track, clip } = selection();
        tracksEl.replaceChildren();
        for (const entry of graph.tracks) {
            const row = element("div", "mt-track-row" + (track?.id === entry.id ? " is-selected" : ""));
            const select = button("Select track " + entry.name,
                entry.name + " · " + entry.kind + " · " + entry.clips.length,
                () => run("select-track", { trackId: entry.id }), track?.id === entry.id);
            select.className = "mt-select";
            row.append(select);
            row.append(button("Toggle track visibility", entry.visible ? "visible" : "hidden",
                () => run("set-track", { trackId: entry.id, visible: !entry.visible }), entry.visible));
            row.append(button("Toggle track mute", entry.muted ? "muted" : "sound",
                () => run("set-track", { trackId: entry.id, muted: !entry.muted }), entry.muted));
            row.append(button("Toggle track lock", entry.locked ? "locked" : "unlocked",
                () => run("set-track", { trackId: entry.id, locked: !entry.locked }), entry.locked));
            tracksEl.append(row);
        }
        clipsEl.replaceChildren();
        if (track) {
            for (const entry of track.clips) {
                const row = element("div", "mt-clip-row" + (clip?.id === entry.id ? " is-selected" : ""));
                const select = button("Select clip " + entry.name,
                    entry.name + " · " + entry.kind + " · " + entry.start.toFixed(2) + "s – " +
                    (entry.start + entry.duration).toFixed(2) + "s",
                    () => run("select-clip", { clipId: entry.id }), clip?.id === entry.id);
                select.className = "mt-select";
                row.append(select);
                clipsEl.append(row);
            }
            if (!track.clips.length) clipsEl.append(element("p", "mini-copy", "No clips in this track."));
        } else clipsEl.append(element("p", "mini-copy", "Select or add a track."));
        byId("mtTrackName").value = track?.name || "";
        const previousKind = kindField.value;
        kindField.replaceChildren();
        for (const kind of availableKinds(track?.kind)) {
            const option = element("option", "", kind);
            option.value = kind;
            kindField.append(option);
        }
        if ([...kindField.options].some(option => option.value === previousKind)) kindField.value = previousKind;
        const imported = host.sources();
        const chosenKind = kindField.value;
        const oldSource = sourceField.value;
        sourceField.replaceChildren();
        const blank = element("option", "", "No imported media (planning only)");
        blank.value = "";
        sourceField.append(blank);
        for (const item of imported.filter(item => item.kind === chosenKind)) {
            const option = element("option", "", item.name);
            option.value = item.assetId;
            sourceField.append(option);
        }
        if ([...sourceField.options].some(option => option.value === oldSource)) sourceField.value = oldSource;
        if (clip) {
            nameField.value = clip.name;
            startField.value = String(clip.start);
            durationField.value = String(clip.duration);
            byId("mtSplitAt").value = String(clip.start + clip.duration / 2);
            kindField.value = clip.kind;
            // Rebuild matching source choices for the selected clip's type.
            const selectedKind = kindField.value;
            sourceField.replaceChildren(blank);
            for (const item of imported.filter(item => item.kind === selectedKind)) {
                const option = element("option", "", item.name);
                option.value = item.assetId;
                sourceField.append(option);
            }
            sourceField.value = clip.source.assetId || "";
        } else {
            nameField.value = "";
            startField.value = "0";
            durationField.value = "5";
        }
        for (const id of ["mtAddClip", "mtApplyClip", "mtDuplicateClip", "mtDeleteClip", "mtSplitClip"]) {
            byId(id).disabled = !track || track.locked || (id !== "mtAddClip" && !clip);
        }
        for (const id of ["mtRenameTrack", "mtDeleteTrack", "mtMoveTrackUp", "mtMoveTrackDown"]) {
            byId(id).disabled = !track || track.locked;
        }
        if (track) byId("mtDeleteTrack").title = "Deletes all clips in this track";
    }
    kindField.addEventListener("change", () => {
        const chosen = kindField.value;
        sourceField.replaceChildren();
        const blank = element("option", "", "No imported media (planning only)");
        blank.value = "";
        sourceField.append(blank);
        for (const item of host.sources().filter(source => source.kind === chosen)) {
            const option = element("option", "", item.name);
            option.value = item.assetId;
            sourceField.append(option);
        }
    });
    byId("mtAddTrack").addEventListener("click", () => run("add-track", {
        kind: byId("mtTrackType").value
    }));
    byId("mtRenameTrack").addEventListener("click", () => run("rename-track", {
        trackId: selection().track?.id, name: byId("mtTrackName").value
    }));
    byId("mtMoveTrackUp").addEventListener("click", () => run("move-track", {
        trackId: selection().track?.id, direction: "up"
    }));
    byId("mtMoveTrackDown").addEventListener("click", () => run("move-track", {
        trackId: selection().track?.id, direction: "down"
    }));
    byId("mtDeleteTrack").addEventListener("click", () => {
        const track = selection().track;
        if (track && window.confirm("Delete track and all its clips?")) run("remove-track", { trackId: track.id });
    });
    byId("mtAddClip").addEventListener("click", () => {
        const { track } = selection();
        if (!track) return;
        const kind = kindField.value;
        const source = host.sources().find(item => item.assetId === sourceField.value && item.kind === kind);
        const name = nameField.value || source?.name || kind + " clip";
        run("add-clip", { trackId: track.id, clip: {
            kind, name, start: Number(startField.value),
            duration: Number(durationField.value), source: source ?
                { kind, name: source.name, assetId: source.assetId } :
                { kind, name: "", text: kind === "text" ? name : "" }
        } });
    });
    byId("mtApplyClip").addEventListener("click", () => {
        const { clip } = selection();
        if (!clip) return;
        const start = Number(startField.value), duration = Number(durationField.value);
        // A later start moves a clip without changing its source in-point.
        if (start !== clip.start) run("move-clip", { clipId: clip.id, start });
        if (duration !== clip.duration) run("trim-clip", { clipId: clip.id, duration });
        if (nameField.value !== clip.name) run("set-clip", { clipId: clip.id, name: nameField.value });
    });
    byId("mtSplitClip").addEventListener("click", () => {
        const { clip } = selection();
        if (clip) run("split-clip", { clipId: clip.id, at: Number(byId("mtSplitAt").value) });
    });
    byId("mtDuplicateClip").addEventListener("click", () => {
        const { clip } = selection();
        if (clip) run("duplicate-clip", { clipId: clip.id });
    });
    byId("mtDeleteClip").addEventListener("click", () => {
        const { clip } = selection();
        if (clip && window.confirm("Delete selected clip?")) run("remove-clip", { clipId: clip.id });
    });
    window.addEventListener("brat:multitrack-changed", render);
    window.BratMultitrackUI = Object.freeze({ render });
    render();
})();
