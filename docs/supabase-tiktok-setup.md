# Supabase e accesso TikTok

Il codice è pronto per la configurazione, ma l'accesso rimane disattivato finché non vengono creati e configurati il progetto Supabase e l'app TikTok. L'editor resta utilizzabile come ospite. Nessun progetto, audio o video viene caricato su Supabase.

## 1. Crea il progetto Supabase

Nel dashboard Supabase crea un progetto e recupera **Project URL** e **Publishable key** dalla sezione Connect / API Keys. Modifica `assets/js/supabase-config.js`:

```js
window.BratSupabaseConfig = {
    url: "https://PROJECT_REF.supabase.co",
    publishableKey: "sb_publishable_INSERISCI_LA_CHIAVE_PUBBLICA"
};
```

Questi due valori sono pubblici. Non usare mai una chiave `sb_secret_…` o `service_role` nel frontend; il client rifiuta queste chiavi come configurazione valida, ma ciò non impedirebbe a una chiave pubblicata nel sorgente di essere esposta.

In **Authentication → URL Configuration** imposta:

- Site URL: `https://oakvx.github.io/bratAnimator/`
- Redirect URLs: `https://oakvx.github.io/bratAnimator/`

Se usi un dominio diverso, sostituiscilo in tutte le configurazioni. Abilita il provider Email per password, codici email e creazione della sessione TikTok. Per inviare email reali agli utenti configura un SMTP e un template con `{{ .Token }}` se vuoi usare il codice numerico. Il login TikTok non invia email e non richiede SMTP. Google rimane opzionale e richiede il proprio client OAuth.

## 2. Applica il database

Installa Node.js 22.13+ e usa la CLI ufficiale Supabase:

```powershell
npx supabase login
npx supabase link --project-ref PROJECT_REF
npx supabase db push
```

Le migrazioni hanno versioni distinte e vanno applicate in ordine:

1. `20261108000100_bratcode_light.sql`
2. `20261108000200_tiktok_link.sql`
3. `20261108000300_tiktok_login.sql`

In alternativa esegui i tre file nel SQL Editor, nell'ordine indicato. Su un progetto in cui hai già eseguito manualmente le vecchie migrazioni, verifica/allinea la cronologia con `supabase migration list` e `supabase migration repair` prima di usare `db push`; non applicare nuovamente alla cieca migrazioni già registrate. I nomi originali con lo stesso prefisso `20261108` sono stati separati perché la CLI richiede versioni univoche.

Le tabelle OAuth hanno RLS e nessun privilegio per `anon` o `authenticated`. Solo la funzione server con `service_role` può accedere a identità, stati e credenziali TikTok.

## 3. Crea l'app TikTok

Su [TikTok for Developers](https://developers.tiktok.com/) registra un'app e aggiungi **Login Kit for Web**, con scope `user.info.basic`. Configura il sito e registra questo redirect URI esatto:

```text
https://PROJECT_REF.supabase.co/functions/v1/tiktok-link
```

TikTok richiede un URI HTTPS, statico, senza query o frammenti. Completa le verifiche del sito e i requisiti mostrati nel portale. Usa gli account autorizzati dalla modalità sandbox durante lo sviluppo e richiedi l'approvazione necessaria per gli utenti di produzione. Non attivare il pulsante pubblico prima di avere un flusso funzionante.

## 4. Distribuisci la funzione

Copia `supabase/.env.example` in `supabase/.env` e inserisci i valori reali:

```dotenv
TIKTOK_CLIENT_KEY=chiave-della-app-tiktok
TIKTOK_CLIENT_SECRET=secret-della-app-tiktok
TIKTOK_REDIRECT_URI=https://PROJECT_REF.supabase.co/functions/v1/tiktok-link
BRAT_APP_ORIGIN=https://oakvx.github.io
BRAT_APP_URL=https://oakvx.github.io/bratAnimator/
```

`BRAT_APP_ORIGIN` contiene solo protocollo e host; `BRAT_APP_URL` include il percorso del sito. La funzione accetta richieste browser solo dall'origine configurata. Il file `.env` è ignorato da Git. Non aggiungerlo a cartelle pubbliche, artefatti del sito o commit.

```powershell
npx supabase secrets set --env-file supabase/.env
npx supabase functions deploy tiktok-link
```

Supabase fornisce automaticamente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` nel runtime della funzione. `verify_jwt = false` in `supabase/config.toml` permette al callback TikTok di raggiungerla. Le azioni di collegamento, stato e revoca continuano a verificare esplicitamente il JWT Supabase; le azioni `login` e `redeem` hanno una verifica dedicata dello stato e della prova browser.

## 5. Attiva e verifica

Modifica `assets/js/tiktok-config.js`:

```js
window.BratTikTokConfig = { enabled: true };
```

Pubblica i file statici, apri **Accedi / Registrati → Continua con TikTok** e verifica:

1. Da ospite vieni inviato alla schermata ufficiale TikTok.
2. Dopo il consenso torni all'app, il nome TikTok compare nel profilo e la libreria locale usa l'utente Supabase.
3. Ricaricando la pagina la sessione resta attiva. Dopo logout e un nuovo login con lo stesso TikTok ritrovi la stessa libreria sullo stesso browser.
4. Il rifiuto del consenso mostra un messaggio, senza creare una sessione.
5. Un ritorno aperto in un altro browser, scaduto o già utilizzato non consente l'accesso.
6. Un utente già autenticato può collegare TikTok dalle impostazioni e revocare il consenso con **Scollega**.

I progetti ospite e quelli dell'account restano separati; l'azione esistente di copia del progetto ospite permette il trasferimento esplicito. Un account email e uno TikTok non vengono uniti in base al nome o all'email: per usare TikTok sul proprio account email, collegarlo prima dalle impostazioni di quell'account.

## Funzionamento e limiti

Il browser conserva una prova casuale per otto minuti in `sessionStorage`; al server invia solo il suo hash SHA-256. La funzione genera lo stato OAuth casuale e ne conserva solo l'hash nel database. Il callback consuma lo stato una sola volta, verifica il profilo presso TikTok e associa `open_id` a un utente Supabase. Al ritorno consegna un secondo ticket casuale, il cui hash viene salvato sul server. Servono sia la prova del browser iniziale sia il ticket ricevuto dal callback per riscattare il risultato; questo protegge anche da link di autorizzazione inoltrati ad altre persone. Il browser riceve un token monouso Supabase e lo verifica con `verifyOtp` per creare la sessione. Anche il collegamento dalle impostazioni rimane in attesa finché il browser originale non conferma il ritorno con il proprio JWT e le due prove.

L'identità Supabase creata da TikTok usa un indirizzo tecnico sotto `identity.brat.invalid`; non è un'email di contatto o recupero. Nome e avatar provengono dal profilo ufficiale. Non vengono inventati indirizzi email reali e il browser non può scegliere l'utente da autenticare. L'associazione dell'identità resta dopo la revoca dei permessi TikTok, così un nuovo consenso riconduce alla stessa libreria; **Scollega** elimina le credenziali dal backend e tenta la revoca presso TikTok. Se il provider non conferma la revoca, l'interfaccia invita a verificarla dalle impostazioni privacy di TikTok. Non vengono eliminati l'account Supabase o i progetti locali. L'eliminazione completa dell'account va gestita dal titolare del servizio.

Il limite è di cinque avvii di login ogni dieci minuti per indirizzo di rete visto dal gateway; utenti sulla stessa rete possono condividere il limite. Gli stati scaduti vengono eliminati ai successivi avvii. I token TikTok rimangono nella tabella server `tiktok_connections`, mai nel frontend; lo SDK Supabase gestisce la propria sessione nel browser. Il sito statico non usa cookie di sessione HttpOnly: proteggi l'origine da script non affidabili e XSS.

Non sono inclusi pubblicazione automatica su TikTok, importazione di musica, sincronizzazione cloud dei progetti o recupero dell'account tramite email tecnica. Senza credenziali e approvazione provider, i test reali del consenso TikTok e dell'invio email rimangono da eseguire.

## Verifiche di sviluppo

```powershell
node --test
deno check supabase/functions/tiktok-link/index.ts
deno run --allow-read --allow-env --allow-sys tests/tiktok-database.mjs
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node tests/studio-dashboard-browser.mjs
```

I test Node esercitano client, callback, sessione e casi di abuso con servizi simulati. Il controllo SQL usa PostgreSQL in memoria tramite PGlite, senza un servizio remoto; lo script `supabase/tests/tiktok_auth.sql` è riutilizzabile su un database locale di test e annulla tutti i dati di prova. Il browser smoke controlla l'interfaccia reale con autenticazione non configurata. Non sostituiscono il collaudo con un progetto Supabase e un'app TikTok reali.

Riferimenti ufficiali: [TikTok Login Kit Web](https://developers.tiktok.com/docs/en/login-kit-web), [Supabase generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink), [Supabase verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp), [Supabase CLI](https://supabase.com/docs/reference/cli/introduction).
