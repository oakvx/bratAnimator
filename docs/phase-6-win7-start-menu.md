# Fase 6 — Menu Start di Windows 7 e navigazione locale

## Scopo

Rendere il desktop Brat Animator utilizzabile come una vera interfaccia Windows 7, oltre alle finestre già gestite da 7.css, senza introdurre dipendenze cloud o modificare il motore video.

## Implementazione

- Menu Start con finestra `window glass active` fornita da **7.css locale** e struttura a due colonne ispirata all'esplorazione di Windows 7.
- Logo autentico `favicon.svg`, utilizzato nel pulsante Start, nel menu e nelle finestre.
- Ricerca istantanea **esclusivamente locale** per parole chiave italiane, senza richieste HTTP né indicizzazione dei contenuti dei progetti. Ricerca insensibile a maiuscole/minuscole e accenti.
- Scorciatoie: nuovo progetto, editor, progetti, Sound Hub, BRATCODE, Home, impostazioni, account.
- Le voci del menu delegano alle API già esistenti (`BratStudio.show`, `studioNewProject`, `studioNavAccount`). Nessuna nuova gestione parallela di dati o credenziali.
- Apertura e chiusura con il pulsante Start; chiusura anche con Esc, clic esterno o passaggio a un'altra sezione.
- Ricerca raggiungibile subito all'apertura; Freccia giù/su per selezionare un risultato, Invio per attivarlo. Focus ripristinato al pulsante Start con Esc.
- Il menu funziona anche quando la finestra Brat Animator è ridotta a icona; l'apertura di un programma ripristina la finestra simulata.
- «Chiudi finestra» non chiude il browser, non esegue uno shutdown del dispositivo e non elimina file né progetti locali.
- Nel vero editor la taskbar e il menu Start non sono mostrati.
- Layout responsive anche sugli schermi stretti; il menu rimane sopra al desktop e sotto la taskbar.

## Persistenza e privacy

La Fase 6 non memorizza ricerche, non introduce telemetria e non richiede un account Supabase. Resta immutato il modello **local-first**: progetti e media sono nel browser e richiedono backup `.brat.zip` per il trasferimento. TikTok è ancora una funzionalità opzionale non attiva fino al deploy del relativo backend.

## Verifica

1. `node --test tests/win7-start-menu.test.js` — normalizzazione, ricerca, focus, uscita e routing locale.
2. `node --test` — regressione globale.
3. `node --check assets/js/win7-start-menu.js` — sintassi ES.
4. `CHROME_PATH=/usr/bin/google-chrome node tests/studio-dashboard-browser.mjs` — smoke Chrome su Start, ricerca, Sound Hub, icona ridotta e ripristino.
5. QA manuale su Safari iOS, in particolare menu con tastiera virtuale, ridimensionamento e ripristino focus.

Il service worker contiene lo script Start menu e un nuovo identificatore cache per aggiornare le installazioni PWA esistenti.
