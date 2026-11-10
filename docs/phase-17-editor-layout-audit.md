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

## Perimetro non ancora concluso

Questa è la **revisione IA/layout della fase 17**, non l'intera fase 17: la nuova timeline drag-and-drop, zoom/snap e le scorciatoie per clip, così come gli stress test di performance su dispositivi mobili e Safari, rimangono ancora da implementare o validare. Nessun merge automatico.
