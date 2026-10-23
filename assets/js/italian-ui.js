(function (root, factory) {
    const api = factory(root);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratItalianUI = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (root) {
    // Only editor-owned labels are translated. Song names, lyrics, custom preset
    // names, file names, editable values and the rendered video remain untouched.
    const phrases = {
        "skip to editor": "vai all’editor", "main menu": "menu principale", "Brat Animator editor": "editor Brat Animator",
        "editor commands": "comandi editor", "editor controls": "controlli editor", "editor sections": "sezioni editor",
        "theme controls": "controlli tema", "language selector": "selettore lingua", "project status": "stato progetto",
        "commands": "comandi", "help": "guida", "green": "verde", "dark": "scuro", "autosaved": "salvato automaticamente",
        "saving...": "salvataggio…", "saved": "salvato", "ready": "pronto", "duration": "durata", "format": "formato", "lines": "righe",
        "lyrics": "testo", "timing": "tempi", "design": "stile", "canvas": "area video", "project": "progetto",
        "Use artist/title for lyrics, or paste a YouTube link to load the video preview. Audio can come from an uploaded audio/video file or a permitted direct media URL.": "Cerca il testo per artista e titolo o incolla un link YouTube per caricare l’anteprima. L’audio può provenire da un file audio/video caricato o da un URL diretto autorizzato.",
        "clean LRC": "pulisci LRC", "normalize timestamps": "normalizza timestamp", "shift -0.50s": "sposta −0,50 s", "shift +0.50s": "sposta +0,50 s",
        "undo": "annulla", "redo": "ripeti", "copy LRC": "copia LRC", "starter LRC": "LRC di esempio", "visual LRC editor": "editor LRC visuale",
        "search lyric": "cerca nel testo", "filter visible lines": "filtra le righe visibili", "refresh rows": "aggiorna righe", "apply rows to LRC": "applica righe al testo LRC",
        "+ add line": "+ aggiungi riga", "sync selected to playhead": "sincronizza selezione al cursore", "split": "dividi", "merge next": "unisci alla successiva",
        "move up": "sposta su", "move down": "sposta giù", "duplicate": "duplica", "play lyric": "riproduci frase", "offset": "scostamento",
        "selected -": "selezione −", "selected +": "selezione +", "shift all": "sposta tutte", "tap to sync": "tocca per sincronizzare",
        "Paste plain lyrics, start the timer, then press SPACE or “tap next line” when each lyric begins. The tool writes LRC timestamps automatically.": "Incolla il testo, avvia il timer e premi SPAZIO o «tocca alla prossima riga» all’inizio di ogni frase. I timestamp LRC vengono scritti automaticamente.",
        "one lyric line per row": "una frase per riga", "start tap sync": "avvia sincronizzazione a tocchi", "tap next line": "tocca alla prossima riga", "finish to LRC": "termina e genera LRC",
        "tap sync idle": "sincronizzazione a tocchi inattiva", "audio/video URL": "URL audio/video", "load media URL": "carica URL multimediale",
        "Use a direct CORS-enabled audio/video file you have permission to use. YouTube links stay preview-only and are not downloaded.": "Usa un URL diretto a un file audio/video con CORS che sei autorizzato a usare. I link YouTube servono solo per l’anteprima e non vengono scaricati.",
        "audio waveform": "forma d’onda audio", "lyric timeline": "timeline del testo", "LRC tools": "strumenti LRC", "style and animation": "stile e animazione",
        "style preset": "stile predefinito", "brat classic": "brat classico", "dark green": "verde scuro", "white label": "etichetta bianca", "pink": "rosa", "blue": "blu",
        "cinematic": "cinematografico", "custom": "personalizzato", "animation": "animazione", "typewriter": "macchina da scrivere", "word by word": "parola per parola",
        "letter chunks": "gruppi di lettere", "phrase by phrase": "frase per frase", "full line": "riga completa", "fade in": "dissolvenza in entrata", "fade out": "dissolvenza in uscita",
        "jitter": "tremolio", "pulse": "pulsazione", "lyrics display": "visualizzazione testo", "brat canvas": "area Brat", "music synced scroll": "scorrimento musicale sincronizzato",
        "cinematic scroll": "scorrimento cinematografico",
        "Enhanced LRC word timestamps are used when available. Standard LRC timing is interpolated automatically.": "Quando disponibili, vengono usati i timestamp delle parole Enhanced LRC. I tempi LRC standard vengono interpolati automaticamente.",
        "background": "sfondo", "text": "testo", "accessibility check": "controllo accessibilità", "auto contrast": "contrasto automatico",
        "Choose readable text for the current background.": "Scegli un testo leggibile sullo sfondo attuale.", "AA ready for standard text.": "Contrasto AA adatto al testo standard.",
        "Low contrast: use auto contrast before export.": "Contrasto basso: usa il contrasto automatico prima di esportare.",
        "background fill": "riempimento sfondo", "fill type": "tipo di riempimento", "solid color": "colore uniforme", "linear gradient": "gradiente lineare", "radial gradient": "gradiente radiale",
        "second color": "secondo colore", "angle": "angolo", "color exchange": "scambio colori", "swap text and background": "scambia testo e sfondo", "change on": "cambia a ogni",
        "line": "riga", "word": "parola", "letter": "lettera", "every": "ogni", "Swap every line. Letter mode follows the typewriter animation.": "Scambia a ogni riga. La modalità lettere segue l’animazione macchina da scrivere.",
        "Enable to alternate the text and background palette.": "Attiva per alternare i colori del testo e dello sfondo.",
        "Letter exchange applies to brat canvas with the typewriter animation; this mode falls back to each line.": "Lo scambio per lettera si applica all’area Brat con l’animazione macchina da scrivere; in questa modalità avviene a ogni riga.",
        "letters per step": "lettere per passaggio", "music synced scroll options": "opzioni scorrimento musicale", "lyrics alignment": "allineamento testo", "left": "sinistra", "center": "centro",
        "highlight": "evidenziazione", "word-progress highlight": "evidenzia avanzamento parole", "active scale": "scala frase attiva", "dim opacity": "opacità frasi inattive", "scroll anchor": "posizione di scorrimento",
        "word animation": "animazione parole", "progress": "avanzamento", "fade": "dissolvenza", "scale": "scala", "pop": "scatto", "glow": "bagliore", "shake": "vibrazione", "color transition": "transizione colore",
        "word color": "colore parole", "word intensity": "intensità parole", "Use": "Usa", ",": ",", "or": "o",
        "before a lyric line to render backing vocals, side vocals or secondary/romanized lines.": "prima di una riga per mostrare cori, voci secondarie o testo secondario/romanizzato.",
        "dynamic blurred background": "sfondo sfocato dinamico", "side / backing vocals": "voci secondarie / cori", "background motion": "movimento sfondo", "depth / vignette": "profondità / vignettatura",
        "lyric glow": "bagliore testo", "edge fade": "dissolvenza bordi", "randomize style": "stile casuale", "show social safe zones": "mostra aree sicure per social", "fullscreen preview": "anteprima a schermo intero",
        "background image or video": "immagine o video di sfondo", "Upload an image, MP4 or WebM loop. Local video backgrounds are included in preview and export.": "Carica un’immagine o un video MP4/WebM in loop. Gli sfondi video locali vengono inclusi nell’anteprima e nell’esportazione.",
        "image or video file": "file immagine o video", "apply image or video to": "applica immagine o video a", "text fill": "riempimento testo", "background and text": "sfondo e testo",
        "direct image or video URL": "URL diretto a immagine o video", "load URL": "carica URL", "clear": "cancella", "use artwork": "usa copertina", "opacity": "opacità", "blur": "sfocatura",
        "brightness": "luminosità", "saturation": "saturazione", "x position": "posizione X", "y position": "posizione Y", "no background image or video": "nessuna immagine o video di sfondo",
        "preset library": "libreria stili", "preset name": "nome dello stile", "my lyric style": "il mio stile", "save as preset": "salva come stile", "saved presets": "stili salvati",
        "load preset": "carica stile", "delete preset": "elimina stile", "export preset JSON": "esporta stile JSON", "import preset JSON": "importa stile JSON", "no saved presets yet": "nessuno stile salvato",
        "no user presets": "nessuno stile personale", "canvas and safe areas": "area video e margini sicuri",
        "Choose the output shape, preview safe zones and check what will fit before exporting.": "Scegli il formato, visualizza le aree sicure e controlla l’inquadratura prima di esportare.",
        "square": "quadrato", "vertical": "verticale", "landscape": "orizzontale", "cover": "copertina", "current format": "formato attuale", "safe zones": "aree sicure", "recommended fps": "fps consigliati",
        "on": "attive", "off": "disattive", "toggle safe zones": "attiva/disattiva aree sicure", "preview zoom": "zoom anteprima", "format preset": "formato predefinito",
        "Square · 1080×1080": "Quadrato · 1080×1080", "Story · 1080×1920": "Storia · 1080×1920", "Landscape · 1920×1080": "Orizzontale · 1920×1080", "Cover PNG · 3000×3000": "Copertina PNG · 3000×3000",
        "checking...": "verifica…", "volume": "volume", "export 3 preview frames": "esporta 3 fotogrammi di anteprima", "export 5s WebM preview": "esporta anteprima WebM di 5 s",
        "export project JSON": "esporta progetto JSON", "import project JSON": "importa progetto JSON", "project tools": "strumenti progetto", "snapshot name": "nome della copia",
        "late-night lyric pass": "la mia versione del testo", "save snapshot": "salva una copia", "duplicate project": "duplica progetto", "copy share link": "copia link di condivisione", "copy project JSON": "copia progetto JSON",
        "snapshots stay in this browser": "le copie del progetto restano in questo browser", "clear autosave": "cancella salvataggio automatico", "preview": "anteprima", "export": "esporta",
        "skip": "salta", "back": "indietro", "try it": "prova", "next": "avanti", "finish": "fine", "type a command": "scrivi un comando", "command search": "cerca comando",
        "preview tools": "strumenti anteprima", "zoom preview out": "riduci zoom anteprima", "zoom preview in": "aumenta zoom anteprima", "fit": "adatta", "fullscreen": "schermo intero",
        "lyric video preview": "anteprima video del testo", "preview playback": "riproduzione anteprima", "restart preview": "ricomincia anteprima", "play preview": "riproduci anteprima",
        "pause preview": "metti in pausa l’anteprima", "preview playhead": "cursore anteprima", "play": "riproduci", "pause": "pausa", "play ·": "riproduci ·", "seek": "sposta cursore",
        "select lyric row": "seleziona riga", "timestamp": "timestamp", "lyric text": "testo della frase", "seek to row": "vai alla riga", "remove": "rimuovi",
        "use these lyrics": "usa questo testo", "search video": "cerca video", "load": "carica", "delete": "elimina",
        "No editable LRC rows yet.": "Nessuna riga LRC modificabile.", "No lyric rows match the filter.": "Nessuna riga corrisponde al filtro.", "No snapshots yet.": "Nessuna copia del progetto salvata.",
        "no search yet": "nessuna ricerca effettuata", "no audio loaded": "nessun audio caricato", "no export yet": "nessuna esportazione effettuata", "no video loaded": "nessun video caricato",
        "results cleared": "risultati cancellati", "no LRCLIB results": "nessun risultato LRCLIB", "YouTube link loaded as video preview": "link YouTube caricato come anteprima video",
        "invalid video query": "ricerca video non valida", "video search unavailable; open YouTube search and paste a video URL if needed": "ricerca video non disponibile; cerca su YouTube e incolla l’URL del video",
        "LRCLIB search error": "errore di ricerca LRCLIB", "LRC generated from tap sync": "LRC generato dalla sincronizzazione a tocchi", "project JSON imported": "progetto JSON importato",
        "snapshot deleted": "copia eliminata", "project JSON copied": "progetto JSON copiato", "copy failed": "copia non riuscita", "share link copied": "link di condivisione copiato",
        "project is too large for a tidy link; JSON copied instead": "il progetto è troppo grande per un link; il file JSON è stato copiato",
        "preset library exported": "libreria stili esportata", "preset import failed": "importazione stile non riuscita", "duplicated current project as a snapshot": "progetto corrente duplicato in una copia",
        "nothing to copy yet": "nessun contenuto da copiare", "LRC copied": "LRC copiato", "starter LRC generated": "LRC di esempio generato", "3 preview frames exported": "3 fotogrammi di anteprima esportati",
        "5s WebM preview exported": "anteprima WebM di 5 s esportata", "supported": "supportato", "not supported": "non supportato", "preparing fast MP4 export...": "preparazione esportazione MP4 rapida…",
        "export complete: video-only MP4 generated with fast mode": "esportazione completata: MP4 senza audio generato in modalità rapida", "preparing fallback export...": "preparazione esportazione in tempo reale…",
        "export failed": "esportazione non riuscita", "PNG frame exported": "fotogramma PNG esportato", "demo loaded": "esempio caricato", "paste or load LRC lyrics to preview": "incolla o carica un testo LRC per l’anteprima",
        "use [MM:SS.xx] timestamps before previewing": "usa timestamp [MM:SS.xx] prima dell’anteprima", "paste or load LRC lyrics before exporting": "incolla o carica un testo LRC prima di esportare",
        "Write a search query first.": "Scrivi prima una ricerca.", "Paste plain lyrics first.": "Incolla prima il testo semplice.", "Invalid project JSON.": "File JSON del progetto non valido.",
        "WebM preview export requires MediaRecorder support.": "L’esportazione dell’anteprima WebM richiede il supporto di MediaRecorder.", "Paste LRC lyrics first.": "Incolla prima il testo LRC.",
        "Invalid format. Use [MM:SS.xx] text.": "Formato non valido. Usa [MM:SS.xx] seguito dal testo.",
        "The selected remote background is not CORS-enabled, so the browser cannot export it. Use a local upload or another permitted URL.": "Lo sfondo remoto selezionato non consente CORS e il browser non può esportarlo. Carica un file locale o usa un altro URL autorizzato.",
        "Audio export requires MediaRecorder support in this browser.": "L’esportazione audio richiede il supporto di MediaRecorder nel browser.", "This browser does not support video export.": "Questo browser non supporta l’esportazione video.",
        "preview from start": "anteprima dall’inizio", "play selected lyric": "riproduci frase selezionata", "split selected lyric": "dividi frase selezionata", "duplicate selected lyric": "duplica frase selezionata",
        "clear background": "rimuovi sfondo", "open lyrics": "apri testo", "open timing": "apri tempi", "open design": "apri stile", "open canvas": "apri area video", "open project": "apri progetto",
        "start with the preview": "inizia dall’anteprima", "The green canvas is the video you will export. The controls panel changes what appears here.": "L’area verde mostra il video che esporterai. I controlli modificano ciò che appare qui.",
        "The canvas is the video you will export. Every lyric, timing, style, and format change updates this preview.": "L’area video mostra ciò che esporterai. Ogni modifica a testo, tempi, stile e formato aggiorna l’anteprima.",
        "Use the controls panel for editing. Collapse it when you want a larger preview.": "Usa il pannello dei controlli per modificare il video. Richiudilo per ingrandire l’anteprima.",
        "find lyrics": "trova il testo", "Search by artist and title. Results from LRCLIB can fill the project without leaving the browser.": "Cerca per artista e titolo. I risultati LRCLIB caricano il testo nel progetto senza uscire dal browser.",
        "You can also skip search and paste your own LRC in the Timing tab.": "Puoi anche incollare il tuo testo LRC nella scheda Tempi.", "add timed lines": "aggiungi righe sincronizzate",
        "LRC lines need timestamps like [00:01.20]. Use starter LRC for a quick working example, then edit the rows.": "Le righe LRC richiedono timestamp come [00:01.20]. Genera un LRC di esempio e poi modifica le righe.",
        "generate starter": "genera esempio", "adjust the look": "regola lo stile", "Choose a preset, animation mode, colors, and typography. Keep checking the canvas as you tune it.": "Scegli uno stile, un’animazione, i colori e il carattere. Controlla l’anteprima mentre li regoli.",
        "choose the format": "scegli il formato", "Pick square, vertical, landscape, or cover output before exporting. Safe zones help with social layouts.": "Scegli un formato quadrato, verticale, orizzontale o copertina. Le aree sicure aiutano a preparare i video per i social.",
        "The Export tab still controls final size and FPS.": "Nella scheda Esporta trovi dimensione finale e fps.", "export or save": "esporta o salva",
        "Export the video, save a project snapshot, or copy a share link so you can return to the edit later.": "Esporta il video, salva una copia del progetto o copia un link per riprendere le modifiche in seguito.",
        "Audio can be embedded only from a local upload or a direct CORS-enabled URL you have permission to use.": "Puoi includere l’audio soltanto da un file locale o da un URL diretto con CORS che sei autorizzato a usare."
    };

    Object.assign(phrases, {
        "export video": "esporta video", "snapshot storage is full": "lo spazio per le copie del progetto è esaurito", "shared project loaded": "progetto condiviso caricato",
        "disabled with audio": "disattivato con audio", "realtime for video background": "tempo reale per sfondo video",
        "Video frame could not be decoded.": "Impossibile decodificare il fotogramma video.", "audio export requires Web Audio support": "l’esportazione audio richiede il supporto di Web Audio",
        "no video encoder available in this browser": "nessun codificatore video disponibile in questo browser", "video recording failed": "registrazione video non riuscita",
        "background failed to load or is not CORS-enabled": "impossibile caricare lo sfondo oppure CORS non è abilitato",
        "YouTube links are preview-only. Use search video for reference, or upload/paste a direct image/video URL for background.": "I link YouTube servono solo per l’anteprima. Cerca un video di riferimento oppure carica un’immagine/video o il relativo URL diretto per lo sfondo.",
        "no artwork or thumbnail available": "nessuna copertina o miniatura disponibile", "saved media reference could not be restored": "impossibile ripristinare il riferimento al file salvato",
        "URL media reference restored; click load media URL to decode it again.": "Riferimento URL ripristinato; premi «carica URL multimediale» per decodificarlo di nuovo.",
        "YouTube cannot be downloaded here. Use it as preview, then upload an audio/video file or paste a direct CORS-enabled media URL you can use.": "Non è possibile scaricare da YouTube. Usalo come anteprima, poi carica un file audio/video o incolla un URL diretto con CORS che sei autorizzato a usare.",
        "extracting audio from URL media...": "estrazione audio dal file all’URL…", "decoding URL audio...": "decodifica audio dall’URL…",
        "media URL could not be loaded or decoded; check CORS, permissions, and browser support": "impossibile caricare o decodificare l’URL multimediale; controlla CORS, autorizzazioni e supporto del browser",
        "Unmatched word timestamp": "Timestamp di parola senza corrispondenza", "Invalid word timestamp": "Timestamp di parola non valido",
        "Word timestamp outside its line or out of order": "Timestamp di parola fuori dalla frase o non in ordine", "Terminal timestamp before its last word": "Timestamp finale precedente all’ultima parola",
        "Terminal timestamp outside its line": "Timestamp finale fuori dalla frase", "Media ends before the Enhanced LRC timings": "Il file multimediale termina prima dei tempi Enhanced LRC",
        "Dense line: very little time per word": "Frase densa: pochissimo tempo per parola"
    });
    Object.assign(phrases, {
        "Local media storage is unavailable.": "L’archiviazione locale dei file multimediali non è disponibile.",
        "Text transforms are available in Brat canvas.": "Le trasformazioni del testo sono disponibili nell’area Brat.",
        "text transform": "trasformazione testo", "move selected text": "sposta testo selezionato", "stretch text": "deforma testo", "resize text": "ridimensiona testo",
        "advanced editor": "editor avanzato"
    });
    Object.assign(phrases, {
        "Choose a TTF, OTF, WOFF or WOFF2 font.": "Scegli un font TTF, OTF, WOFF o WOFF2.",
        "The font file is empty or missing.": "Il file del font è vuoto o mancante.",
        "Custom fonts are not supported in this browser.": "Questo browser non supporta font personalizzati.",
        "Missing font asset": "File del font mancante", "The local ZIP library is unavailable.": "La libreria ZIP locale non è disponibile.",
        "The project must be an object.": "Il progetto deve essere un oggetto.", "The project contains unsupported data.": "Il progetto contiene dati non supportati.",
        "Upgrade the project to version 5 before packaging it.": "Aggiorna il progetto alla versione 5 prima di creare il pacchetto.",
        "The project's fonts must be a list.": "I font del progetto devono essere un elenco.", "The project contains invalid font metadata.": "Il progetto contiene dati del font non validi.",
        "The project contains invalid media metadata.": "Il progetto contiene dati multimediali non validi.", "The project contains invalid asset references.": "Il progetto contiene riferimenti a file non validi.",
        "Only HTTP(S) assets can be packaged.": "Il pacchetto può includere solo file remoti HTTP(S).", "Remote media cannot be downloaded in this browser.": "Questo browser non può scaricare i file remoti.",
        "Asset is missing or empty.": "Il file è mancante o vuoto.", "Asset exceeds the 512 MiB package limit.": "Il file supera il limite di 512 MiB del pacchetto.",
        "Unsupported font file.": "File del font non supportato.", "Invalid asset identifier.": "Identificativo del file non valido.", "Duplicate asset identifier.": "Identificativo del file duplicato.",
        "Package exceeds the 1 GiB limit.": "Il pacchetto supera il limite di 1 GiB.", "The project manifest exceeds 1 MiB.": "Il manifesto del progetto supera 1 MiB.",
        "The ZIP file is empty, truncated or too large.": "Il file ZIP è vuoto, incompleto o troppo grande.", "The ZIP directory is missing.": "L’indice del file ZIP è mancante.",
        "Unsupported ZIP directory or too many entries.": "Indice ZIP non supportato o troppi file.", "Invalid ZIP entry.": "Voce ZIP non valida.",
        "Encrypted, ZIP64 or unsupported ZIP entries are not allowed.": "Non sono supportati file ZIP cifrati, ZIP64 o con voci non compatibili.",
        "Unsafe or duplicate ZIP path.": "Percorso ZIP non valido o duplicato.", "Invalid local ZIP entry.": "Voce locale ZIP non valida.",
        "ZIP entry headers do not match.": "Le intestazioni del file ZIP non corrispondono.", "ZIP contents exceed package size limits.": "I contenuti ZIP superano i limiti del pacchetto.",
        "The package manifest is missing.": "Il manifesto del pacchetto è mancante.", "The ZIP file exceeds the 1 GiB package limit.": "Il file ZIP supera il limite di 1 GiB del pacchetto.",
        "Cannot read the ZIP file.": "Impossibile leggere il file ZIP.", "The ZIP file is damaged.": "Il file ZIP è danneggiato.",
        "The package manifest is not valid JSON.": "Il manifesto del pacchetto non è un JSON valido.", "This file is not a Brat Animator package.": "Questo file non è un pacchetto Brat Animator.",
        "This package version is not supported.": "Questa versione del pacchetto non è supportata.", "The package asset list is invalid.": "L’elenco dei file del pacchetto non è valido.",
        "Invalid or duplicate asset identifier/path.": "Identificativo o percorso del file non valido o duplicato.", "The package contains invalid asset metadata.": "Il pacchetto contiene dati dei file non validi.",
        "The package contains an unsupported font.": "Il pacchetto contiene un font non supportato.", "The ZIP contains files not listed in its manifest.": "Lo ZIP contiene file non elencati nel manifesto.",
        "The project references missing assets.": "Il progetto fa riferimento a file mancanti.",
        "could not extract audio from this video; use a browser-supported video with an audio track, or upload the audio file": "impossibile estrarre l’audio da questo video; usa un video supportato dal browser con traccia audio oppure carica il file audio",
        "unsupported audio or decoding failed": "audio non supportato o decodifica non riuscita"
    });

    function translate(text) {
        const input = String(text ?? "");
        const trimmed = input.trim().replace(/\s+/g, " ");
        if (!trimmed) return input;
        let translated = phrases[trimmed];
        if (!translated) translated = Object.values(root.BratV5Strings || {}).find(value => Array.isArray(value) && value[0] === trimmed)?.[1];
        if (!translated && root.BratI18n?.translations) {
            const key = Object.keys(root.BratI18n.translations.en).find(name => root.BratI18n.translations.en[name].replace(/\s+/g, " ") === trimmed);
            if (key) translated = root.BratI18n.translations.it?.[key];
        }
        if (!translated) {
            const patterns = [
                [/^step (\d+) of (\d+)$/, (_, current, total) => `passaggio ${current} di ${total}`],
                [/^Line (\d+): (.*)$/, (_, index, warning) => `Riga ${index}: ${translate(warning)}`],
                [/^Missing font: (.*)$/, (_, name) => `Font mancante: ${name}`],
                [/^Cannot load font: (.*)$/, (_, name) => `Impossibile caricare il font: ${name}`],
                [/^Reload or replace missing fonts: (.*)$/, (_, names) => `Ricarica o sostituisci i font mancanti: ${names}`],
                [/^The font file is invalid: (.*)$/, (_, name) => `Il file del font non è valido: ${name}`],
                [/^A package supports fewer than (\d+) assets\.$/, (_, count) => `Un pacchetto supporta meno di ${count} file.`],
                [/^Remote media download failed \((\d+)\)\.$/, (_, code) => `Download del file remoto non riuscito (${code}).`],
                [/^Reload missing assets before exporting: (.*)$/, (_, names) => `Ricarica i file mancanti prima di esportare: ${names}`],
                [/^The ZIP entry is damaged: (.*)$/, (_, name) => `La voce ZIP è danneggiata: ${name}`],
                [/^A packaged asset is missing: (.*)$/, (_, name) => `Un file del pacchetto è mancante: ${name}`],
                [/^The packaged font cannot be loaded: (.*)$/, (_, name) => `Impossibile caricare il font del pacchetto: ${name}`],
                [/^font loaded: (.*)$/, (_, name) => `font caricato: ${name}`],
                [/^(minimum )?contrast ([\d.]+):1$/, (_, minimum, ratio) => `${minimum ? "contrasto minimo" : "contrasto"} ${ratio}:1`],
                [/^Swap every (?:(\d+) )?(line|word|letter)s?\.$/, (_, count, unit) => `Scambia ogni ${count || ""}${count ? " " : ""}${({ line: count ? "righe" : "riga", word: count ? "parole" : "parola", letter: count ? "lettere" : "lettera" })[unit]}.`],
                [/^(\d+) saved presets$/, (_, count) => `${count} stili salvati`],
                [/^imported (\d+) presets?$/, (_, count) => `${count} stili importati`],
                [/^(saved|loaded|deleted) preset: (.*)$/, (_, verb, name) => `stile ${{ saved: "salvato", loaded: "caricato", deleted: "eliminato" }[verb]}: ${name}`],
                [/^saved snapshot: (.*)$/, (_, name) => `copia salvata: ${name}`],
                [/^loaded: (.*)$/, (_, name) => `caricato: ${name}`],
                [/^loaded (.+)$/, (_, name) => `caricato ${name}`],
                [/^LRCLIB search: (.*)$/, (_, query) => `ricerca LRCLIB: ${query}`],
                [/^Invidious video search: (.*)$/, (_, query) => `ricerca video Invidious: ${query}`],
                [/^(\d+) LRCLIB results$/, (_, count) => `${count} risultati LRCLIB`],
                [/^(\d+) videos found via (.*)$/, (_, count, source) => `${count} video trovati tramite ${source}`],
                [/^(image|video) background (ready|selected)$/, (_, kind, state) => `sfondo ${kind === "image" ? "immagine" : "video"} ${state === "ready" ? "pronto" : "selezionato"}`],
                [/^tap sync started · line (\d+)\/(\d+)$/, (_, current, total) => `sincronizzazione a tocchi avviata · riga ${current}/${total}`],
                [/^tap sync (.*)$/, (_, content) => `sincronizzazione a tocchi ${content.replace(/^line /, "riga ").replace("complete", "completata")}`],
                [/^(\d+) lines • (\d+) blocks • ([\d.]+)s timeline(.*)$/, (_, lines, blocks, duration, tail) => `${lines} righe • ${blocks} blocchi • timeline di ${duration} s${tail.replace("audio assist on", "assistenza audio attiva").replace("audio assist off", "assistenza audio disattiva")}`],
                [/^(\d+) words · (.*)$/, (_, words, report) => `${words} parole · ${report.replace("sung", "cantato").replace("estimated pause", "pausa stimata").replace("lines with word timestamps", "righe con timestamp delle parole").replace("audio-guided estimates", "stime guidate dall’audio").replace("timing warnings — see details below", "avvisi sui tempi — vedi dettagli sotto")}`],
                [/^loading (image|video) background\.\.\.$/, (_, kind) => `caricamento sfondo ${kind === "image" ? "immagine" : "video"}…`],
                [/^(image|video) background is preview-only; upload it locally to export$/, (_, kind) => `sfondo ${kind === "image" ? "immagine" : "video"} solo per anteprima; caricalo localmente per esportare`],
                [/^extracting audio from (.*)\.\.\.$/, (_, name) => `estrazione audio da ${name}…`],
                [/^decoding (.*)\.\.\.$/, (_, name) => `decodifica di ${name}…`],
                [/^loading URL (audio|video)\.\.\.$/, (_, kind) => `caricamento ${kind} dall’URL…`],
                [/^(.*) restored from this browser$/, (_, name) => `${name} ripristinato da questo browser`],
                [/^(.*) - ([\d.]+)s - (audio extracted from video|timing analysis ready)$/, (_, name, duration, state) => `${name} - ${duration} s - ${state === "audio extracted from video" ? "audio estratto dal video" : "analisi dei tempi pronta"}`],
                [/^(undid|redid) (.*)$/, (_, verb, change) => `${verb === "undid" ? "annullato" : "ripetuto"}: ${translate(change)}`],
                [/^(.*) · audio uses real-time export$/, (_, dimensions) => `${dimensions} · l’audio viene esportato in tempo reale`],
                [/^(.*) · background video uses real-time export$/, (_, dimensions) => `${dimensions} · lo sfondo video viene esportato in tempo reale`],
                [/^(.*) works, but 1080 base · 30 fps is safer$/, (_, dimensions) => `${dimensions} supportato; consigliati base 1080 · 30 fps`],
                [/^selected video: (.*) - YouTube preview only; add matching audio by upload or direct permitted URL$/, (_, id) => `video selezionato: ${id} - solo anteprima YouTube; aggiungi l’audio da un file locale o URL diretto autorizzato`],
                [/^selected video: (.*) - open through http\/https for embedded preview$/, (_, id) => `video selezionato: ${id} - apri tramite http/https per l’anteprima incorporata`],
                [/^estimated export time: (.*)$/, (_, content) => `tempo di esportazione stimato: ${content.replace(/^about /, "circa ").replace("n/a", "n/d").replace("audio export records in real time", "l’esportazione audio avviene in tempo reale").replace("fast export, no need to wait for the full lyric duration", "esportazione rapida, senza attendere la durata completa del testo").replace("video background uses real-time export", "lo sfondo video viene esportato in tempo reale").replace("traditional fallback, browser can approach real duration", "esportazione standard, il browser può impiegare la durata del video")}`],
                [/^(fast MP4|fallback) export: (.*)$/, (_, mode, content) => `esportazione ${mode === "fast MP4" ? "MP4 rapida" : "in tempo reale"}: ${content.replace("estimated remaining", "tempo rimanente stimato").replace("with loaded audio", "con audio caricato").replace("no audio", "senza audio")}`],
                [/^export complete: (.*)$/, (_, content) => `esportazione completata: ${content.replace("with loaded audio", "con audio caricato").replace("without audio", "senza audio").replace("video-only", "solo video").replace("generated", "generato")}`]
            ];
            for (const [pattern, replacement] of patterns) {
                if (pattern.test(trimmed)) { translated = trimmed.replace(pattern, replacement); break; }
            }
        }
        return translated ? `${input.match(/^\s*/)[0]}${translated}${input.match(/\s*$/)[0]}` : input;
    }

    function language() {
        return root.document?.documentElement?.lang?.split("-")[0] || root.BratI18n?.getSavedLanguage?.() || "en";
    }

    function localize(text) { return language() === "it" ? translate(text) : String(text ?? ""); }

    const api = { translate, localize, phrases, apply: () => {} };
    if (!root.document?.body) return api;
    const document = root.document;
    const originals = new WeakMap();
    const originalAttributes = new WeakMap();
    const editableOrContent = "script,style,textarea,input,canvas,svg,kbd,code,[contenteditable='true'],[data-user-content]";
    const userRegions = "#lrclibResults,#youtubeResults,.snapshot-details,#userPresetSelect,#fontFamilySelect,#translationFontSelect,#phraseSelect,#unmatchedTranslations";
    const uiSelector = "button,label,summary,legend,option,nav,h1,h2,h3,.mini-copy,.section-title,.mode-note,.beautiful-note,.contrast-kicker,.project-status-bar,.canvas-summary-grid,.stage-title,.hint,.skip-link,[role='status'],.meta,.timing-report,.tutorial-card,.autosave-pill,#colorSwapHint,#contrastRatio,#contrastStatus,#compatPanel,#tutorialProgress,#tutorialBody,#tutorialTip,[data-v5-key]";

    function isUiText(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest(editableOrContent) || parent.closest("[data-i18n]")) return false;
        if (parent.closest(userRegions) && !parent.closest("button")) return false;
        return Boolean(parent.closest(uiSelector));
    }

    function phraseForKey(element, fallback) {
        if (element?.childElementCount || !fallback.trim()) return fallback;
        const key = element?.dataset.v5Key;
        const strings = root.BratV5Strings;
        if (!key || !strings) return fallback;
        const localized = strings.it?.[key] ?? strings[key]?.it ?? strings[key]?.[1];
        return typeof localized === "string" ? localized : fallback;
    }

    function canonicalSource(text) {
        const trimmed = text.trim().replace(/\s+/g, " ");
        const pair = Object.entries(phrases).find(([, italian]) => italian === trimmed)
            || Object.values(root.BratV5Strings || {}).find(value => Array.isArray(value) && value[1] === trimmed);
        if (pair) return `${text.match(/^\s*/)[0]}${pair[0]}${text.match(/\s*$/)[0]}`;
        const fontLoaded = trimmed.match(/^font caricato: (.*)$/);
        if (fontLoaded) return `font loaded: ${fontLoaded[1]}`;
        return text;
    }

    function apply(scope = document.body) {
        if (!scope || !scope.isConnected) return;
        const italian = language() === "it";
        const walker = document.createTreeWalker(scope, 4);
        let node;
        while ((node = walker.nextNode())) {
            if (!isUiText(node)) continue;
            const current = node.nodeValue;
            let previous = originals.get(node);
            if (!previous || (current !== previous.rendered && current !== previous.source)) previous = { source: canonicalSource(current), rendered: current };
            const output = italian ? phraseForKey(node.parentElement, translate(previous.source)) : previous.source;
            previous.rendered = output;
            originals.set(node, previous);
            if (current !== output) node.nodeValue = output;
        }
        const attributesSelector = "[aria-label],[title],[placeholder]";
        const attributeElements = [...(scope.matches?.(attributesSelector) ? [scope] : []), ...scope.querySelectorAll(attributesSelector)];
        attributeElements.forEach(element => {
            if (element.closest(userRegions) && !element.matches("button,input")) return;
            if (element.matches("canvas")) {
                // Canvas pixels are never changed; its accessible description is UI.
            } else if (element.closest("script,style,[contenteditable='true'],[data-user-content]")) return;
            const saved = originalAttributes.get(element) || {};
            for (const attribute of ["aria-label", "title", "placeholder"]) {
                if (!element.hasAttribute(attribute) || element.hasAttribute(`data-i18n-${attribute}`)) continue;
                // Placeholder lyric examples are source material, not interface copy.
                if (attribute === "placeholder" && element.id === "lyricsInput") continue;
                const current = element.getAttribute(attribute);
                let previous = saved[attribute];
                if (!previous || (current !== previous.rendered && current !== previous.source)) previous = { source: current, rendered: current };
                const output = italian ? translate(previous.source) : previous.source;
                previous.rendered = output;
                saved[attribute] = previous;
                if (current !== output) element.setAttribute(attribute, output);
            }
            originalAttributes.set(element, saved);
        });
    }

    api.apply = apply;
    if (root.BratI18n) {
        const originalApply = root.BratI18n.applyLanguage;
        root.BratI18n.applyLanguage = function (selected) {
            const result = originalApply.call(this, selected);
            apply();
            return result;
        };
    }
    for (const dialog of ["alert", "confirm", "prompt"]) {
        const original = root[dialog];
        if (typeof original === "function") root[dialog] = function (message, ...args) { return original.call(root, localize(message), ...args); };
    }
    let pending = false;
    const pendingScopes = new Set();
    const observer = new root.MutationObserver(records => {
        for (const record of records) {
            const element = record.target.nodeType === 3 ? record.target.parentElement : record.target;
            const uiParent = element?.closest?.(uiSelector);
            if (uiParent) pendingScopes.add(uiParent);
            else if (record.type === "attributes") pendingScopes.add(element);
            else if ([...(record.addedNodes || [])].some(node => node.nodeType === 1 && (node.matches?.(uiSelector) || node.querySelector?.(uiSelector)))) pendingScopes.add(element);
        }
        if (pending || !pendingScopes.size) return;
        pending = true;
        root.queueMicrotask(() => {
            pending = false;
            const scopes = [...pendingScopes];
            pendingScopes.clear();
            for (const scope of scopes) if (!scopes.some(other => other !== scope && other.contains(scope))) apply(scope);
        });
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["title", "aria-label", "placeholder"] });
    apply();
    return api;
});
