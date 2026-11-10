# Windows 7 — segnaposto audio / Codex handoff

> **Stato: IN ATTESA DEI WAV.** Questo repository contiene soltanto i percorsi e il lettore: **nessuna registrazione audio Microsoft viene inclusa**.

Brat Animator usa il modulo `assets/js/win7-sound-pack.js` per associare gli eventi del desktop ai file opzionali di questa cartella. Il codice di `assets/js/dashboard-audio.js` è **già collegato** a menu Start, navigazione, pulsanti delle finestre, conferme e avvisi. L'export audio dei video resta indipendente.

## 1. Dove copiare i file

Cartella: **`assets/sounds/windows7/`**

| Nome file richiesto | Evento previsto | Nota |
|---|---|---|
| `startup.wav` | `startup` | Riproducibile dopo l'avvio, se consentito dall'autoplay del browser |
| `logon.wav` | `logon` | Evento di accesso |
| `logoff.wav` | `logoff` | Comando di uscita nel menu Start |
| `navigation-start.wav` | `navigation` | Cambio pagina / apertura applicazione |
| `menu-open.wav` | `menu` | Pulsante Start |
| `menu-command.wav` | `click` | Clic su comando generico |
| `confirm.wav` | `confirm` | Conferma e pulsanti principali |
| `notify.wav` | `notify` | Notifiche informative |
| `exclamation.wav` | `warning` | Avviso |
| `critical-stop.wav` | `error` | Errore critico |
| `recycle.wav` | `recycle` | Eliminazione confermata |
| `minimize.wav` | `minimize` | Riduzione finestra |
| `maximize.wav` | `maximize` | Ingrandimento finestra |
| `restore.wav` | `restore` | Ripristino finestra |
| `close.wav` | `close` | Chiusura finestra |

**Attenzione:** non tutti questi eventi hanno un suono distinto predefinito in Windows 7. Questa tabella è un'interfaccia di mapping per l'applicazione: puoi usare lo stesso WAV per più eventi, lasciarne alcuni vuoti o assegnare un suono equivalente. I nomi sopra sono **segnaposto**, non nomi ufficiali dei file presenti in Windows.

## 2. Attivazione (una sola riga)

Dopo aver copiato i WAV, apri `assets/js/win7-sound-pack.js` e modifica:

```js
const installed = false;
```

in:

```js
const installed = true;
```

Non modificare la pipeline audio di export: i suoni dell'interfaccia devono restare separati da video, musica e clip della timeline.

## 3. Uso locale e distribuzione

- Utilizza esclusivamente file ottenuti e usati con le necessarie autorizzazioni. Il possesso di Windows non implica automaticamente il diritto di **redistribuire** pubblicamente i WAV separatamente.
- Di default i file `*.wav` di questa cartella sono esclusi da Git tramite `.gitignore`: puoi provarli **localmente** senza pubblicarli nel repository.
- Se hai il diritto esplicito di distribuire un pacchetto, puoi chiedere a Codex di gestire l'inclusione e l'hosting dei file rispettando la licenza. Non forzare il commit di materiale proprietario senza tale diritto.
- GitHub Pages non può riprodurre WAV presenti soltanto sul tuo PC: per una distribuzione web, gli asset devono trovarsi su un host accessibile e utilizzabile legalmente.
- I file mancanti/non riproducibili **non interrompono** l'editor: il lettore torna al tono sintetico già incluso.

## 4. TODO per Codex quando i file saranno disponibili

- [ ] Verificare che i 15 segnaposto siano mappati correttamente; i file opzionali possono rimanere assenti.
- [ ] Copiare i WAV consentiti nella cartella `assets/sounds/windows7/` con i nomi nella tabella.
- [ ] Controllare che ogni WAV abbia formato/codec riproducibile dai browser di destinazione (in pratica PCM WAV è la scelta più compatibile).
- [ ] Impostare `installed = true` in `assets/js/win7-sound-pack.js`.
- [ ] Verificare volume, toggle dei suoni, fallback se un file non esiste e assenza di effetti sonori durante l'editing video.
- [ ] Controllare i limiti autoplay: il browser può impedire il suono d'avvio prima di un gesto dell'utente; non forzare bypass.
- [ ] Se **autorizzato alla pubblicazione**, scegliere una strategia di hosting e cache PWA; **non** aggiungere la cartella al precache obbligatorio quando contiene file opzionali non presenti.
- [ ] Eseguire `node --test tests/win7-sound-pack.test.js`, i test del browser e le verifiche Playwright.
- [ ] Verificare manualmente Firefox, Chrome e Safari (suono, pause, navigazione e reload).

### Messaggio pronto da incollare in Codex

> Nel repository `oakvx/bratAnimator`, integra i WAV che ho messo in `assets/sounds/windows7/` usando **esclusivamente** il mapping in `assets/js/win7-sound-pack.js` e il lettore esistente in `assets/js/dashboard-audio.js`. Non riscrivere il mixer audio e non aggiungere servizi esterni. Verifica nomi, codec e permessi di distribuzione dei file; imposta `installed = true` solo quando sono pronti. Mantieni i fallback, i toggle e i limiti autoplay. Aggiorna test/documentazione, esegui la CI e lascia la PR aperta senza merge.

## 5. Checklist tecnica

- `assets/js/win7-sound-pack.js` — manifest statico, `installed = false` finché non installi il pack.
- `assets/js/dashboard-audio.js` — runtime HTMLAudioElement + fallback Web Audio, stop/cleanup, toggle audio.
- `index.html` — carica il manifest **prima** del runtime.
- `tests/win7-sound-pack.test.js` — verifica mapping, routing e assenza di WAV distribuiti.
- `sw.js` — precache solo del codice/manifest (nessun WAV obbligatorio).

Nessun WAV originale è necessario per completare la PR dei segnaposto.
