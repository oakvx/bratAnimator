# Brat Animator — Windows 7 Desktop Edition

Questa implementazione trasforma la navigazione Brat in un'esperienza da applicazione Windows 7, senza modificare lo storage dei progetti, la timeline e i motori di export.

## Componenti

| Modulo | Percorso | Responsabilità |
|---|---|---|
| Boot | `assets/js/win7-boot.js` + `assets/css/win7-boot.css` | Animazione dei quattro elementi luminosi, progressione, Skip/Esc, riduzione movimento, evento di completamento |
| Menu principale | `assets/js/win7-window-menu.js` | Comandi File/Modifica/Visualizza/Strumenti/Guida e shortcut tastiera |
| Desktop | `assets/js/win7-shell.js` | Minimize, maximize, close, taskbar, Show Desktop, icone progetto/audio, clock con data |
| Menu Start | `assets/js/win7-start-menu.js` | Launcher a due colonne, ricerca locale, comandi, Ctrl+Esc e navigazione tastiera |
| Presentazione | `assets/css/win7-desktop-polish.css` | Posizionamento e integrazioni Aero, mantenendo i componenti di 7.css |
| Suoni opzionali | `assets/js/win7-sound-pack.js` | Mapping WAV locale a 15 eventi, senza audio proprietari inclusi |
| Guida WAV | `assets/sounds/windows7/README.md` | Nomi file, cartelle e checklist Codex |

## Apertura del programma

1. L'HTML mostra subito `#studioBoot`: sfondo scuro, composizione luminosa in quattro colori e barra di progresso. È una ricostruzione CSS originale ispirata alla sequenza Windows 7, non un filmato Microsoft.
2. Dopo circa due secondi o premendo **Salta / Esc**, l'animazione termina e l'interfaccia diventa interattiva. In modalità riduzione movimento dura una frazione di secondo e disattiva gli effetti di movimento.
3. L'evento `brat:studio-boot-finished` viene trasmesso al sistema dei suoni. Alcuni browser impediscono l'autoplay audio prima di un clic; l'app rimane completamente utilizzabile.
4. Il desktop contiene un'icona del programma, Progetti e Sound Hub. Il programma principale si presenta come finestra `window glass active` della vera libreria **7.css**.

## Controlli disponibili

- **Start**: pulsante Aero quadripartito, due colonne, ricerca e apertura di progetti, musica, impostazioni e guida. `Ctrl+Esc` apre il menu quando il browser consente quella combinazione.
- **Finestra principale**: barre native 7.css con i comandi minimizza, ingrandisci e chiudi. La taskbar permette di ripristinare.
- **Menu applicativo**: `ul role="menubar"` con sottomenu `role="menu"` gestiti da 7.css e comportamento JS. Attivazione con mouse e frecce/Enter/Escape.
- **Editor**: Aero titlebar con controlli 7.css, toolbar chiara in stile Windows 7 e taskbar visibile sui desktop; espandi editor nasconde/ripristina il pannello laterale.
- **Desktop**: icone Progetti e Sound Hub operative, pulsante Mostra desktop, orologio e data in stile Superbar.
- **Guida**: tutorial interattivo già disponibile con F1, schermate evidenziate, spiegazioni e azioni campione.

## Cosa non viene emulato

È un **editor nel browser**, non una macchina virtuale né una copia funzionante del sistema operativo Windows 7. Le interazioni sono limitate all'interfaccia del programma: niente accesso al filesystem di Windows, controllo di finestre esterne o comandi di sistema. Le immagini della schermata iniziale sono originali e ispirate al linguaggio visivo Aero. Non sono inclusi suoni, DLL o artwork proprietari Microsoft.

## Verifiche

- `node --test tests/win7-desktop.test.js`: boot/skip/Esc, eventi, reduced motion, menu, asset JS/CSS e cache PWA.
- `node --test tests/win7-sound-pack.test.js`: mapping WAV e fallback.
- `tests/editor-layout-playwright.mjs`: screenshot e interazioni reali di boot, menu File, Start, Informazioni, desktop/shortcut, editor con vera titlebar 7.css, minimise/maximise e taskbar, oltre ai test desktop/mobile esistenti.
- `tests/studio-dashboard-browser.mjs` e `tests/editor-v5-browser.mjs` aspettano ora il completamento dell'avvio prima di inviare input alla UI.

### Note di compatibilità

- I browser possono trattenere il suono all'avvio per le restrizioni autoplay, e possono intercettare scorciatoie come Alt+F4 o il tasto Windows.
- L'accessibilità e gli utenti che hanno attivato `prefers-reduced-motion` prevalgono sulle animazioni.
- Screenshot e log della CI rimangono su GitHub Actions; è opportuno testare manualmente Safari e Firefox prima di pubblicare.
