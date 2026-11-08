# Fase 7 — Export preflight e isolamento delle scorciatoie

## Obiettivi

La finestra di esportazione deve segnalare i problemi più frequenti **prima** che l'utente tenti il render, mantenendo intatto l'export video esistente. Le scorciatoie dell'editor non devono attivarsi dietro la dashboard Windows 7 né dietro le finestre di autenticazione.

## Controllo preventivo

Il modulo `assets/js/export-preflight.js` offre una funzione pura `assess(settings, parse)` e un piccolo adattatore DOM. Il controllo verifica:

- presenza di almeno una riga LRC valida con lo **stesso parser BratCore.parseLRC** del motore;
- disponibilità iniziale di MediaRecorder oppure di una pipeline WebCodecs per l'export video;
- audio caricato e selezionato, con segnalazione esplicita del caso in cui il file venga esportato senza audio;
- necessità di MediaRecorder per l'esportazione con audio;
- configurazioni potenzialmente pesanti: risoluzione base da 1440 o 60 fps.

Stato `blocked` indica un errore rilevato, `warning` uno o più avvisi e `ready` un controllo preventivo riuscito. Le verifiche **non disabilitano** l'esportazione e non mutano lo stato del progetto: il motore conserva le proprie verifiche finali su codec, URL CORS, formato, intervallo e permessi media.

Il pannello viene aggiornato in seguito a modifiche di testo e impostazioni e al completamento dell'analisi del file audio. Il pulsante «Fix lyric timing» apre la scheda Timing e porta il focus al campo lyrics.

La funzione di controllo non effettua fetch, non salva risultati, non legge i blob multimediali e non introduce analytics.

## Scorciatoie

- I tasti di comando sono ignorati mentre si usa la dashboard Windows 7, incluso il menu Start.
- Le finestre modali impediscono alle scorciatoie nascoste di avviare l'editor o l'esportazione.
- La palette dei comandi è utilizzabile con `Ctrl+K` o `⌘K` anche quando è attivo un campo testo.
- Quando la palette è aperta, i comandi di sottofondo restano inattivi, ed Esc la chiude.
- La digitazione e i campi `contenteditable` non ricevono shortcut distruttive; il tasto Spazio mantiene la sua funzione intenzionale di tap-sync, se attivo.

## Verifiche

- `node --test`: copre analisi LRC valida/non valida, assenza pipeline video, combinazioni audio, risorse e assenza di scritture.
- `node --check assets/js/export-preflight.js`
- `CHROME_PATH=/usr/bin/google-chrome node tests/studio-dashboard-browser.mjs`: verifica che E nella dashboard non avvii export, che Ctrl+K funzioni dentro un input, che le righe LRC valide aggiornino lo stato e che 60 fps generi un avviso.
- Verifica manuale consigliata su Safari iOS, browser senza WebCodecs e dispositivi a bassa memoria.

## Invarianti

Nessuna modifica alle funzioni `exportVideo`, ai progetti IndexedDB, al Sound Hub, all'integrazione TikTok o ai provider di login. Restano validi i limiti dei browser e la responsabilità dell'utente sulle licenze dei media caricati.
