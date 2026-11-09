# Fase 13 — Export Engine 2.0

> PR unica: fasi 13–17, branch `feature/phases-13-17-multitrack-studio`. Le fasi 14–17 restano da implementare.

## Architettura

- `assets/js/export-plan.js`: piano di frame immutabile, convalida delle dimensioni/FPS e calcolo dei timestamp in microsecondi. Audio clip definiti rispetto alla timeline assoluta.
- `assets/js/export-engine.js`: renderer unico con callback `renderFrame(ctx, width, height, absoluteTime)` e hook opzionale `prepareFrame(time)` per i video.
- Percorso rapido: WebCodecs H.264, più AAC stereo 48 kHz se supportato; mix audio con `OfflineAudioContext` e multiplexing tramite `mp4-muxer` incluso nel repository.
- Fallback: registrazione Canvas tramite `MediaRecorder`, con mix di tracce audio tramite Web Audio e codifica in tempo reale.
- L'app conserva una sola sorgente audio nell'interfaccia attuale; il motore può ricevere più clip con start, offset, durata, guadagno, fade e mute indipendenti.

## Contratto di esportazione

1. Per il frame N, il renderer riceve il tempo assoluto `start + N / fps`, mentre il video codificato usa il tempo relativo `N / fps`.
2. Il clipping audio mantiene il punto corretto nella sorgente e la posizione relativa nell'intervallo esportato.
3. Audio e video passano attraverso lo stesso piano temporale; anteprima ed export condividono il compositore già in uso.
4. Prima del percorso rapido sono verificati codec e muxer. Se necessario, si ripiega su MediaRecorder quando disponibile.
5. Nessun nuovo backend, upload dei media, telemetria, segreto o servizio remoto.

## Verifica

- `node --test tests/export-engine.test.js` controlla piani, timbro dei frame, segmenti audio ritagliati, fade, due clip sovrapposte e rilevazione delle capability.
- `node tests/export-format-browser.mjs` verifica esportazioni effettive, dimensioni e presenza di traccia audio nell'output.
- Suite browser e unit test preesistenti devono rimanere verdi, insieme all'integrità PWA e alla sintassi dei moduli.

## Limiti non risolti in questa fase

- Il muxer MP4 attuale usa un target in memoria: file lunghi/grandi possono consumare molta RAM.
- Il mix OfflineAudioContext dell'intero intervallo richiede memoria. I codec disponibili e il formato generato dipendono dal browser.
- Gli sfondi video usano seek su HTMLVideoElement; la decodifica multi-video professionale arriverà nella fase 15.
- Non sono ancora presenti timeline multitraccia, overlay, montaggio di clip o estrazione automatica dell'audio da più video. Arriveranno nelle fasi 14–17.
- Necessari collaudi manuali in Safari, Firefox e su dispositivi mobili prima del merge.

## Fasi successive nella stessa PR

- **Fase 14:** stato persistente delle tracce/clip, migrazione progetti, selezione e operazioni base.
- **Fase 15:** compositor video multilayer, overlay, immagini e trasformazioni.
- **Fase 16:** audio incorporato nei video, UI mixer, controlli ed export di tutte le tracce.
- **Fase 17:** timeline professionale, shortcut, pannelli, QA di usabilità e performance.

La PR resta draft; nessun merge automatico.
