/* Phase 12 — portable quick templates. Pure definitions + thin DOM adapter.
 * Applies existing editor controls through their native change/input events.
 * Never alters lyrics, media files, assets, or export destination.
 */
(function (root, factory) {
    "use strict";
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root?.document) {
        root.BratEditorTemplates = api;
        root.BratEditorTemplatesInstance = api.mount(root.document);
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    "use strict";
    const TEMPLATES = Object.freeze({
        "brat-classic": Object.freeze({
            name: "Brat Classic", description: "Square green canvas and typewriter lyrics.",
            controls: Object.freeze({
                formatPresetSelect: "square", themePresetSelect: "classic",
                lyricsDisplayModeSelect: "brat", animationModeSelect: "typewriter", exportFpsSelect: "30"
            })
        }),
        "kinetic-reels": Object.freeze({
            name: "Kinetic Reels", description: "Vertical word collage for short videos.",
            controls: Object.freeze({
                formatPresetSelect: "vertical", themePresetSelect: "kinetic-blue",
                lyricsDisplayModeSelect: "kinetic", animationModeSelect: "word", exportFpsSelect: "30"
            })
        }),
        "cinematic": Object.freeze({
            name: "Cinematic", description: "Widescreen presentation with cinematic lyric scroll.",
            controls: Object.freeze({
                formatPresetSelect: "landscape", themePresetSelect: "dark-green",
                lyricsDisplayModeSelect: "beautiful", animationModeSelect: "line", exportFpsSelect: "30"
            })
        }),
        "music-vertical": Object.freeze({
            name: "Music Scroll", description: "Vertical synchronized music lyrics.",
            controls: Object.freeze({
                formatPresetSelect: "vertical", themePresetSelect: "blue",
                lyricsDisplayModeSelect: "music", animationModeSelect: "word", exportFpsSelect: "30"
            })
        })
    });

    function applyTemplate(document, key) {
        const preset = TEMPLATES[key];
        if (!preset) throw new Error("Modello non disponibile.");
        const controls = [];
        // Prevalidate every target to avoid half-applied presets if the
        // underlying editor is updated and an option disappears.
        for (const [id, value] of Object.entries(preset.controls)) {
            const node = document.getElementById(id);
            if (!node || !Array.from(node.options || []).some(option => option.value === value)) {
                throw new Error("Il modello non è compatibile con questa versione dell'editor: " + id);
            }
            controls.push({ id, node, value });
        }
        for (const { id, node, value } of controls) {
            node.value = value;
            const eventType = id === "lyricsDisplayModeSelect" || id === "animationModeSelect" ? "input" : "change";
            node.dispatchEvent(new Event(eventType, { bubbles: true }));
        }
        return preset;
    }

    function mount(document) {
        const container = document.getElementById("editorTemplateGallery");
        const output = document.getElementById("editorTemplateStatus");
        if (!container || !output) return null;
        function activate(key) {
            try {
                const preset = applyTemplate(document, key);
                output.textContent = preset.name + " applied. Your lyrics and media are unchanged.";
                return preset;
            } catch (error) {
                output.textContent = error.message;
                return null;
            }
        }
        container.addEventListener("click", event => {
            const button = event.target.closest("button[data-template]");
            if (button && container.contains(button)) activate(button.dataset.template);
        });
        return Object.freeze({ activate });
    }
    return Object.freeze({ TEMPLATES, applyTemplate, mount });
});
