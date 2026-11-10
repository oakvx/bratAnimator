/* Phase 17 — editor IA/layout organization; moves existing nodes, never clones.
 * Listeners and element IDs stay attached. No new editing features are introduced.
 */
(function () {
    "use strict";
    if (document.body.dataset.inspectorLayout === "organized") return;
    const $ = id => document.getElementById(id);
    const nav = document.querySelector(".editor-tabs");
    if (!nav || !$("section-timing") || !$("section-tracks")) return;

    // The user workflow is: find lyrics -> edit timing -> arrange timeline ->
    // style -> canvas -> export -> manage project. Keep historical data-* names
    // intact because they are referenced by command palette and saved settings.
    const navigation = [
        ["lyrics", "find"], ["timing", "lyrics"], ["tracks", "timeline"],
        ["design", "style"], ["canvas", "canvas"], ["export", "export"],
        ["project", "project"]
    ];
    for (const [index, [name, label]] of navigation.entries()) {
        const button = nav.querySelector('[data-open-tab="' + name + '"]');
        if (!button) continue;
        button.replaceChildren();
        const number = document.createElement("span");
        number.textContent = String(index + 1);
        button.append(number, document.createTextNode(" " + label));
        nav.append(button);
    }

    function section(name, label) {
        const node = $("section-" + name);
        const title = node?.querySelector(":scope > .section-title");
        if (title) title.textContent = label;
        return node;
    }
    function rootChild(container, node) {
        if (!container || !node || !container.contains(node)) return null;
        while (node.parentElement && node.parentElement !== container) node = node.parentElement;
        return node.parentElement === container ? node : null;
    }
    function rootFor(container, selector) {
        return rootChild(container, container?.querySelector(selector));
    }
    const optionalGroups = new Set(["style-motion", "style-background", "style-library", "export-preflight", "project-preview"]);
    function createGroup(container, key, heading, description = "") {
        const collapsible = optionalGroups.has(key);
        const group = document.createElement(collapsible ? "details" : "section");
        group.className = "inspector-group";
        group.dataset.layoutGroup = key;
        group.setAttribute("aria-label", heading);
        const title = document.createElement(collapsible ? "summary" : "h3");
        title.className = "inspector-group-heading";
        title.textContent = heading;
        group.append(title);
        if (description) {
            const copy = document.createElement("p");
            copy.className = "inspector-group-description";
            copy.textContent = description;
            group.append(copy);
        }
        container.append(group);
        return group;
    }
    function add(container, group, selectors) {
        for (const selector of selectors) {
            const block = rootFor(container, selector);
            if (block && block !== group && !group.contains(block)) group.append(block);
        }
    }
    function range(container, group, first, last) {
        const start = rootFor(container, first);
        const end = rootFor(container, last);
        if (!start || !end) return;
        const all = [...container.children];
        const begin = all.indexOf(start), finish = all.indexOf(end);
        if (begin < 0 || finish < begin) return;
        for (const node of all.slice(begin, finish + 1)) group.append(node);
    }

    const find = section("lyrics", "Find lyrics");
    if (find) range(find, createGroup(find, "search", "Search a song", "Use a provider or paste a song link; the resulting lyrics can be edited in the next tab."),
        'label[for="lyricsProviderSelect"]', "#searchSourceCredit");

    const timing = section("timing", "Lyrics & timing");
    const project = section("project", "Projects & backups");
    const design = section("design", "Style & effects");
    const canvas = section("canvas", "Canvas & format");
    const output = section("export", "Export");
    const tracks = section("tracks", "Timeline & tracks");

    // Remove destructive backup commands from the timing workflow. The node
    // (not a replacement) will be placed under Project, with its listener.
    const clearSavedRow = rootFor(timing, "#clearSavedBtn");
    if (clearSavedRow) clearSavedRow.remove();
    if (timing) {
        range(timing, createGroup(timing, "lyrics-input", "Source text",
            "Paste, import or normalize time-coded lyrics."), 'label[for="lyricsInput"]', "#starterLrcBtn");
        const edit = createGroup(timing, "lyrics-editor", "Phrase editor",
            "Fine-tune individual lines and generate timestamps.");
        add(timing, edit, ["#lrcSearchInput", "#plainLyricsInput", "#translationSettings"]);
        const audio = createGroup(timing, "timing-media", "Timing reference",
            "Use local audio/video to analyze beats and align the lyrics.");
        range(timing, audio, 'label[for="audioFileInput"]', "#timelineCanvas");
        add(timing, audio, ["#beatSettings"]);
        range(timing, createGroup(timing, "timing-playback", "Synchronize & playback"),
            "#useAudioTimingCheckbox", "#timingReport");
    }

    if (design) {
        const presets = createGroup(design, "style-presets", "Looks & animation");
        add(design, presets, [".editor-template-section", "#themePresetSelect"]);
        const typography = createGroup(design, "style-typography", "Typography");
        add(design, typography, ["#textSettings", "#entranceSettings"]);
        const colors = createGroup(design, "style-colors", "Colors & effects");
        add(design, colors, ["#bgColorInput", "#contrastRatio", "#backgroundFillTypeSelect",
            "#letterChunkSizeInput"]);
        const motion = createGroup(design, "style-motion", "Lyric animation");
        add(design, motion, ["#musicModeNote", "#kineticSettings", ".music-options"]);
        const media = createGroup(design, "style-background", "Background media");
        add(design, media, ["#backgroundFileInput"]);
        const library = createGroup(design, "style-library", "Presets & utilities");
        add(design, library, ["#randomStyleBtn", "#presetNameInput"]);
    }

    if (canvas) {
        const dimensions = createGroup(canvas, "canvas-shape", "Output shape",
            "Use the same aspect ratio for the preview and the video export.");
        add(canvas, dimensions, ["[data-preset-quick='square']", "#canvasFormatSummary"]);
        const guides = createGroup(canvas, "canvas-guides", "Safe zones & preview");
        add(canvas, guides, ["#canvasFullscreenBtn", "#previewZoomInput"]);
        const checkbox = $("safeZonesCheckbox")?.closest("label");
        if (checkbox) guides.prepend(checkbox); // Keep the existing checkbox and its handlers.
    }

    if (tracks) {
        const sources = createGroup(tracks, "track-sources", "Import & organize tracks",
            "Use local video, image and audio files. Tracks are rendered from back to front.");
        add(tracks, sources, ["#mtImportMediaInput", "#mtTrackType", "#mtTrackList", "#mtTrackName"]);
        const clips = createGroup(tracks, "track-clips", "Select & arrange clips");
        add(tracks, clips, ["#mtClipList", "#mtClipKind", "#mtAddClip", "#mtSplitClip"]);
        const audio = createGroup(tracks, "track-audio", "Audio properties",
            "Track/clip gain, fade-in, fade-out and soundtrack playback.");
        add(tracks, audio, ["#mtTrackVolume", "#mtAudioStatus"]);
        const visual = createGroup(tracks, "track-visual", "Visual properties",
            "Edit overlays, position, scale, rotation and opacity.");
        add(tracks, visual, ["#mtClipText"]);
        add(tracks, clips, ["#mtStatus"]);
        // This old heading became redundant after replacing the flat form with
        // grouped, labelled controls.
        tracks.querySelector(':scope > .section-title:not(:first-child)')?.remove();
        const lead = tracks.querySelector(":scope > .mini-copy");
        if (lead) lead.textContent = "Import media, arrange clips and choose the properties of the selected layer. All changes are stored locally.";
        const sourceText = sources.querySelector(".mini-copy");
        if (sourceText) sourceText.textContent = "Media files remain in this browser. File limit: 512 MiB each.";
    }

    if (output) {
        const settings = createGroup(output, "export-settings", "Output settings",
            "Choose the destination format, resolution, frame rate and optional legacy audio.");
        add(output, settings, ["#formatPresetSelect", "#compatPanel", "#includeAudioInExportCheckbox",
            "#exportRangeSettings"]);
        const actions = createGroup(output, "export-actions", "Render & download");
        add(output, actions, ["#exportVideoBtn", "#exportProgress", "#exportStatus",
            "#exportEstimate"]);
        const guidance = createGroup(output, "export-preflight", "Preflight checks",
            "Advanced browser/codec checks; review these if an export fails.");
        add(output, guidance, ["#exportPreflight"]);
        const intro = output.querySelector(":scope > p[data-i18n='exportIntro']");
        if (intro) intro.textContent = "Export your current arrangement as video or still frames. Timing and audio are taken from the same timeline.";
        const endnote = output.querySelector(":scope > .pill-note");
        if (endnote) {
            endnote.textContent = "Audio/video tracks are mixed automatically. Legacy Timing audio is optional.";
            settings.append(endnote);
        }
    }

    if (project) {
        const snapshots = createGroup(project, "project-snapshots", "Snapshots",
            "Save named editing states and recover your work in this browser.");
        add(project, snapshots, ["#snapshotNameInput", "#saveSnapshotBtn", "#projectFeatureStatus",
            "#snapshotList", "#sidebarExportProjectBtn"]);
        const backups = createGroup(project, "project-backup", "Portable files & data",
            "JSON saves settings only; complete bundles include locally available media.");
        add(project, backups, ["#packageSettings"]);
        // Remove import/export JSON controls from Export: Project is their home.
        const exportProjectRow = rootFor(output, "#exportProjectBtn");
        if (exportProjectRow) backups.append(exportProjectRow);
        if (clearSavedRow) backups.append(clearSavedRow);
        const external = createGroup(project, "project-preview", "External reference video");
        add(project, external, ["#youtubeStatus", "#youtubeResults"]);
        const externalLabel = project.querySelector(':scope > .label[data-i18n="videoSelection"]');
        if (externalLabel) external.prepend(externalLabel);
        const spareTitle = project.querySelector(":scope > .project-tools-title");
        spareTitle?.remove();
    }

    // Preflight stays collapsed until requested. Surface its concise status in
    // the disclosure heading even while the detailed list is out of view.
    const diagnostics = output?.querySelector('[data-layout-group="export-preflight"]');
    const report = $("exportPreflightSummary");
    const diagnosticsTitle = diagnostics?.querySelector(".inspector-group-heading");
    if (diagnostics && report && diagnosticsTitle) {
        const refreshReport = () => {
            const text = report.textContent.trim().replace(/\s+/g, " ");
            diagnosticsTitle.textContent = text
                ? "Preflight checks · " + (text.length > 54 ? text.slice(0, 51) + "…" : text)
                : "Preflight checks";
        };
        new MutationObserver(refreshReport).observe(report, { characterData: true, childList: true, subtree: true });
        refreshReport();
    }

    const leadTitles = {
        tracks: "Timeline & tracks", timing: "Lyrics & timing", design: "Style & effects",
        export: "Export", project: "Projects & backups", canvas: "Canvas & format", lyrics: "Find lyrics"
    };
    for (const [name, title] of Object.entries(leadTitles)) {
        const tab = $("tab-" + name);
        if (tab) tab.setAttribute("title", title);
    }

    function syncTrackPropertyPanels() {
        const host = window.BratMultitrackHost;
        if (!host) return;
        const graph = host.snapshot();
        const track = graph.tracks.find(item => item.id === graph.selectedTrackId);
        const clip = track?.clips.find(item => item.id === graph.selectedClipId);
        const audio = tracks?.querySelector('[data-layout-group="track-audio"]');
        const visual = tracks?.querySelector('[data-layout-group="track-visual"]');
        if (audio) audio.hidden = !clip || !["audio", "video"].includes(clip.kind);
        if (visual) visual.hidden = !clip || !["text", "image", "video"].includes(clip.kind);
    }
    window.addEventListener("brat:multitrack-changed", syncTrackPropertyPanels);
    syncTrackPropertyPanels();
    document.body.dataset.inspectorLayout = "organized";
})();
