/* finestra editor windows 7: menu, toolbar e menu compatto su telefono.
 * non tocca lo stato del progetto: ogni comando clicca i controlli che esistono già.
 */
(function (root) {
    "use strict";
    const document = root.document;
    const $ = id => document.getElementById(id);
    const menu = $("editorMenuBar");
    const toolbar = $("editorToolbar");
    const toggle = $("editorMenuToggle");
    if (!menu || !toolbar) return;

    const nav = () => root.BratEditorNav;
    const click = id => $(id)?.click();
    const focusLater = id => root.requestAnimationFrame(() => $(id)?.focus({ preventScroll: false }));

    function closeCompactMenu() {
        document.body.classList.remove("editor-menu-open");
        toggle?.setAttribute("aria-expanded", "false");
    }

    const commands = {
        "new": () => click("studioNewProject"),
        "projects": () => root.BratStudio?.show("projects"),
        "snapshot": () => { nav()?.openTab("project"); focusLater("snapshotNameInput"); },
        "bundle": () => { nav()?.openTab("project"); $("packageSettings")?.scrollIntoView({ block: "start" }); },
        "close-editor": () => click("studioEditorClose"),
        // testo e timeline condividono la stessa pila di annullamento
        "undo": () => click("undoBtn"),
        "redo": () => click("redoBtn"),
        "fit": () => click("stageFitBtn"),
        "fullscreen": () => click("stageFullscreenBtn"),
        "about": () => {
            const dialog = $("studioAboutDialog");
            if (!dialog) return;
            dialog.hidden = false;
            $("studioAboutClose")?.focus();
        }
    };

    const bar = root.BratWin7WindowMenu?.createMenuBar(menu, {
        run(command) { closeCompactMenu(); commands[command]?.(); },
        document,
        win: root
    });
    // i bottoni con id propri (demo, lingua, tema…) hanno già i loro listener in app.js
    menu.addEventListener("click", event => {
        if (event.target.closest("button:not([data-win7-command]), a")) closeCompactMenu();
    });

    toggle?.addEventListener("click", () => {
        const open = !document.body.classList.contains("editor-menu-open");
        document.body.classList.toggle("editor-menu-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        if (!open) bar?.close();
    });

    const actions = {
        studio: () => root.BratStudio?.show("home"),
        play: () => click("stagePlayBtn"),
        undo: () => click("undoBtn"),
        redo: () => click("redoBtn"),
        split: () => click("studioTlSplit"),
        export: () => { nav()?.openTab("export"); focusLater("exportVideoBtn"); }
    };
    toolbar.addEventListener("click", event => {
        const button = event.target.closest("[data-editor-action]");
        if (button) actions[button.dataset.editorAction]?.();
    });

    // il bottone riproduci della toolbar segue lo stato del player dell'anteprima
    const stagePlay = $("stagePlayBtn");
    const toolbarPlay = $("toolbarPlayBtn");
    function syncPlay() {
        if (!stagePlay || !toolbarPlay) return;
        const playing = stagePlay.getAttribute("aria-pressed") === "true";
        toolbarPlay.setAttribute("aria-pressed", String(playing));
        const key = playing ? "toolPause" : "toolPlay";
        toolbarPlay.dataset.i18n = key;
        const label = root.BratI18n?.translate?.(root.BratI18n.getSavedLanguage(), key);
        toolbarPlay.textContent = label || (playing ? "Pausa" : "Riproduci");
    }
    if (stagePlay && toolbarPlay) {
        new root.MutationObserver(syncPlay).observe(stagePlay, { attributes: true, attributeFilter: ["aria-pressed"] });
        syncPlay();
    }

    // telefono: il pannello diventa un foglio a mezza altezza aperto dai tab in basso
    const phone = root.matchMedia?.("(max-width: 899px)");
    const panel = $("panel");
    const isPhone = () => Boolean(phone?.matches);
    function setSheet(open) {
        document.body.classList.toggle("editor-sheet-open", open);
    }
    function ensurePanel() {
        // su telefono il pannello non si nasconde mai: resta la barra dei tab
        if (isPhone() && panel?.classList.contains("hidden")) {
            panel.classList.remove("hidden");
            root.syncPanelState?.();
        }
    }
    // il menu compatto si chiude toccando fuori, con esc o scegliendo un tab
    document.addEventListener("pointerdown", event => {
        if (!document.body.classList.contains("editor-menu-open")) return;
        if (menu.contains(event.target) || toggle?.contains(event.target)) return;
        closeCompactMenu();
        bar?.close();
    }, true);
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape" || !document.body.classList.contains("editor-menu-open") || bar?.isOpen()) return;
        closeCompactMenu();
        toggle?.focus();
    });
    document.addEventListener("click", event => {
        if (!isPhone()) return;
        const tab = event.target.closest?.(".editor-tab");
        if (tab) closeCompactMenu();
        if (tab && document.body.classList.contains("editor-sheet-open") && tab.getAttribute("aria-selected") === "true") {
            event.stopPropagation();
            setSheet(false);
            return;
        }
        if (event.target.closest?.("#togglePanelBtn")) {
            event.stopPropagation();
            closeCompactMenu();
            bar?.close();
            setSheet(!document.body.classList.contains("editor-sheet-open"));
        }
    }, true);
    root.addEventListener("brat:editor-tab", event => {
        if (!isPhone() || !event.detail?.reveal) return;
        ensurePanel();
        setSheet(true);
    });
    $("editorSheetClose")?.addEventListener("click", () => setSheet(false));
    phone?.addEventListener?.("change", event => {
        closeCompactMenu();
        bar?.close();
        if (event.matches) ensurePanel();
        else setSheet(false);
    });
    ensurePanel();
    root.addEventListener("brat:studio-view", () => { closeCompactMenu(); setSheet(false); });
    root.BratEditorWindow = Object.freeze({ commands: Object.keys(commands), closeCompactMenu, setSheet, menu: bar });
})(typeof globalThis !== "undefined" ? globalThis : window);
