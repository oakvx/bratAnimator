# Editor Windows 7 — redesign stabile e uniforme

Data: 2026-11-26 · Stato: approvato da Gabri

## Perché

Brat Animator deve sembrare un piccolo computer Windows 7 (7.css). Oggi lo studio
esterno lo è, ma l'editor no: mescola tre stili (Aero, "brat" grigio/monospace,
dialoghi bianchi arrotondati), ha comandi doppi e confusi ed è scomodo su
telefono. L'obiettivo è un editor **usabile da PC e da telefono**, **stabile** e
**uniforme**: un'unica finestra Windows 7 fatta bene.

## Obiettivi

- L'editor è **una finestra 7.css** con barra del titolo, barra dei menu,
  toolbar, area di lavoro e barra di stato.
- **Un solo linguaggio visivo**: componenti 7.css (window, menubar, tabs,
  fieldset, button, slider, select, status-bar). Niente bordi arrotondati
  bianchi, niente chip monospace, niente pill.
- **Meno comandi visibili**: ogni azione ha un posto solo.
- **Desktop e mobile** con lo stesso markup e due layout CSS.
- **Lingua coerente**: l'editor usa la stessa lingua dello studio (default
  italiano); il cambio lingua sta nel menu.
- **Bug sistemati** strada facendo (lista in fondo, si allunga durante il lavoro).
- **Stabilità**: tutti i test esistenti continuano a passare; i test di layout
  vengono aggiornati alla nuova struttura, non indeboliti.

## Non obiettivi

- Nessuna nuova funzione di editing (rendering, export, timeline restano come sono).
- Nessun cambio a Supabase / TikTok / BRATCODE lato server.
- Nessun framework o build step: resta HTML + CSS + JS classico.

## Anti-obiettivi (fallimento anche se "funziona")

- Un altro strato di JS che sposta nodi del DOM dopo il caricamento
  (`editor-layout.js` è esattamente il problema di oggi).
- CSS che vince a colpi di `!important` sopra file vecchi.
- Su telefono: scroll orizzontale, bottoni tagliati, pannelli che coprono
  l'anteprima senza poterli chiudere.

## Approcci considerati

1. **Finestra unica Windows 7 (scelto).** Riscrivere il markup dell'editor come
   una finestra 7.css vera, con menu, toolbar, tab raggruppati e layout mobile
   dedicato. Lavoro più grande, ma l'unico che toglie la confusione alla radice.
2. **Solo ridipingere.** Stessa struttura, skin 7.css. Veloce ma lascia doppioni
   e comandi sparsi: non risolve il problema.
3. **Desktop multi-finestra.** Anteprima, timeline, testi come finestre
   trascinabili. Scartato: inusabile su telefono.

Gabri ha scelto l'approccio 1.

## Design

### Struttura della finestra (desktop ≥ 900px)

```
┌ Brat Animator — Editor ─────────────────────────── _ □ X ┐
│ File  Modifica  Visualizza  Lingua  ?                     │  menubar 7.css
│ [Studio][Riproduci][Annulla][Ripeti][Dividi][Esporta…] ✓  │  toolbar
├───────────────────────┬───────────────────────────────────┤
│ [Testo][Timeline]     │  Anteprima 1080×1080   − 100% + ⤢ │
│ [Stile][Esporta]      │  ┌─────────────────────────────┐  │
│ ┌ Cerca testo ──────┐ │  │                             │  │
│ │ …                 │ │  │           canvas            │  │
│ └───────────────────┘ │  └─────────────────────────────┘  │
│ (pannello scorrevole) │  ▶ 0:00 ━━━━━━━━━━━━━━━━━━ 0:00   │
│                       ├───────────────────────────────────┤
│                       │  Timeline multitraccia            │
├───────────────────────┴───────────────────────────────────┤
│ Durata 0.00s │ 1080×1080 │ 30 fps │ 0 righe │ archivio ok │  status-bar 7.css
└───────────────────────────────────────────────────────────┘
```

- **Barra dei menu** (riusa il pattern di `win7-window-menu.js`, generalizzato):
  - *File*: Nuovo progetto, Apri progetti, Carica demo, Salva snapshot,
    Importa/Esporta pacchetto, Chiudi editor.
  - *Modifica*: Annulla, Ripeti, Dividi clip, Comandi… (Ctrl+K).
  - *Visualizza*: Mostra/nascondi pannello, Adatta anteprima, Schermo intero,
    Sfondo verde / scuro.
  - *Lingua*: Italiano, English, Русский, 中文 (voci radio).
  - *?*: Guida introduttiva (F1), Richiedi permesso di pubblicazione,
    Informazioni.
- **Toolbar**: solo le azioni frequenti — torna allo Studio, riproduci,
  annulla/ripeti, dividi, **Esporta…** (bottone default 7.css), indicatore di
  salvataggio a destra. Bottoni 7.css con **testo**, nessuna icona.
- **Pannello sinistro**: tab 7.css (`menu role=tablist`) con **4 tab** al posto
  di 7:
  - *Testo* = cerca testo + modifica testo/timing (ex find + lyrics)
  - *Timeline* = tracce e media (ex timeline)
  - *Stile* = stile + canvas + preset (ex style + canvas)
  - *Esporta* = export + progetto/archivio (ex export + project)
  Ogni gruppo interno è un `fieldset` 7.css con `legend`; i gruppi opzionali
  sono `details`.
- **Status bar** 7.css in fondo: sostituisce la griglia DURATION/FORMAT/FPS/LINES.
- I bottoni "controls", "settings", "load demo", "commands", "help", green/dark,
  IT/EN/RU/ZH e "request permission" spariscono dalla barra superiore: sono tutti
  nei menu. "text settings" nella barra anteprima apre il tab Stile.

### Layout mobile (< 900px)

- La finestra è sempre massimizzata (niente bordi, title bar compatta).
- La barra dei menu diventa un unico bottone **Menu** che apre gli stessi
  sottomenu impilati (nessun hover, solo tap).
- La toolbar resta su una riga con solo icone; scorre se non ci sta (mai a capo,
  mai tagliata).
- Ordine verticale: anteprima → trasporto → **tab in basso** fissi
  (Testo / Timeline / Stile / Esporta) che aprono un pannello a mezza altezza
  sopra di loro, chiudibile toccando di nuovo il tab o con ✕.
- La taskbar Windows 7 resta visibile sotto; l'editor non ci finisce sotto.
- Target touch ≥ 40px, nessun overflow orizzontale da 320px in su.

### Dialoghi

Command palette, avviso permessi, guida introduttiva, conferme: tutti diventano
`window` 7.css (title bar con X funzionante, `window-body`, bottoni allineati a
destra). Niente più card bianche arrotondate.

### Implementazione — regole per chi costruisce

- Il markup nuovo va scritto **direttamente in `index.html`** (e nelle copie
  localizzate `it/ en/ ru/ zh/` se contengono l'editor). Nessuno spostamento di
  nodi a runtime: `editor-layout.js` viene rimosso o ridotto a zero.
- **Gli `id` esistenti restano** (`app.js`, test e command palette ci si
  agganciano). Gli elementi che spariscono dalla barra superiore restano come
  voci di menu con lo stesso `id` dove i listener lo richiedono, oppure il menu
  chiama la stessa funzione.
- I valori storici di `data-open-tab` (`lyrics`, `timing`, `tracks`, `design`,
  `canvas`, `export`, `project`) restano validi: aprire uno di questi apre il
  nuovo tab che lo contiene e scorre al gruppo giusto.
- **Solo 7.css**: ogni controllo usa i componenti della libreria così come
  sono (button, menubar, tabs, fieldset, details, slider, select, status-bar,
  window, title-bar-controls). **Vietate le icone SVG disegnate a mano** e le
  ricostruzioni di componenti che 7.css già offre. Le uniche immagini ammesse
  sono quelle già presenti nel progetto (`favicon.svg`, artwork Windows 7
  caricato dall'utente via `win7-assets.js`). Dove servirebbe un'icona si usa
  testo.
- **Un solo file CSS per l'editor**: `assets/css/win7-editor.css`, caricato
  dopo `7.scoped.css`. Le regole editor in `style.css`, `editor-v5.css`,
  `editor-layout.css`, `studio-aero-polish.css`, `win7-desktop-polish.css` che
  confliggono vengono eliminate, non sovrascritte. Obiettivo: zero
  `!important` nuovi.
- Lingua: una sola fonte (`i18n.js`); lo studio e l'editor leggono e scrivono la
  stessa preferenza. `italian-ui.js` viene assorbito in `i18n.js` se duplica.
- Commit piccoli e separati, autore Gabriele Lucia, nessun co-author.

### Bug noti da sistemare

1. La X della guida introduttiva è vuota (nessuna icona).
2. L'editor parte in inglese mentre lo studio è in italiano.
3. Su mobile la barra superiore dell'editor è tagliata e "Studio" copre il logo.
4. "settings" salta a metà del tab style con il titolo tagliato.
5. Messaggio Supabase con doppio punto ("riprova..").
6. Altri bug trovati durante il giro funzionale (lyrics, timeline, export,
   progetti, Sound Hub) vengono aggiunti qui e sistemati.

### Verifica

- `node --test` e tutti i `tests/*-browser.mjs` passano.
- `tests/editor-layout-playwright.mjs` aggiornato alla nuova struttura, con
  controlli a 1440×900, 768×1024, 390×844 e 320×640: nessun overflow
  orizzontale, menu apribili, tab funzionanti, anteprima visibile.
- Screenshot desktop e mobile di Home, editor (ogni tab), menu aperti e dialoghi
  revisionati a occhio prima di chiudere.

## Lasciato a chi costruisce

Spaziature precise, ordine delle voci dentro ogni gruppo, come dividere i commit.
