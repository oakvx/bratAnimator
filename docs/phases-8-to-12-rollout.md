# Brat Animator — Fasi 8–12: rilascio e verifiche

**Stato:** implementazione applicativa in una PR unica, con verifiche automatizzate obbligatorie. Alcune funzioni con provider esterni **non** sono operative senza configurazione amministrativa e credenziali reali; non vanno annunciate come disponibili prima dei test E2E.

## Fase 8 — QA e stabilità

- **GitHub Actions** esegue `node --test`, i controlli `node --check` sui moduli, il type-check Deno dell'Edge Function TikTok e **nove suite browser Chrome** in job paralleli e indipendenti:
  `studio-dashboard`, `editor-v5`, `export-format`, `lyrics`, `motion`, `music-editor`, `natural-timing`, `project-assets`, `text-settings`.
- L'assenza di Chrome fallisce esplicitamente il job browser; non produce un falso successo.
- I test sono stati aggiornati per **aprire esplicitamente l'editor** dopo il bootstrap della dashboard Windows 7 e per interrogare **IndexedDB** (non il vecchio snapshot `localStorage`).
- Corretto il resize immediato dell'anteprima dopo modifiche alla risoluzione base; i preset rapidi aggiornano anche l'etichetta dimensioni. Corretto il ripristino della lingua dell'interfaccia e lo scroll delle impostazioni su mobile.
- Test di integrità controllano la presenza degli asset statici e la loro registrazione nella cache PWA, senza includere segreti.
- **Non sostituisce test manuali:** Safari iOS, Firefox, combinazioni di codec, dispositivi a bassa memoria, e autorizzazione dei media importati.

## Fase 9 — Account Supabase e recupero password

Il client supporta già email/password, registrazione, login OTP e OAuth Google. Questa fase aggiunge:

1. Tab **Password** nel dialog 7.css per richiedere il link di reset tramite `resetPasswordForEmail`, con messaggio che non rivela se l'indirizzo esiste.
2. Evento `PASSWORD_RECOVERY` propagato dal client Supabase per aprire il modulo di **nuova password**, con `updateUser` in una sessione autenticata.
3. Verifiche mock degli SDK per reset, aggiornamento password, redirect URL e isolamento della sessione guest.

### Requisiti amministrativi non ancora soddisfatti

- Creare/configurare un progetto Supabase e valorizzare **soltanto** URL pubblico e publishable key in `assets/js/supabase-config.js`.
- Impostare Site URL e redirect consentiti a `https://oakvx.github.io/bratAnimator/` (più localhost per sviluppo).
- Abilitare i provider email/password, email OTP e Google; configurare eventuale SMTP e consent screen.
- Eseguire E2E con account reali: signup/conferma, login, recupero password, logout, refresh, cambio account e verifica che la libreria guest resti separata.
- **Nessuna sincronizzazione automatica dei progetti tra dispositivi.** L'identità Supabase separa le librerie *locali*.

Non pubblicare una secret/service-role key nel codice o nella configurazione pubblica: l'unica chiave nel browser deve essere publishable/anon.

## Fase 10 — BRATCODE Light

- Codice server preesistente nelle RPC PostgreSQL `bratcode_create`, `bratcode_active`, `bratcode_revoke`, `bratcode_import` e `bratcode_cleanup` (migrazione `20261108201634_bratcode_light.sql`).
- Nuovo **Copia link**: URL con identificatore opaco temporaneo nel fragment `#bratcode=...`, vincolato all'origine e al percorso dell'app.
- Apertura link: precompilazione del codice e **conferma esplicita** all'importazione; nessun download o sostituzione automatica. Rimozione del fragment dalla barra dell'indirizzo dopo la lettura.
- Il formato trasporta **solo** struttura e testo del progetto; file media, token e riferimenti browser-local vengono eliminati dal payload.
- Test unitari su validazione URL, sanitizzazione profonda e RPC simulate. Verifica metadata SQL in `supabase/diagnostics/readiness.sql`.

### Prima dell'uso pubblico

1. Eseguire la migrazione in Supabase.
2. Controllare RLS, grant, `SECURITY DEFINER` e RPC esposte, usando `supabase/diagnostics/readiness.sql`.
3. Applicare **rate limiting sul gateway/API**, non affidarsi esclusivamente al contatore SQL basato su header potenzialmente manipolabili.
4. Pianificare dal lato server `SELECT public.bratcode_cleanup();` in job privilegiato (ad es. pg_cron, se disponibile) con frequenza giornaliera.
5. Testare generazione autenticata, importazione anonima da altro browser, revoca, scadenza 24h, limite dimensioni e risposte a tentativi ripetuti.

## Fase 11 — TikTok Login Kit

Il client e la funzione Deno erano già predisposti. Hardening aggiunto:

- La configurazione richiede redirect OAuth HTTPS sull'**esatto endpoint Supabase** della funzione, non su origini arbitrarie.
- Il POST richiede `application/json` e **massimo 1 KiB di body effettivamente letto**, anche senza `Content-Length`.
- Lo scollegamento elimina i token dal vault server anche se la revoca remota non risponde; la UI distingue tra **revoca confermata presso TikTok** e **rimozione solo locale**. Se la revoca remota non riesce, l'utente deve verificare le autorizzazioni direttamente nelle impostazioni TikTok.
- Test sul client JWT, configurazione fail-closed e contratto di revoca; type-check Deno in CI.

### Prima di attivare `enabled: true`

1. Ottenere una TikTok Developer App e l'autorizzazione a **Login Kit for Web** con scope minimo `user.info.basic`.
2. Creare e verificare un progetto Supabase, le migrazioni SQL e i relativi permessi.
3. Distribuire `supabase/functions/tiktok-link/index.ts` con `verify_jwt=false`: il callback GET usa lo **state CSRF monouso**. Le azioni di collegamento, stato e revoca richiedono il JWT Supabase; l'accesso TikTok da ospite usa la prova del browser e un ticket monouso. Vedi la [guida aggiornata Supabase e TikTok](supabase-tiktok-setup.md).
4. Configurare **esclusivamente nel runtime server** `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`, `BRAT_APP_ORIGIN`, `BRAT_APP_URL`, oltre alle credenziali server Supabase gestite dal provider.
5. Testare reale login, callback, stato collegato, refresh, scollegamento e revoca dall'app TikTok.
6. Solo dopo l'E2E impostare `enabled: true` in `assets/js/tiktok-config.js`.

Il collegamento TikTok non implementa pubblicazione video automatica né download di audio/preferiti; le relative API e autorizzazioni sono prodotti distinti.

## Fase 12 — Editor

- Aggiunto `assets/js/editor-templates.js`, un modulo separato, testabile e senza accesso ai media, che applica con un clic quattro preset: **Brat Classic**, **Kinetic Reels**, **Cinematic** e **Music Scroll**.
- I preset impiegano le select/eventi già usati dall'editor, validano preventivamente le opzioni e lasciano immutati testi, file locali, account e destinazioni di export.
- Nuova galleria accessibile nella scheda **Design**, responsive, con conferma di applicazione e test DOM reali.
- Il refactoring dell'intero `assets/js/app.js` (diverse migliaia di righe) è un intervento strutturale futuro da affrontare per componenti e con test di parità, non con una riscrittura in blocco a rischio di perdita dati.

## Checklist di accettazione manuale

- [ ] Windows desktop Chrome/Firefox: import LRC e audio, anteprima, timeline, export MP4/WebM/PNG e package `.brat.zip` reimportato.
- [ ] Safari iOS: menu Start, login modale, orientamento, safe areas, tastiera virtuale e codec disponibili.
- [ ] Browser pulito → creazione progetto → chiusura e riapertura → recupero autosave e assets.
- [ ] Archivio pieno 20+1 e promozione progetto temporaneo senza sovrascritture.
- [ ] Browser in modalità offline: shell, script e progetto precedentemente salvato, con aggiornamento service worker.
- [ ] Profilo login configurato realmente e password recovery completata.
- [ ] BRATCODE valido/scaduto/revocato e importazione cross-browser.
- [ ] TikTok auth, refresh, errori, revoca remota e rimozione locale, **solo dopo** attivazione provider.
- [ ] Verifica di accessibilità tastiera (Tab/Esc), pref. reduced motion e nessuno scroll orizzontale a 320/390px.
- [ ] Nessuna chiave segreta, credenziale, log di token o dati media esfiltrati.

## Note di rilascio

L'app statica è ospitata su GitHub Pages; la CI riguarda l'implementazione nel branch, non fornisce automaticamente un'istanza configurata di Supabase/TikTok. Dopo approvazione e merge, monitorare il workflow Pages e ripetere le prove operative sopra. La libreria IndexedDB può essere cancellata dal browser: preservare backup `.brat.zip` indipendenti.
