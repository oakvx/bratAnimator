/* Dashboard-to-editor guided tour bridge.
 * Reuses the editor's existing tutorial and the official 7.css window shell.
 * The F1 key follows Windows Help convention; it never modifies projects.
 */
(function (root) {
    "use strict";
    const $ = id => root.document.getElementById(id);
    const titles = {
        home: "Home", projects: "Progetti", sounds: "Sound Hub",
        share: "BRATCODE", settings: "Impostazioni"
    };
    const home = () => root.BratStudio?.show("home");
    function showTour() {
        if (!$("permissionNotice")?.classList.contains("hidden")) return;
        if (!root.BratGuidedTour) return;
        root.BratGuidedTour.start(0);
    }
    for (const id of ["studioGuideButton", "studioGuideShortcut", "studioAddressHelp"]) {
        $(id)?.addEventListener("click", showTour);
    }
    $("studioAddressHome")?.addEventListener("click", home);
    root.document.querySelectorAll("[data-studio-quick-tab]").forEach(button => {
        button.addEventListener("click", () => {
            root.BratStudio?.show("editor");
            root.document.querySelector('[data-open-tab="' + button.dataset.studioQuickTab + '"]')?.click();
        });
    });
    root.document.querySelectorAll("[data-studio-quick-view]").forEach(button => {
        button.addEventListener("click", () => root.BratStudio?.show(button.dataset.studioQuickView));
    });
    root.addEventListener("brat:studio-view", event => {
        if ($("studioAddressCurrent")) {
            $("studioAddressCurrent").textContent = titles[event.detail?.view] || "Brat Animator";
        }
    });
    root.document.addEventListener("keydown", event => {
        if (event.key !== "F1" || event.altKey || event.ctrlKey || event.metaKey) return;
        if (!root.document.body.classList.contains("studio-dashboard-open") &&
            !root.document.body.classList.contains("studio-editor-open")) return;
        event.preventDefault();
        showTour();
    });
})(window);
