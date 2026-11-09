# Fase 14 — Multitrack Core

Questa fase aggiunge il **modello dati e le operazioni di editing delle tracce** alla stessa [PR #20](https://github.com/oakvx/bratAnimator/pull/20) delle fasi 13–17. Non crea una nuova PR e non esegue merge.

## Cosa è operativo

- `assets/js/multitrack.js`: modello versione 1 con tracce di tipo `video`, `overlay`, `lyrics`, `audio`. Ogni traccia conserva ordine (z-order futuro), `visible`, `muted`, `locked` e clip ordinate.
- Clip con ID stabile, `kind`, `start`, `duration`, `sourceIn`, `playbackRate`, sorgente media (`assetId`, `name`, `kind`, `url`), `opacity`, `volume` e `muted`.
- Operazioni pure e serializzabili: aggiunta, eliminazione, rinomina e riordino tracce; selezione, inserimento, spostamento, divisione, trim, duplicazione e cancellazione delle clip.
- `activeAt(graph,time)` calcola le clip attive e il tempo relativo alla sorgente, senza toccare DOM o codice di rendering.
- `assets/js/multitrack-ui.js` e nuova tab **Tracks**: editor iniziale con gestione di tracce, clip, tempi e media già importati nell'applicazione.
- Snapshot `multitrack` incluso nei salvataggi IndexedDB, restore, switch guest/account, reset e progetti JSON.
- I bundle `.brat.zip` includono i file associati alle clip tramite `assetId`, deduplicando i riferimenti già presenti nell'audio/background legacy.

## Compatibilità

- La versione generale dei progetti resta **5**, la struttura multitraccia ha `version:1` indipendente. Non sono richieste migrazioni SQL né reset IndexedDB.
- Un progetto precedente senza `multitrack` viene inizializzato con quattro tracce vuote, senza modificare lyrics, background, audio, template o algoritmo di export esistenti.
- Il caricamento di un nuovo progetto o il cambio account rigenera l'interfaccia della scheda Tracks, senza condividere dati fra owner.
- Duplicati di ID nei file importati sono ignorati e i parametri numerici vengono normalizzati. Testo inserito nell'interfaccia viene sempre assegnato con `textContent`.
- Il motore non carica URL media in questa fase; i riferimenti servono esclusivamente per organizzazione e persistenza.

## Limite esplicito

**Le clip inserite nella scheda Tracks sono metadati di montaggio, non vengono ancora disegnate o riprodotte automaticamente nell'anteprima/esportazione.** L'editor classico rimane il rendering attivo. Il video compositor multilayer sarà collegato nella fase 15; il mixing e l'audio incorporato nelle clip video nella fase 16.

Questa scelta evita che le clip legacy vengano elaborate due volte e protegge la compatibilità dei vecchi progetti.

## Test

- `node --test tests/multitrack.test.js`: stabilità ID, split/trim/sourceIn, validazione tipi, lock e z-order, export/import `.brat.zip` con riferimenti condivisi.
- `tests/studio-dashboard-browser.mjs`: operazioni reali nella tab, salvataggio in IndexedDB, recupero snapshot e verifica che le lyrics preesistenti restino immutate.
- CI: suite Node, sintassi, integrità PWA, TypeScript/Deno e nove browser regression.

## Prossime fasi nella stessa PR

- [x] 13 — Export Engine 2.0
- [x] 14 — Multitrack Core + editor metadati
- [ ] 15 — compositore video con più video, immagini, overlay e trasformazioni
- [ ] 16 — mixer audio con audio incorporato nei video e SFX
- [ ] 17 — timeline avanzata, ergonomia, scorciatoie e QA finale

PR draft, nessun merge.
