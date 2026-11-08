# Backend Supabase: istruzioni operative

Il frontend di Brat Animator rimane statico e funziona senza account. Queste istruzioni sono **solo per l'amministratore** che desidera attivare login, BRATCODE e TikTok. Non attivare servizi da una PR né inserire credenziali segrete nel repository.

## 1. Istanza Supabase e Auth

1. Crea il progetto Supabase sotto il controllo del proprietario del sito.
2. In **Authentication → URL Configuration**, configura:
   - Site URL: `https://oakvx.github.io/bratAnimator/`
   - Redirect URL consentiti: `https://oakvx.github.io/bratAnimator/` e un origin localhost separato se usato in sviluppo
3. Abilita i provider necessari: email/password, OTP email e Google OAuth (Google richiede configurazione provider).
4. Configura la consegna email/SMTP, rate limiting e le opzioni di conferma secondo le policy del provider.
5. Configura **esclusivamente** i valori pubblici in `assets/js/supabase-config.js`:
   `url`: URL del progetto HTTPS; `publishableKey`: chiave pubblica publishable/anon.
6. Verifica sessione iniziale, iscrizione, conferma email, reset password e isolamenti tra libreria guest e account.

Non usare `SUPABASE_SERVICE_ROLE_KEY` nel browser, in `assets/js/supabase-config.js`, in un commit, in una issue o nella build Pages.

## 2. Migrazioni BRATCODE e TikTok

Le migrazioni versionate sono:

- `supabase/migrations/20261108_bratcode_light.sql`
- `supabase/migrations/20261108_tiktok_link.sql`

Distribuiscile con le modalità approvate per il progetto Supabase (SQL Editor / migrazioni CLI), **dopo un backup del database e una verifica dello schema**. Quindi esegui il controllo read-only:

```sql
-- Eseguire il contenuto completo di:
-- supabase/diagnostics/readiness.sql
```

Tutti i check della prima query devono essere `true` e i privilegi `anon_can_read` / `member_can_read` delle tabelle private devono essere `false`.

Le RPC BRATCODE rimangono configurate per importazione anonima con codici monouso/temporanei ad alta entropia. Abilita il rate limiting dell'API gateway e monitora errori e abuso senza memorizzare testi o credenziali nei log. Programma una cleanup giornaliera `SELECT public.bratcode_cleanup();` da un job privilegiato: non dal browser. Anche la funzione `public.tiktok_link_cleanup()` può essere richiamata da un job server periodico per rimuovere gli state scaduti.

## 3. TikTok Developer

- Registra la TikTok Developer App e richiedi Login Kit for Web, scope `user.info.basic`.
- Configura nel pannello TikTok il redirect URI **esatto**:
  `https://PROJECT_REF.supabase.co/functions/v1/tiktok-link`
- Distribuisci la funzione `supabase/functions/tiktok-link/index.ts` con il nome `tiktok-link`. In `supabase/config.toml` la verifica JWT della piattaforma è disattivata per il callback OAuth GET, che usa state CSRF monouso; il codice della funzione **verifica sempre esplicitamente l'utente** nelle richieste POST.
- Configura come **secret di runtime server**, non come file nel repository:

| Variabile | Descrizione |
| --- | --- |
| `TIKTOK_CLIENT_KEY` | Client key della Developer App |
| `TIKTOK_CLIENT_SECRET` | Client secret privato |
| `TIKTOK_REDIRECT_URI` | Redirect HTTPS della Edge Function (valore esatto) |
| `BRAT_APP_ORIGIN` | `https://oakvx.github.io` |
| `BRAT_APP_URL` | `https://oakvx.github.io/bratAnimator/` |
| `SUPABASE_URL` | URL server del progetto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Credenziale server privata gestita dal provider |

Con CLI Supabase autorizzata, la distribuzione tipica della funzione è:

```sh
supabase functions deploy tiktok-link --no-verify-jwt
```

Il comando richiede progetto correttamente collegato e autenticazione CLI dell'amministratore. Imposta i secret tramite il pannello di gestione o un canale protetto; evita di inserirli in shell history o file tracciati.

Infine esegui un test con account reali (autorizzazione, ritorno, refresh token, logout, revoca, stato fallito/annullato) e **solo dopo** modifica `assets/js/tiktok-config.js` impostando `enabled: true`. Se mancano provider o configurazione lascia `enabled: false`.

## 4. Validazione e criteri di produzione

- GitHub Actions: unit test, controllo sintassi, type-check Deno e nove suite browser Chrome verdi.
- Safari iOS e Firefox manuali, compresi importazione media e codec video.
- Testare BRATCODE da browser anonimo: creare, condividere via URL, precompilare il codice, **premere esplicitamente Importa**, revocare e verificare la scadenza.
- Non comunicare agli utenti che il login sincronizza i progetti: i dati media e gli snapshot restano IndexedDB locali.
- In caso di revoca TikTok non confermata, il backend elimina comunque i token propri, ma la UI chiede verifica della revoca nell'account TikTok.

Per l'elenco completo consultare `docs/phases-8-to-12-rollout.md`.
