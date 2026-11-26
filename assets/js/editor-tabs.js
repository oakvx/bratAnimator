/* mappa dei 4 tab dell'editor sulle 7 sezioni storiche.
 * i nomi storici restano validi: progetti salvati, palette comandi e guida li usano ancora.
 */
(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.BratEditorTabs = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";
    const GROUPS = Object.freeze({
        text: Object.freeze(["lyrics", "timing"]),
        timeline: Object.freeze(["tracks"]),
        style: Object.freeze(["design", "canvas"]),
        export: Object.freeze(["export", "project"])
    });
    const owner = new Map();
    for (const [group, sections] of Object.entries(GROUPS)) {
        for (const section of sections) owner.set(section, group);
    }
    // "export" è sia gruppo che sezione: il gruppo vince, ed è lo stesso
    function groupOf(name) {
        if (Object.hasOwn(GROUPS, name)) return name;
        return owner.get(name) || "text";
    }
    function sectionsOf(group) {
        return Object.hasOwn(GROUPS, group) ? [...GROUPS[group]] : [];
    }
    return Object.freeze({ GROUPS, groupOf, sectionsOf });
});
