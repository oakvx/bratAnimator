# Brat Animator — Windows 7 Desktop Edition

Le finestre, i pulsanti, le schede e il menu File usano la libreria [7.css](https://github.com/khang-nd/7.css) inclusa nel repository. Il logo verde è quello di Brat Animator. Il desktop accetta i file originali di Windows 7 e li salva in IndexedDB nel browser.

## Installazione

1. Apri **Start → Pannello di controllo → Personalizzazione di Windows 7**.
2. Seleziona i file del tema con i nomi indicati nella tabella. Puoi importarli insieme o in più passaggi. Un nuovo file con lo stesso ruolo sostituisce il precedente.
3. Sfondo, icone e suoni entrano in funzione subito. Ricarica la pagina per vedere l'animazione di avvio. Premi **Esc** per andare al desktop.
4. Per tornare al tema base, usa **Rimuovi file del tema** nella stessa sezione.

I file importati sono disponibili offline sullo stesso browser e sullo stesso indirizzo del sito. Con il tema base il desktop usa uno sfondo a tinta unita, il pulsante Start è testuale e l'app si apre direttamente nella finestra Brat Animator.

## File del tema

| Nome da importare | Risorsa originale e formato |
| --- | --- |
| `activity.bmp` | Foglio di fotogrammi contenuto in `%WinDir%\Boot\Resources\bootres.dll`. Esporta il WIM dalla risorsa e recupera `activity.bmp` dall'archivio. Il foglio è largo 200 px e alto 21.000 px, con 105 fotogrammi dall'alto al basso. È accettata anche una conversione lossless con lo stesso formato e nome `activity.png`. |
| `img0.jpg` | Sfondo Windows 7 da `%WinDir%\Web\Wallpaper\Windows\img0.jpg`. |
| `start-orb.png` | Pulsante Start Aero orizzontale da `%WinDir%\explorer.exe`, gruppo di risorse Bitmap 6801–6812. Esporta la variante Aero e salvala in PNG preservando la trasparenza. Il file deve avere tre riquadri quadrati in verticale nell'ordine normale, hover, aperto. |
| `taskbar.png` | Striscia orizzontale dello sfondo della taskbar Aero, esportata da `%WinDir%\Resources\Themes\Aero\aero.msstyles`. Usa solo il bitmap di sfondo e conserva il canale alfa. La striscia viene ripetuta orizzontalmente. |
| `folder.ico` | Icona cartella esportata dalle risorse Icon Group di `%WinDir%\System32\imageres.dll` o `shell32.dll`. |
| `music.ico` | Icona della libreria Musica esportata da Icon Group. |
| `user.bmp` | Immagine account da `%ProgramData%\Microsoft\User Account Pictures\User.bmp` oppure `Guest.bmp` rinominata. |
| `*.wav` | Registrazioni di sistema, rinominate come indicato nella [tabella dei WAV](../assets/sounds/windows7/README.md). |

Lavora su copie dei file di sistema in sola lettura. Per individuare le risorse consulta [BootRes e activity.bmp](https://www.coderforlife.com/projects/win7boot/extras/), i [bitmap del pulsante Start](https://www.askvg.com/list-of-windows-7-system-files-to-be-hacked-using-resource-hacker/) e il [formato dei temi Windows](https://learn.microsoft.com/it-it/windows/win32/controls/themesfileformat-overview).

## Comandi

- **Start** apre i collegamenti più usati e **Tutti i programmi** mostra l'elenco completo. La ricerca cerca in tutte le voci, anche quando l'elenco è chiuso.
- **Desktop** apre i collegamenti con doppio clic, Invio o un tocco. **Mostra desktop** alterna tra il desktop e la finestra in uso. Dopo aver ridotto a icona l'editor, la taskbar riapre la stessa vista.
- **Finestre** usano i controlli 7.css per ridurre a icona, ingrandire, ripristinare e chiudere. Il doppio clic sulla barra del titolo alterna le due dimensioni.
- **Avvio** riproduce i fotogrammi importati in ordine. Con la riduzione del movimento mostra solo l'ultimo fotogramma. Il browser decide quando consente la riproduzione automatica del WAV di avvio.

## Verifiche

`node --test` controlla il menu Start, la presenza della libreria, il mapping WAV e la cache. `tests/editor-layout-playwright.mjs` prova importazione e avvio offline con un bitmap di test, menu e navigazione desktop, controlli dell'editor e layout mobile.
