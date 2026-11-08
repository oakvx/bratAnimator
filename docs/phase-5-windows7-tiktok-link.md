# Fase 5 — Windows 7 / TikTok Login Kit

## Ambito

- La dashboard applica la reale libreria 7.css v0.21.0 (MIT), distribuita integralmente in vendor/7css/7.scoped.css e caricata prima di assets/css/studio-win7.css. Componenti: window, glass, title-bar, title-bar-controls, window-body.
- I controlli Minimize, Maximize, Restore e Close modificano la finestra web simulata, non il browser o il sistema operativo. La taskbar riapre il programma.
- Utilizza il vero favicon.svg del repository, logo verde con scritta brat. Niente simboli sostitutivi, slogan o etichette artificiali.
- L'editor video conserva il proprio layout e i propri salvataggi. La dashboard è ispirata a Explorer di Windows 7; lo stile usa i componenti 7.css, senza redistribuire wallpaper Microsoft.
- Le finestre di autenticazione e registrazione sono accessibili anche se Supabase non è stato configurato, mostrando esplicitamente lo stato del servizio.

Riferimenti estetici (non incorporati come asset):
https://gekk.info/articles/explorer.html
https://www.isg.hest.ethz.ch/en/anleitungen/windows-specific-information/windows-7.html

## OAuth TikTok: architettura

1. Utente autenticato con Supabase Auth avvia il collegamento dalla dashboard.
2. Il browser crea una prova casuale in sessionStorage; la Supabase Edge Function verifica l'utente e genera uno state casuale con 256 bit di entropia. Nel database vengono salvati solo gli hash SHA-256, con TTL di 8 minuti.
3. Il browser viene reindirizzato all'endpoint ufficiale Login Kit Web TikTok, scope user.info.basic.
4. TikTok richiama la funzione HTTPS con code e state. Lo state viene consumato atomicamente e non può essere riutilizzato.
5. Solo la funzione server scambia il codice per access e refresh token, recupera il profilo e conserva temporaneamente i dati in una tabella privata (RLS). Un ticket casuale viene consegnato solo al browser del callback.
6. Il collegamento viene salvato dopo la verifica del JWT, della prova iniziale e del ticket al ritorno nell'app. Il browser riceve solo lo stato del collegamento e nome/avatar del profilo. Mai i token TikTok.
7. Scollega richiede una conferma e usa l'endpoint ufficiale di revoca. Il refresh token viene ruotato quando necessario.

## Configurazione necessaria prima di attivare TikTok

1. Configurare Supabase Auth in assets/js/supabase-config.js con URL e chiave pubblica publishable/anon.
2. Registrare una TikTok developer app con Login Kit for Web. Richiedere user.info.basic e impostare come redirect URI esatto:
   https://PROJECT_REF.supabase.co/functions/v1/tiktok-link
3. Applicare le migrazioni SQL `supabase/migrations/20261108000200_tiktok_link.sql` e `supabase/migrations/20261108000300_tiktok_login.sql`.
4. Distribuire la funzione supabase/functions/tiktok-link/index.ts con il nome tiktok-link. Nel file supabase/config.toml è specificato verify_jwt=false perché il callback GET non dispone di un JWT, ma possiede uno state CSRF monouso. Le richieste POST verificano comunque esplicitamente il JWT tramite Supabase Auth.
5. Impostare nel runtime Supabase (non nel codice pubblico) i secret TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI, BRAT_APP_ORIGIN e BRAT_APP_URL.
   Per GitHub Pages, BRAT_APP_ORIGIN = https://oakvx.github.io e BRAT_APP_URL = https://oakvx.github.io/bratAnimator/.
   SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere disponibili nell'ambiente server.
6. Solo dopo il test end-to-end con un account reale, impostare enabled: true nel file pubblico assets/js/tiktok-config.js.

Il client secret, i token TikTok e la service-role key non devono mai entrare nel repository statico o in localStorage/IndexedDB.

## Limiti di questa fase

- Il collegamento dalle impostazioni richiede una sessione Brat Animator. È ora disponibile anche l'accesso diretto con TikTok: vedi [configurazione Supabase e TikTok](supabase-tiktok-setup.md).
- Nessun upload o pubblicazione automatica dei video.
- L'accesso ai preferiti musicali TikTok non è garantito dalle API ufficiali.
- Non viene scaricata né replicata musica TikTok: il Sound Hub conserva file forniti dall'utente.
- La funzione TikTok rimane disattivata finché non vengono distribuiti e autorizzati i componenti lato provider.

## Test

- node --test
- node --check assets/js/win7-shell.js
- node --check assets/js/tiktok-link.js
- CHROME_PATH=/usr/bin/google-chrome node tests/studio-dashboard-browser.mjs

Restano necessari test manuali su Safari iOS, auth Supabase reale e OAuth TikTok, dopo configurazione del servizio.

## Correzione login e consolidamento CSS (novembre 2026)

La dashboard utilizza la distribuzione completa di 7.css fornita localmente, senza CDN. Sono stati dismessi i vecchi fogli di stile sovrapposti (studio-dashboard.css, aero-theme.css, classic-desktop.css, win7-app.css) e sostituiti da studio-win7.css.

Il login appariva come una schermata interamente sfocata perché il backdrop della modale era visibile ma 7.css nascondeva .window[role=dialog] in assenza della pseudoclasse :target. Il role=dialog / aria-modal=true è stato spostato al contenitore esterno che è controllato tramite hidden da JavaScript; la finestra 7.css interna è sempre visibile quando l'overlay è aperto. Nessun filtro blur viene più applicato al backdrop. Le tre modalità login, registrazione e codice email usano il componente Tabs nativo di 7.css con aria-selected sincronizzato.

Aggiornati il service worker, il caricamento offline e i test DOM + Chrome per intercettare questa regressione.
