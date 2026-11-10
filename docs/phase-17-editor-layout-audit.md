# Fase 17 — Audit e riorganizzazione dell'interfaccia (prima iterazione)

Questa iterazione riguarda esclusivamente la **qualità dell'interfaccia esistente**, come richiesto: niente nuove funzionalità video. I commit sono aggiunti alla [PR unica #20](https://github.com/oakvx/bratAnimator/pull/20), lasciata aperta in draft.

## Problemi individuati nel codice e nelle schermate Playwright

- La navigazione editor era ordinata per sviluppo tecnico (Lyrics / Timing / Design / Canvas / Export / Project / Tracks) invece che per workflow. La sezione Tracks, ormai fondamentale, era all'ultima posizione.
- Le operazioni sui progetti erano distribuite fra Timing, Export e Project; la guida per le safe areas era mescolata alle impostazioni di stile.
- Un titolo secondario `clips` rimaneva fuori dalla struttura e il messaggio finale dell'export precedeva i controlli.
- I pannelli audio e visuali restavano visibili insieme indipendentemente dal tipo di clip, consumando inutilmente spazio.
- Il nome del prodotto era rimasto ancorato al vecchio editor lyric-only; a larghezze mobili ridotte veniva troncato.
- Il vecchio formato completamente piatto di alcune schede generava lunghe successioni non gerarchiche di pulsanti, campi e spiegazioni.

## Interventi

- Nuova sequenza della navigazione: **Find → Lyrics → Timeline → Style → Canvas → Export → Project**. Vengono preservati tutti gli ID e gli attributi `data-open-tab` utilizzati dalla logica di progetto e dalle scorciatoie.
- `assets/js/editor-layout.js` raggruppa i controlli esistenti spostando veri nodi DOM già inizializzati, senza clonare elementi né scollegare listener. Script eseguito dopo l'editor V5 e il multitraccia.
- **Lyrics:** importazione/sorgenti, editor delle frasi, riferimento audio e sincronizzazione visibilmente separati.
- **Style:** template, tipografia, colore, animazione, media di sfondo e libreria preset. Gruppi meno comuni richiudibili, senza rimuovere funzioni.
- **Timeline:** import e gestione tracce, editor clip, proprietà audio e visuali contestuali. Il controllo audio appare solo sulle clip video/audio; l'editor visuale sulle clip video/immagine/testo.
- **Canvas:** guide e safe zone trasferite in questa scheda preservando il checkbox originale.
- **Export:** impostazioni prima, poi pulsanti render/download; diagnostica preliminare richiudibile, stato leggibile direttamente nel sommario.
- **Project:** snapshot, file JSON, bundle portabili, pulizia progetti e riferimento video esterno sono raggruppati correttamente; i comandi JSON non ingombrano più Export.
- `assets/css/editor-layout.css` uniforma tipografia, spazi, card, form, layout responsive e stati focus senza sostituire i controlli nativi della libreria **7.css**.
- L'intestazione usa «brat studio» nelle quattro lingue. La barra mobile riutilizza il favicon originale anziché tagliare una scritta a metà.
- Service worker aggiornato per l'uso offline dei nuovi asset CSS/JS.

## Verifiche Playwright

- Nuova suite `tests/editor-layout-playwright.mjs` con `playwright-core`, eseguita in GitHub Actions con Chromium.
- Screenshot dell'interfaccia reale di tutte e sette le sezioni sia a **1440×900** che a **390×844**, oltre alle viste contestuali delle proprietà audio/video e al pannello Style avanzato.
- Controllo automatico overflow orizzontale del documento e dei singoli campi, tab effettivamente attiva, ordine di navigazione, mancata duplicazione di ID, collocazione dei comandi, visualizzazione condizionale degli inspector.
- Screenshot archiviati come artifact **`playwright-editor-layout`** in ogni CI; scaricabili dalla scheda GitHub Actions.
- Restano attivi i test browser legacy di export, lyrics, editor V5, timing, dashboard, motion, media e gli unit test.

## Fase 17B — Timeline professionale completata

- `assets/js/timeline-core.js` calcola coordinate in secondi, tick della scala temporale, attrazione magnetica (snapping) verso estremi clip/testina e operazioni deterministiche di spostamento e trim. Gestisce lock e compatibilità delle tracce, oltre ai limiti di durata e velocità.
- `assets/js/timeline-editor.js` disegna una **timeline orizzontale sotto l'anteprima**: più tracce, layer selezionabili, drag/drop, maniglie per trim, seek su ruler, zoom e fit-to-project, snapping disattivabile, split alla testina, tasti freccia per spostamento e cancellazione. L'importazione da File drag-and-drop usa lo storage locale già presente.
- L'applicazione conserva **un solo stato per gesto** nella cronologia undo/redo del progetto; la selezione non genera una revisione. Le modifiche ritornano ai componenti di preview ed export già esistenti.
- `assets/css/timeline-editor.css` fornisce un workspace con preview e timeline distinte, layout responsive e controlli accessibili.
- Le clip fuori dall'intervallo visualizzato sono escluse dal rendering DOM; l'audit Playwright prova un progetto con **180 clip**, verificando la presenza di un numero limitato di nodi e l'assenza di overflow orizzontale.
- I test reali Playwright su **desktop 1440×900 e mobile 390×844** trascinano un clip, verificano le coordinate finali, eseguono undo/redo, zoom-in e fit, e catturano screenshot. La suite include anche il rendering delle landing page SEO inglese e italiana.
- `tests/timeline-core.test.js` verifica snapping, limiti, cross-track moves, trims, timecode e lock.

## SEO e comunicazione del prodotto

- Posizionamento principale **Brat Video Editor**; copertura complementare per **Free Brat Video Editor Online**, **Free Online Video Editor** e **Editor Video Brat Gratis Online**.
- Aggiornate le pagine index/en/ru/zh, aggiunta `it/index.html`, i dati strutturati, la sitemap reciproca `hreflang` e i metadati della PWA. Le dichiarazioni sulla gratuità d'uso rispettano i termini: permesso richiesto per la pubblicazione/redistribuzione.
- I test `tests/seo-metadata.test.js` verificano canonical, locale, JSON-LD, descrizioni italiane/inglesi e formato di export.

## Consegna e limiti di compatibilità

La **fase 17 è implementata** con CI automatica Chromium. Restano consigliati test manuali su Safari/iOS e Firefox, codec particolari e progetti video molto grandi prima di un merge pubblico. Il repository mantiene la **PR #20 aperta in draft**, senza merge automatico.
