# Editor Windows 7 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trasformare l'editor in un'unica finestra 7.css (menu, toolbar, 4 tab, status bar) usabile da desktop e da telefono, e sistemare i bug trovati.

**Architecture:** la struttura della finestra è scritta in `index.html` dentro un contenitore `.win7` così che `7.scoped.css` stili tutto. Tutti gli `id` usati da `app.js` restano: i bottoni sparsi diventano voci di menu con lo stesso `id`. Un modulo puro `editor-tabs.js` mappa le 7 sezioni storiche nei 4 tab; `win7-window-menu.js` espone una menubar riusabile per studio ed editor; un solo CSS `win7-editor.css` sostituisce le regole editor sparse.

**Tech Stack:** HTML + CSS + JS classico (script `defer`), 7.css (`vendor/7css/7.scoped.css`), `node --test`, test browser con Chrome headless e `playwright-core@1.58.2`.

**Spec:** `docs/superpowers/specs/2026-11-26-editor-win7-redesign-design.md`

## Global Constraints

- Solo componenti 7.css; **vietate icone SVG disegnate a mano**; dove servirebbe un'icona si usa testo. Immagini ammesse: `favicon.svg`, artwork caricato via `win7-assets.js`.
- Nessun framework, nessun build step, nessuna nuova dipendenza runtime.
- Gli `id` esistenti restano; i valori storici di `data-open-tab` (`lyrics`, `timing`, `tracks`, `design`, `canvas`, `export`, `project`) restano accettati da `openTab`.
- Zero `!important` nuovi. Regole in conflitto si cancellano, non si sovrascrivono.
- Breakpoint mobile: `max-width: 899px`. Nessun overflow orizzontale da 320px. Target touch ≥ 40px su mobile.
- Lingua di default `it` (se né URL né preferenza salvata).
- Commit piccoli, autore Gabriele Lucia, **nessun co-author**, messaggi in italiano minuscolo.
- Commenti nel codice in italiano minuscolo.

## Review Focus

1. Comando lanciato da un menu mentre il pannello è chiuso (mobile o "nascondi pannello"): ci si aspetta che il pannello si apra sul tab giusto, non che il comando sembri non fare nulla. → test in Task 3.
2. Rotazione / resize da desktop a mobile con un menu o il pannello mobile aperto: niente menu orfani sopra l'anteprima, il pannello resta coerente. → test in Task 5.
3. Tasto Esc con command palette o guida aperta sopra un menu aperto: chiude solo lo strato in cima. → test in Task 6.
4. Cambio lingua dal menu mentre si edita il testo: il testo dell'utente e il tab attivo non cambiano. → test in Task 7.
5. Progetto salvato con tab storico (`timing`, `canvas`…) riaperto: si apre il tab nuovo che lo contiene. → test in Task 1.

---

### Task 1: Mappa dei 4 tab

**Files:**
- Create: `assets/js/editor-tabs.js`
- Modify: `assets/js/app.js` (`openEditorTab` ~5929, `showTab` ~4117, click diretti a `[data-open-tab="timing"]` ~4615, ~5083, ~6530)
- Modify: `index.html` (tab strip ~820-828, `<script>` prima di `app.js`)
- Modify: `assets/js/editor-layout.js` (rimuovere rinomina/riordino tab e `leadTitles`)
- Modify: `.github/workflows/verify.yml` (aggiungere `node --check assets/js/editor-tabs.js`)
- Test: `tests/editor-tabs.test.js`

**Interfaces:**
- Produces: `BratEditorTabs.GROUPS` = `{ text: ["lyrics","timing"], timeline: ["tracks"], style: ["design","canvas"], export: ["export","project"] }` (frozen, ordine = ordine dei tab); `BratEditorTabs.groupOf(name: string) -> "text"|"timeline"|"style"|"export"` (accetta gruppo o sezione storica, sconosciuto → `"text"`); `BratEditorTabs.sectionsOf(group) -> string[]`. UMD come gli altri moduli (`module.exports` + `globalThis.BratEditorTabs`).
- Produces: `window.BratEditorNav.openTab(name: string)` in `app.js`: attiva il tab `groupOf(name)`, mostra tutte le sezioni del gruppo, se `name` è una sezione la porta in vista; se il pannello è nascosto lo apre.
- Tab buttons: `<button data-open-tab="text|timeline|style|export" role="tab">` con etichette i18n `tabText`, `tabTimeline`, `tabStyle`, `tabExport` (IT: Testo, Timeline, Stile, Esporta; EN: Text, Timeline, Style, Export; RU/ZH tradotte).

- [ ] **Step 1: test che fallisce** — `tests/editor-tabs.test.js`: `groupOf("timing") === "text"`, `groupOf("canvas") === "style"`, `groupOf("project") === "export"`, `groupOf("tracks") === "timeline"`, `groupOf("style") === "style"`, `groupOf("boh") === "text"`; ogni sezione storica compare in esattamente un gruppo; `Object.keys(GROUPS)` è `["text","timeline","style","export"]`.
- [ ] **Step 2:** `node --test tests/editor-tabs.test.js` → FAIL (modulo mancante).
- [ ] **Step 3:** creare `editor-tabs.js`; in `app.js` riscrivere `openEditorTab` su `groupOf/sectionsOf`, esporre `window.BratEditorNav.openTab`, sostituire i tre click diretti e `showTab` con `openTab`; HTML con 4 tab; togliere da `editor-layout.js` il blocco `navigation` e `leadTitles`.
- [ ] **Step 4:** `node --test` → PASS tutto.
- [ ] **Step 5:** browser: aggiungere a `tests/editor-v5-browser.mjs` un controllo che `BratEditor.openTab("canvas")` rende visibile `#section-canvas` e seleziona il tab `style`. `CHROME_PATH=/usr/bin/google-chrome node tests/editor-v5-browser.mjs` → PASS.
- [ ] **Step 6:** commit `feat: editor con 4 tab (testo, timeline, stile, esporta)`.

### Task 2: Menubar riusabile

**Files:**
- Modify: `assets/js/win7-window-menu.js`
- Test: `tests/win7-start-menu.test.js` o nuovo `tests/win7-menubar.test.js` (stile dei test esistenti con DOM finto)

**Interfaces:**
- Produces: `BratWin7WindowMenu.createMenuBar(menuEl: HTMLElement, { run(command: string): void, win }) -> { open(heading), close(), toggle(heading), isOpen() }`. Comportamento attuale (click, frecce, Esc, click fuori, chiusura su `brat:studio-view`) spostato qui. Comando letto da `data-win7-command` sui `button` interni; i bottoni **senza** `data-win7-command` (es. `#loadDemoBtn`) non vengono intercettati: il menu si chiude e il click prosegue verso i listener di `app.js`.
- `createMenu(document, win)` resta e usa `createMenuBar` per `#studioWin7MenuBar`.

- [ ] **Step 1:** test: aprire heading, click su bottone senza comando → menu chiuso e evento non `preventDefault`; Esc chiude; ArrowRight passa all'heading successivo.
- [ ] **Step 2:** `node --test tests/win7-menubar.test.js` → FAIL.
- [ ] **Step 3:** estrarre `createMenuBar`.
- [ ] **Step 4:** `node --test` → PASS; `node tests/studio-dashboard-browser.mjs` → PASS.
- [ ] **Step 5:** commit `refactor: menubar windows 7 riusabile`.

### Task 3: Finestra editor (markup)

**Files:**
- Modify: `index.html` (sostituire `#studioEditorChrome` + `header.topbar` + `.project-status-bar` e avvolgere `#panel` e `main.page-shell`)
- Modify: `assets/js/app.js` (status bar, toggle pannello), `assets/js/studio-shell.js`, `assets/js/win7-shell.js` (riferimenti a minimize/maximize/close editor)
- Modify: `assets/js/i18n.js` (chiavi menu)
- Create: `assets/js/editor-window.js` (collega menubar editor e toolbar)
- Test: `tests/aero-ui.test.js` (asserzioni statiche sull'HTML)

**Interfaces:**
- Consumes: `createMenuBar` (Task 2), `BratEditorNav.openTab` (Task 1).
- Struttura:
  `#studioEditorChrome.studio-editor-window.win7 > .window.glass.active > [.title-bar (stessi id min/max/close), ul#editorMenuBar[role=menubar], div.editor-toolbar[role=toolbar], div.window-body.editor-body > (#panel, main.page-shell), div.status-bar]`.
- Menu (bottoni con `id` esistenti dove indicato, altrimenti `data-win7-command`):
  - File: Nuovo progetto (`new`), Apri progetti (`projects`), Carica demo (`#loadDemoBtn`), Salva snapshot (`snapshot` → apre tab export e focus `#snapshotNameInput`), Esporta progetto completo (`bundle-export` → click `#exportBundleBtn` se esiste, altrimenti tab export), Chiudi editor (`close-editor` → click `#studioEditorClose`).
  - Modifica: Annulla (`undo`), Ripeti (`redo`), Dividi clip (`split` → click `#studioTlSplit`), Comandi… Ctrl+K (`#commandPaletteBtn`).
  - Visualizza: Pannello (`#togglePanelBtn`, checkbox-like `aria-checked`), Impostazioni testo (`#textSettingsBtn`), Adatta anteprima (`fit` → `#stageFitBtn`), Schermo intero (`fullscreen` → click `#stageFullscreenBtn`), Sfondo verde (`#bgBtn`), Sfondo scuro (`#darkBtn`).
  - Lingua: 4 `button.lang-btn[data-lang]` con `role=menuitemradio` e `aria-checked`.
  - ?: Guida introduttiva F1 (`#tutorialBtn`), Richiedi permesso (`a#permissionLink`), Informazioni (`about`).
- Toolbar: `Studio` (`BratStudio.show("home")`), `Riproduci` (proxy di `#stagePlayBtn`, testo e `aria-pressed` sincronizzati), `Annulla`, `Ripeti`, `Dividi`, `Esporta…` (`.default`, apre tab export e focus `#exportVideoBtn`), a destra `#autosaveBadge` spostato qui.
- Status bar: cinque `p.status-bar-field`: `#statusDuration`, `#statusFormat`, `#statusFps`, `#statusLines` (stessi id) e lo stato archivio locale.
- Guida: `#tutorialWindowClose` riceve `aria-label="Close"` (bug 1).
- Review Focus 1: comando di menu con pannello chiuso → apre pannello.

- [ ] **Step 1:** test statici in `tests/aero-ui.test.js`: `#editorMenuBar[role=menubar]` contiene `#loadDemoBtn`, `#commandPaletteBtn`, `#tutorialBtn`, `#bgBtn`, `#darkBtn`, 4 `.lang-btn`, `#togglePanelBtn`, `#textSettingsBtn`; non esiste più `header.topbar`; `.status-bar` contiene i 4 `#status*`; `#tutorialWindowClose` ha `aria-label="Close"`; nessun `<svg` dentro `#editorMenuBar` e `.editor-toolbar`.
- [ ] **Step 2:** `node --test tests/aero-ui.test.js` → FAIL.
- [ ] **Step 3:** riscrivere il markup, creare `editor-window.js`, aggiornare i riferimenti JS.
- [ ] **Step 4:** test browser in `tests/editor-v5-browser.mjs`: con pannello nascosto, menu Visualizza → Impostazioni testo apre il pannello sul tab `style` e `#textSettings` è visibile; menu Lingua → IT cambia `lang` del documento.
- [ ] **Step 5:** `node --test` + tutti i `tests/*-browser.mjs` → PASS (adeguare i test che cliccano bottoni ora dentro menu: aprire prima il menu o chiamare `.click()` da `evaluate`).
- [ ] **Step 6:** commit `feat: editor come finestra windows 7 con menu, toolbar e barra di stato`.

### Task 4: CSS unico desktop

**Files:**
- Create: `assets/css/win7-editor.css` (link subito dopo `7.scoped.css`)
- Delete: `assets/css/editor-layout.css`; rimuovere il suo `<link>`
- Modify: `assets/css/style.css`, `assets/css/editor-v5.css`, `assets/css/studio-win7.css`, `assets/css/studio-aero-polish.css`, `assets/css/win7-desktop-polish.css`, `assets/css/timeline-editor.css`: cancellare regole su `.topbar`, `.chip`, `.menu-*`, `.panel*`, `.editor-tab*`, `.project-status-bar`, `.v5-block` visuale, bottoni/inputs editor; tenere solo regole funzionali (canvas, stage sizing, timeline lanes/clip, `.hidden`).
- Modify: `sw.js` (lista cache: togliere `editor-layout.css`, aggiungere `win7-editor.css`, `editor-tabs.js`, `editor-window.js`) e `tests/deployment-integrity.test.js` se elenca file.

**Interfaces:** layout desktop (≥ 900px): finestra a tutta area sopra la taskbar; griglia `editor-body` = pannello 360px | colonna destra (anteprima sopra, timeline sotto, timeline min 220px); pannello scorre da solo con `.has-scrollbar`; gruppi in `fieldset` 7.css; `details` per opzionali.

- [ ] **Step 1:** test statico: `grep -c '!important' assets/css/win7-editor.css` = 0 (in `tests/aero-ui.test.js`); `index.html` non linka `editor-layout.css`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** scrivere CSS, cancellare regole in conflitto.
- [ ] **Step 4:** screenshot 1440×900 e 1024×768 di ogni tab + menu aperti; revisione a occhio: niente pill bianche, niente chip monospace, niente testo tagliato.
- [ ] **Step 5:** `node --test` + browser + `node tests/editor-layout-playwright.mjs` (aggiornato a 4 tab) → PASS.
- [ ] **Step 6:** commit `style: css unico windows 7 per l'editor`.

### Task 5: Layout mobile

**Files:**
- Modify: `assets/css/win7-editor.css` (`@media (max-width: 899px)`)
- Modify: `assets/js/editor-window.js` (bottone Menu, pannello a scomparsa)
- Modify: `assets/js/studio-shell.js` (eliminare se tutto il suo comportamento è assorbito; altrimenti ridurlo)
- Test: `tests/editor-layout-playwright.mjs`

**Interfaces:**
- `#editorMenuToggle` (bottone "Menu", visibile solo < 900px) apre/chiude la menubar impilata (`body.editor-menu-open`).
- Tab strip fissata in basso sopra la taskbar; toccare un tab apre `#panel` a mezza altezza (`body.editor-sheet-open`), ritoccare lo stesso tab o `#editorSheetClose` (bottone testo "Chiudi") lo chiude.
- Resize ≥ 900px chiude menu impilato e rimuove `editor-sheet-open` (Review Focus 2).

- [ ] **Step 1:** test playwright a 390×844 e 320×640: `scrollWidth === innerWidth`; `#editorMenuToggle` visibile, menubar orizzontale nascosta; tap tab Stile → `#panel` visibile e non copre `#previewCanvas` per più del 55% dell'altezza viewport; tap di nuovo → chiuso; tutti i bottoni visibili della toolbar ≥ 40px alti; resize a 1440 con sheet aperto → layout desktop, nessun `editor-sheet-open`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementare.
- [ ] **Step 4:** test PASS + screenshot 390/320 revisionati.
- [ ] **Step 5:** commit `feat: editor usabile da telefono`.

### Task 6: Dialoghi 7.css

**Files:**
- Modify: `index.html` (`#commandPalette`, `#permissionNotice`, `#tutorialOverlay`, eventuali altri dialoghi editor)
- Modify: `assets/css/style.css` (togliere stili card bianche), `assets/css/win7-editor.css`
- Modify: `assets/js/app.js` (Esc a strati)

**Interfaces:** ogni dialogo = `.win7 > .window.active > .title-bar (titolo + X aria-label="Close") + .window-body`; bottoni azione allineati a destra, primario con classe `default`.

- [ ] **Step 1:** test browser: aprire menu Modifica, poi Ctrl+K, premere Esc → palette chiusa ma nient'altro cambiato; secondo Esc non lascia overlay; X della palette chiude.
- [ ] **Step 2:** FAIL o verificare comportamento attuale.
- [ ] **Step 3:** implementare.
- [ ] **Step 4:** test + screenshot desktop/mobile dei 3 dialoghi.
- [ ] **Step 5:** commit `style: dialoghi dell'editor come finestre windows 7`.

### Task 7: Lingua unica

**Files:**
- Modify: `assets/js/i18n.js` (fallback `it`), `assets/js/italian-ui.js` (solo se duplica chiavi già in i18n), `assets/js/studio-dashboard.js` se ha testo fisso
- Test: `tests/i18n.test.js`, `tests/text-settings-browser.mjs`

- [ ] **Step 1:** test: senza preferenza e senza `?lang`, con `navigator.language = "en-US"`, `getSavedLanguage()` è `"it"`; cambio lingua da menu preserva testo lyrics e tab attivo (Review Focus 4).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementare.
- [ ] **Step 4:** `node --test` + `node tests/text-settings-browser.mjs` → PASS.
- [ ] **Step 5:** commit `fix: l'editor parte nella stessa lingua dello studio`.

### Task 8: Giro funzionale e bug

**Files:** dipendono dai bug trovati. Note certe: messaggio Supabase con `..` (cercare in `auth-client.js`/`studio-dashboard.js` la concatenazione e non aggiungere `.` se il messaggio finisce già con punteggiatura).

Per ogni flusso — cerca testo (con provider mockato come nei test lyrics), incolla LRC e modifica righe, import media in timeline (file locali dei test), sposta/trimma/dividi clip, stile e canvas, export PNG e video, snapshot e pacchetto progetto, Sound Hub, BRATCODE, menu Start — su desktop e mobile:

- [ ] **Step 1:** riprodurre il bug con un test (unitario se la logica è pura, altrimenti nel browser test della suite più vicina).
- [ ] **Step 2:** verificare FAIL.
- [ ] **Step 3:** fix minimo.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** commit `fix: <cosa>` (uno per bug); aggiungere il bug alla lista nello spec.

### Task 9: Verifica finale

- [ ] `node --test` → 0 fail.
- [ ] `for s in studio-dashboard editor-v5 export-format lyrics motion music-editor natural-timing project-assets text-settings; do CHROME_PATH=/usr/bin/google-chrome node tests/$s-browser.mjs; done` → tutti PASS.
- [ ] `node tests/editor-layout-playwright.mjs` → PASS (1440×900, 768×1024, 390×844, 320×640).
- [ ] `node --check` su tutti i file della workflow (aggiornata con i nuovi file).
- [ ] Screenshot: Home, editor ogni tab, ogni menu aperto, 3 dialoghi, desktop e mobile, inviati a Gabri.
- [ ] Revisione dell'intero branch da un reviewer indipendente.
