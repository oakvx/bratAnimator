# Fase 16 — Audio Mixer multitraccia

Questa fase implementa l'audio associato alle clip video, la riproduzione delle tracce audio nella preview e l'esportazione con più sorgenti. I commit rimangono nella [PR unica #20](https://github.com/oakvx/bratAnimator/pull/20) che raccoglie le fasi 13–17.

## Flusso audio

1. `assets/js/audio-mixer.js` accede **solo ai blob locali** già salvati nell'IndexedDB dell'editor tramite `assetId`. Il media viene decodificato con `AudioContext.decodeAudioData()` e riutilizzato per ogni occorrenza della sorgente nella timeline.
2. Le clip di tipo `audio` e `video` partecipano al mix se non sono mute e se la traccia non è muta. `track.volume × clip.volume` definisce il gain, mentre `fadeIn` e `fadeOut` calcolano l'inviluppo nel tempo assoluto del progetto.
3. `clip.start`, `duration`, `sourceIn` e `playbackRate` vengono risolti per la preview e per gli export, mantenendo i tagli anche se il video inizia prima della finestra esportata.
4. La preview crea nodi `AudioBufferSourceNode` programmati nel contesto Web Audio condiviso con il clock del player. Play, pausa, seek e modifiche alle clip riprogrammano le sorgenti. Il video visivo resta intenzionalmente `muted` per evitare che il suono si senta due volte.
5. L'export passa **la stessa lista di clip audio** al motore della fase 13, che le miscela tramite `OfflineAudioContext` e codifica AAC+MP4 dove disponibile oppure MediaRecorder con la traccia audio Web Audio nel fallback in tempo reale.
6. Il file già importato tramite Timing viene aggiunto come musica legacy soltanto quando non è referenziato anche da una clip audio/video della timeline. Non viene duplicato.

## Interfaccia

- La scheda Tracks accetta file audio locali MP3/WAV/M4A/OGG/FLAC quando compatibili con il browser, oltre a immagini e video.
- I file audio vengono validati decodificando i byte e sono memorizzati in IndexedDB.
- Controlli su traccia/clip: volume percentuale, mute, `fade-in` e `fade-out`; velocità `0.1×–8×` preservando gli offset della sorgente.
- L'audio delle clip video viene decodificato automaticamente **quando il browser supporta il codec contenuto nel file**. Se un video non contiene audio o il decoder non lo supporta, la UI segnala che l'audio non è decodificabile, senza inventare una traccia silenziosa.
- Il checkbox audio storico in Export controlla il solo media caricato nel vecchio pannello Timing; i layer audio della scheda Tracks sono controllati dai rispettivi volume/mute.

## Limiti importanti

- `decodeAudioData()` supporta codec e contenitori differenti a seconda del browser; non tutti i video MP4/HEVC/WebM contengono audio decodificabile. Chrome è coperto dai test end-to-end, Safari e Firefox richiedono QA.
- Il mix offline può consumare molta RAM su timeline lunghe: l'engine usa buffer audio completi in memoria. Il fallback MediaRecorder può rallentare in presenza di seek video costosi e produrre drift su macchine lente; servono stress test in fase 17.
- L'amplificazione su più tracce può produrre clipping: non è ancora presente un limiter/master bus professionale.
- Nessuna telemetria né fetch remoto di audio o video; l'editor rimane locale.

## Test automatici

- `tests/audio-mixer.test.js`: persistenza gain/fade/rate, mute video indipendente dal layer visuale, riuso cache sorgente, scheduling di offset e rate, video senza audio e asset audio assente/non decodificabile.
- `tests/export-engine.test.js`: tempi dei sample ritagliati con `playbackRate != 1`.
- `tests/export-format-browser.mjs`: creazione di un video *con audio reale*, import di un WAV SFX indipendente, preparazione di 2 clip audio, preview multitraccia, verifica audio track nel WebM esportato, mute track.
- Test preflight in `tests/export-preflight.test.js` per sorgenti audio multitraccia.

## Stato PR

- [x] Fase 13 — Export Engine
- [x] Fase 14 — Multitrack Core
- [x] Fase 15 — Video Composer
- [x] Fase 16 — Audio Mixer
- [ ] Fase 17 — Editor professionale, undo/redo multitraccia, drag and drop, performance, accessibilità, QA finale

**PR #20 ancora aperta in draft; nessun merge.**
