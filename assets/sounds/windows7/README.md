# Suoni originali di Windows 7

Apri **Start → Pannello di controllo → Personalizzazione di Windows 7**, rinomina i WAV secondo la tabella e selezionali in **File del tema**. Ogni suono importato viene salvato nel browser. Gli eventi privi di un WAV restano silenziosi.

I file dello schema di Windows 7 sono in `%WinDir%\Media`. Per il suono di avvio, esporta la risorsa WAVE 5080 da una copia di `%WinDir%\System32\imageres.dll` e salvala come `startup.wav`. Il browser può richiedere un gesto dell'utente prima di consentire la riproduzione.

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

I nomi nella prima colonna sono quelli riconosciuti da Brat Animator. Per gli eventi a cui lo schema di Windows 7 non associa un WAV, lascia il file assente.

## Installazione in un checkout locale

Per un'installazione su un server locale, puoi copiare i WAV in `assets/sounds/windows7/` e impostare `const installed = true` in `assets/js/win7-sound-pack.js`. Questa cartella esclude i WAV da Git. Se è presente anche una copia importata nel browser, Brat Animator usa quella.

Per gli altri file, consulta la [guida al tema](../../../docs/windows7-desktop-edition.md).
