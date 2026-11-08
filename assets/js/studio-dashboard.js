/* Brat Animator Phase 2 — responsive Creator Studio UI and account flows. */
(function () {
    "use strict";
    const $ = id => document.getElementById(id);
    const editor = window.BratEditorWorkspace;
    const auth = window.BratAuth;
    const dashboard = $("studioDashboard");
    if (!dashboard || !editor || !auth) return;

    let view = "home";
    let authMode = "login";
    let sentCode = false;
    let busy = false;
    let authChanging = Promise.resolve();
    let currentUserId = null;
    let initialSessionHandled = false;
    let pendingProjectAction = null;
    let activeCode = null;
    let recoveryPending = false;

    function notify(message, isError = false) {
        const node = $("studioNotice");
        node.hidden = !message;
        node.textContent = message || "";
        node.dataset.error = String(isError);
    }

    function authMessage(message, error = false) {
        const node = $("studioAuthMessage");
        node.textContent = message || "";
        node.classList.toggle("is-error", error);
    }

    function formatDate(value) {
        if (!value) return "Salvato in locale";
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? "Salvato in locale" :
            new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(d);
    }

    function labelFromPayload(payload, fallback = "Progetto senza titolo") {
        const lyrics = String(payload?.lyrics || "");
        const line = lyrics.split(/\r?\n/).map(text => text.replace(/^\[[^\]]+\]\s*/, "").trim()).find(Boolean);
        return String(fallback && fallback !== "Untitled project" ? fallback : payload?.metadata?.trackName || line || fallback).slice(0, 62);
    }

    function setMode(mode) {
        authMode = mode;
        sentCode = false;
        const updatingPassword = mode === "new-password";
        const requestingReset = mode === "reset";
        $("studioAuthEmail").disabled = updatingPassword;
        if (updatingPassword && auth.user()?.email) $("studioAuthEmail").value = auth.user().email;
        $("studioAuthCodeWrap").hidden = true;
        $("studioAuthCode").value = "";
        $("studioAuthPasswordWrap").hidden = mode === "otp" || requestingReset;
        $("studioAuthPasswordLabel").textContent = updatingPassword ? "Nuova password" : "Password";
        $("studioAuthPassword").autocomplete = (mode === "register" || updatingPassword) ? "new-password" : "current-password";
        $("studioAuthSubmit").textContent = updatingPassword ? "Salva nuova password" :
            requestingReset ? "Invia link di recupero" :
            mode === "register" ? "Crea account" : mode === "otp" ? "Invia codice" : "Accedi";
        $("studioAuthTitle").textContent = updatingPassword ? "Scegli una nuova password" : "Accedi a Brat Animator";
        document.querySelectorAll("[data-auth-mode]").forEach(button => {
            const selected = button.dataset.authMode === (updatingPassword ? "reset" : mode);
            button.classList.toggle("is-active", selected);
            button.setAttribute("aria-selected", String(selected));
        });
        authMessage(updatingPassword ? "Inserisci una nuova password di almeno 8 caratteri." : "");
    }

    function showAuth(mode = "login") {
        $("studioAuthDialog").hidden = false;
        $("studioAuthSetup").hidden = auth.configured();
        $("studioAuthTikTokSetup").hidden = Boolean(window.BratTikTokLogin?.configured());
        $("studioAuthTikTok").disabled = !window.BratTikTokLogin?.configured();
        setMode(typeof mode === "string" ? mode : "login");
        (authMode === "new-password" ? $("studioAuthPassword") : $("studioAuthEmail")).focus();
    }

    function closeAuth() { $("studioAuthDialog").hidden = true; }
    function closeLogout() { $("studioLogoutDialog").hidden = true; }

    function profile() {
        const user = auth.user();
        const label = (user?.app_metadata?.tiktok_open_id
            ? user.user_metadata?.display_name || "Account TikTok" : user?.email) || "Accedi / Registrati";
        $("studioNavIdentity").textContent = label;
        $("studioAvatar").textContent = user ? label.slice(0, 1).toUpperCase() : "G";
        $("studioGreeting").textContent = user
            ? label + " · archivio locale"
            : "Archivio locale · modalità ospite";
        $("studioAccountButton").textContent = user ? "Il mio account" : "Accedi / Registrati";
        $("studioAccountDescription").textContent = user
            ? "Accesso effettuato con " + label + ". I progetti non sono sincronizzati online."
            : "Stai utilizzando Brat Animator come ospite. Non è necessario un account per creare o esportare video.";
        $("studioSettingsLogin").hidden = Boolean(user);
        $("studioSettingsLogout").hidden = !user;
    }

    function makeProjectCard(record, payload, parent, showTools = true) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "studio-project-card";
        const art = document.createElement("div");
        art.className = "studio-project-art";
        const bgColor = payload?.style?.bgColor;
        if (/^#[a-f0-9]{6}$/i.test(bgColor || "")) art.style.backgroundColor = bgColor;
        const titleText = labelFromPayload(payload, record.title);
        const artText = document.createElement("span");
        artText.textContent = titleText;
        const artCaption = document.createElement("small");
        artCaption.textContent = payload?.formatPreset || "brat animator";
        art.append(artText, artCaption);
        const info = document.createElement("div");
        info.className = "studio-project-info";
        const name = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = titleText;
        const date = document.createElement("small");
        date.textContent = formatDate(record.updatedAt);
        name.append(strong, date);
        const arrow = document.createElement("span");
        arrow.textContent = "↗";
        info.append(name, arrow);
        card.append(art, info);
        card.setAttribute("aria-label", "Apri " + titleText);
        card.addEventListener("click", () => openProject(record.projectId));
        const entry = document.createElement("div");
        entry.className = "studio-project-entry";
        entry.append(card);
        const tools = document.createElement("div");
        tools.className = "studio-project-actions";
        const rename = document.createElement("button");
        rename.type = "button";
        rename.textContent = "Rinomina";
        rename.setAttribute("aria-label", "Rinomina " + titleText);
        rename.addEventListener("click", () => openProjectDialog("rename", record, titleText));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Elimina";
        remove.setAttribute("aria-label", "Elimina " + titleText);
        remove.addEventListener("click", () => openProjectDialog("delete", record, titleText));
        tools.append(rename, remove);
        if (record.kind === "temporary") {
            const promote = document.createElement("button");
            promote.type = "button";
            promote.textContent = "Salva in libreria";
            promote.addEventListener("click", promoteTemporary);
            tools.prepend(promote);
            const tag = document.createElement("small");
            tag.className = "studio-temporary-label";
            tag.textContent = "TEMPORANEO · recupero locale";
            art.prepend(tag);
        }
        if (showTools) entry.append(tools);
        parent.append(entry);
    }

    function makeEmpty(message) {
        const placeholder = document.createElement("div");
        placeholder.className = "studio-empty";
        const heading = document.createElement("strong");
        heading.textContent = "Nessun progetto salvato";
        const text = document.createElement("span");
        text.textContent = message;
        placeholder.append(heading, text);
        return placeholder;
    }

    async function renderProjects() {
        await editor.whenReady();
        const target = $("studioProjectList");
        const recent = $("studioRecentProjects");
        target.replaceChildren();
        recent.replaceChildren();
        if (!editor.store) {
            target.append(makeEmpty("Il browser non supporta IndexedDB."));
            recent.append(makeEmpty("Puoi comunque utilizzare l'editor e scaricare un backup."));
            return;
        }
        try {
            const records = await editor.store.listProjects(editor.owner());
            const ordered = records.sort((a, b) => (a.kind === "temporary" ? -1 : 0) - (b.kind === "temporary" ? -1 : 0) || b.updatedAt - a.updatedAt);
            const totals = await editor.store.stats();
            $("studioProjectCount").textContent = totals.saved + "/20 progetti salvati globalmente · " + totals.temporary + "/1 temporaneo · " + records.length + " qui";
            const search = ($("studioProjectSearch")?.value || "").trim().toLowerCase();
            if (!ordered.length) {
                target.append(makeEmpty("Crea il tuo primo progetto nell'editor."));
                recent.append(makeEmpty("Inizia con un nuovo lyric video."));
            } else {
                const entries = await Promise.all(ordered.map(async row => ({
                    row, project: await editor.store.getProject(editor.owner(), row.projectId)
                })));
                for (const { row, project } of entries) {
                    if (search && !labelFromPayload(project?.payload, row.title).toLowerCase().includes(search)) continue;
                    makeProjectCard(row, project?.payload, target);
                }
                for (const { row, project } of entries.slice(0, 3)) {
                    makeProjectCard(row, project?.payload, recent, false);
                }
            }
            const usage = await editor.store.estimateStorage();
            $("studioStorageUsage").textContent = usage?.usage != null && usage?.quota != null
                ? "Spazio usato: " + (usage.usage / (1024 * 1024)).toFixed(1) + " MiB su circa " + (usage.quota / (1024 * 1024)).toFixed(0) + " MiB disponibili nel browser."
                : "Stima dello spazio non disponibile in questo browser.";
            const user = auth.user();
            const guestProject = user ? await editor.store.getActive("guest") : null;
            const targetProject = user ? await editor.store.getActive(editor.owner()) : null;
            $("studioGuestTransfer").hidden = !(guestProject && !targetProject);
            $("studioContinue").textContent = ordered.length ? "Riprendi progetto" : "Apri editor";
            updateBackupReminder();
        } catch (error) {
            target.append(makeEmpty("Impossibile leggere la libreria locale."));
            recent.append(makeEmpty("Apri l'editor per continuare."));
            notify("Errore nell'archivio locale: " + error.message, true);
        }
    }

    function openProjectDialog(action, record, title) {
        pendingProjectAction = { action, record, title };
        $("studioProjectDialog").hidden = false;
        $("studioProjectDialogError").textContent = "";
        $("studioProjectDialogTitle").textContent = action === "rename" ? "Rinomina progetto" : "Elimina progetto";
        $("studioProjectDialogDescription").textContent = action === "rename"
            ? "Modifica il nome nella tua libreria locale senza cambiare il progetto."
            : "Il progetto verrà eliminato da questo browser. Prima di continuare, verifica di avere un backup .brat.zip.";
        $("studioProjectRenameField").hidden = action !== "rename";
        $("studioProjectDialogConfirm").textContent = action === "rename" ? "Salva nome" : "Elimina definitivamente";
        $("studioProjectDialogConfirm").classList.toggle("studio-delete-button", action === "delete");
        $("studioProjectDialogConfirm").classList.toggle("studio-accent-button", action !== "delete");
        $("studioProjectRenameInput").value = title;
        (action === "rename" ? $("studioProjectRenameInput") : $("studioProjectDialogConfirm")).focus();
    }

    function closeProjectDialog() {
        pendingProjectAction = null;
        $("studioProjectDialog").hidden = true;
    }

    async function confirmProjectDialog() {
        if (busy || !pendingProjectAction) return;
        const { action, record } = pendingProjectAction;
        busy = true;
        $("studioProjectDialogConfirm").disabled = true;
        try {
            if (action === "rename") {
                const title = $("studioProjectRenameInput").value.trim();
                if (!title) throw new Error("Inserisci un nome per il progetto.");
                await editor.renameProject(record.projectId, title);
                notify("Progetto rinominato.");
            } else {
                await editor.deleteProject(record.projectId);
                notify("Progetto eliminato dalla libreria locale.");
            }
            closeProjectDialog();
            await renderProjects();
        } catch (error) {
            $("studioProjectDialogError").textContent = error.message;
        } finally {
            busy = false;
            $("studioProjectDialogConfirm").disabled = false;
        }
    }

    async function promoteTemporary() {
        if (busy) return;
        busy = true;
        try {
            if (editor.projectId() !== "temporary") {
                await editor.openProject("temporary");
            }
            await editor.promoteTemporary();
            notify("Progetto temporaneo salvato nella libreria.");
            await renderProjects();
        } catch (error) {
            notify("Impossibile salvare il temporaneo: " + error.message + " Elimina prima un progetto o esporta un backup.", true);
        } finally { busy = false; }
    }

    function updateBackupReminder() {
        const reminder = window.BratBackupReminders;
        const banner = $("studioBackupReminder");
        if (!banner || !reminder) return;
        const temporary = editor.projectId?.() === "temporary";
        const due = reminder.shouldRemind(editor.owner(), editor.projectId?.());
        banner.hidden = !(temporary || due);
        if (!banner.hidden) {
            banner.firstChild.textContent = temporary
                ? "Questo progetto è temporaneo. Esporta una copia .brat.zip; per salvarlo in libreria libera prima uno slot. "
                : "Hai modificato il progetto senza un backup recente. Esporta una copia .brat.zip per conservarlo fuori dal browser. ";
        }
    }

    function exportBackup() {
        const button = $("exportPackageBtn");
        if (!button) {
            notify("La funzione di backup completo non è disponibile.", true);
            return;
        }
        button.click();
        notify("Esportazione del backup avviata. Il browser salverà un file .brat.zip.");
    }

    function importBundle() {
        const input = $("importPackageInput");
        if (!input) return notify("Importazione .brat.zip non disponibile.", true);
        input.addEventListener("change", () => viewSwitch("editor"), { once: true });
        input.click();
    }

    function renderCodeState() {
        const element = $("studioShareState");
        const backendReady = Boolean(window.BratCode && auth.configured());
        const user = auth.user();
        $("studioCodeCreate").disabled = !backendReady || !user || Boolean(activeCode);
        $("studioCodeCopy").hidden = !activeCode;
        $("studioCodeCopyLink").hidden = !activeCode;
        $("studioCodeRevoke").hidden = !activeCode;
        if (!backendReady) {
            element.textContent = "Condivisione cloud non configurata. L'editor e i backup locali rimangono disponibili.";
        } else if (!user) {
            element.textContent = "Accedi per generare un BRATCODE. Puoi comunque importare un codice come ospite.";
        } else if (activeCode?.code) {
            const expires = new Date(activeCode.expires_at);
            element.textContent = "Codice attivo: " + window.BratCode.prettyCode(activeCode.code) +
                " · Scadenza " + formatDate(expires);
        } else {
            element.textContent = "Nessun codice attivo. Il progetto JSON verrà archiviato temporaneamente sul server per 24 ore.";
        }
    }

    async function refreshCode() {
        activeCode = null;
        renderCodeState();
        if (!window.BratCode || !auth.configured() || !auth.user()) return;
        try {
            activeCode = await window.BratCode.getActive();
            renderCodeState();
        } catch (error) {
            $("studioShareState").textContent = "BRATCODE non disponibile: " + error.message +
                ". Verifica la migrazione SQL su Supabase.";
        }
    }

    async function createCode() {
        if (busy) return;
        busy = true;
        $("studioCodeCreate").disabled = true;
        try {
            await editor.flush();
            const payload = editor.snapshot();
            activeCode = await window.BratCode.create(payload);
            renderCodeState();
            $("studioCodeMessage").textContent = "Codice creato. Puoi copiarlo e condividerlo per 24 ore.";
        } catch (error) {
            $("studioCodeMessage").textContent = "Impossibile creare BRATCODE: " + error.message;
        } finally { busy = false; renderCodeState(); }
    }

    async function copyCode() {
        if (!activeCode) return;
        const code = window.BratCode.prettyCode(activeCode.code);
        try {
            await navigator.clipboard.writeText(code);
            $("studioCodeMessage").textContent = "BRATCODE copiato negli appunti.";
        } catch (_) {
            $("studioCodeMessage").textContent = "Copia manualmente il codice visualizzato: " + code;
        }
    }

    async function copyCodeLink() {
        if (!activeCode) return;
        try {
            const url = window.BratCode.shareLink(activeCode.code);
            await navigator.clipboard.writeText(url);
            $("studioCodeMessage").textContent = "Link temporaneo copiato. Chi lo apre dovrà confermare l'importazione.";
        } catch (error) {
            $("studioCodeMessage").textContent = "Non riesco a copiare il link: " + error.message;
        }
    }

    async function revokeCode() {
        if (!activeCode || busy) return;
        busy = true;
        try {
            await window.BratCode.revoke();
            activeCode = null;
            $("studioCodeMessage").textContent = "Codice revocato. Non è più utilizzabile.";
            renderCodeState();
        } catch (error) {
            $("studioCodeMessage").textContent = "Revoca non riuscita: " + error.message;
        } finally { busy = false; }
    }

    async function importCode() {
        if (busy) return;
        busy = true;
        $("studioCodeImport").disabled = true;
        try {
            if (!window.BratCode) throw new Error("BRATCODE non disponibile.");
            const payload = await window.BratCode.importCode($("studioCodeInput").value);
            const result = await editor.restoreImportedPayload(payload);
            $("studioCodeMessage").textContent = "Progetto importato. Riassocia eventuali file audio, immagini e font mancanti.";
            if (result.temporary) notify("Libreria piena: BRATCODE importato come progetto temporaneo con autosave.");
            viewSwitch("editor");
        } catch (error) {
            $("studioCodeMessage").textContent = "Importazione non riuscita: " + error.message;
        } finally {
            busy = false;
            $("studioCodeImport").disabled = false;
        }
    }

    function viewSwitch(next) {
        view = next;
        const editorOpen = next === "editor";
        document.body.classList.toggle("studio-dashboard-open", !editorOpen);
        document.body.classList.toggle("studio-editor-open", editorOpen);
        $("studioHomeView").hidden = next !== "home";
        $("studioProjectsView").hidden = next !== "projects";
        $("studioSettingsView").hidden = next !== "settings";
        $("studioShareView").hidden = next !== "share";
        $("studioSoundsView").hidden = next !== "sounds";
        $("studioFutureView").hidden = true;
        $("studioTitle").textContent = ({
            home: "Home",
            projects: "Progetti",
            sounds: "Sound Hub",
            share: "BRATCODE",
            settings: "Impostazioni",
            editor: "Editor"
        })[next] || "Brat Animator";
        if (next !== "editor") {
            window.dispatchEvent(new CustomEvent("brat:studio-view", { detail: { view: next } }));
        }
        if (next === "share") refreshCode().catch(error => notify(error.message, true));


    document.querySelectorAll("[data-studio-view]").forEach(button => {
            const active = button.dataset.studioView === next;
            button.classList.toggle("is-active", active);
            if (active) button.setAttribute("aria-current", "page");
            else button.removeAttribute("aria-current");
        });
        if (!editorOpen) {
            editor.pause();
            renderProjects().catch(error => notify(error.message, true));
        } else {
            window.BratEnterEditor?.();
            // Recompute canvas placement after returning from a hidden view.
            window.dispatchEvent(new Event("resize"));
        }
        window.scrollTo?.({ top: 0, behavior: "instant" });
    }

    async function openProject(projectId) {
        if (busy) return;
        busy = true;
        try {
            await editor.openProject(projectId);
            viewSwitch("editor");
        } catch (error) {
            notify("Non riesco ad aprire il progetto: " + error.message, true);
        } finally { busy = false; }
    }

    async function createProject() {
        if (busy) return;
        busy = true;
        try {
            const result = await editor.createNew();
            if (result?.temporary) notify("Libreria piena: stai lavorando nell'unico progetto temporaneo con autosave. Esporta un backup prima di chiudere il browser.");
            viewSwitch("editor");
        } catch (error) {
            notify("Non è possibile creare il progetto: " + error.message + " Puoi esportare o eliminare un vecchio progetto.", true);
        } finally { busy = false; }
    }

    async function submitAuth(event) {
        event.preventDefault();
        if (busy) return;
        const email = $("studioAuthEmail").value.trim();
        const password = $("studioAuthPassword").value;
        const code = $("studioAuthCode").value.trim();
        if (authMode !== "new-password" && (!email || !$("studioAuthEmail").checkValidity())) {
            authMessage("Inserisci un indirizzo email valido.", true); return;
        }
        if (!auth.configured()) {
            authMessage("Il servizio account non è ancora configurato. Puoi continuare come ospite.", true); return;
        }
        if (!["otp", "reset"].includes(authMode) && password.length < 8) {
            authMessage("La password deve contenere almeno 8 caratteri.", true); return;
        }
        busy = true;
        $("studioAuthSubmit").disabled = true;
        authMessage("Operazione in corso…");
        try {
            if (authMode === "new-password") {
                if (!recoveryPending) throw new Error("Apri il link di recupero ricevuto via email.");
                await auth.updatePassword(password);
                recoveryPending = false;
                closeAuth();
                notify("Password aggiornata. La sessione rimane attiva sul dispositivo.");
            } else if (authMode === "reset") {
                await auth.requestPasswordReset(email);
                authMessage("Se l'indirizzo è registrato, riceverai un link per cambiare password.");
            } else if (authMode === "register") {
                const data = await auth.signUp(email, password);
                authMessage(data?.session ? "Registrazione completata." : "Controlla la tua email per confermare la registrazione.");
            } else if (authMode === "login") {
                await auth.signInWithPassword(email, password);
                authMessage("Accesso completato.");
            } else if (!sentCode) {
                await auth.sendCode(email);
                sentCode = true;
                $("studioAuthCodeWrap").hidden = false;
                $("studioAuthSubmit").textContent = "Verifica codice";
                authMessage("Codice inviato. Controlla la tua email (anche spam).");
                $("studioAuthCode").focus();
            } else {
                if (!/^[0-9]{6,8}$/.test(code)) {
                    authMessage("Inserisci il codice numerico ricevuto.", true); return;
                }
                await auth.verifyCode(email, code);
                authMessage("Accesso completato.");
            }
        } catch (error) { authMessage(error.message || "Autenticazione non riuscita.", true); }
        finally { busy = false; $("studioAuthSubmit").disabled = false; }
    }

    async function googleLogin() {
        if (!auth.configured()) {
            authMessage("Configura Supabase e il provider Google prima di utilizzare questo accesso.", true); return;
        }
        if (busy) return;
        busy = true;
        try { await auth.signInWithGoogle(); }
        catch (error) { authMessage(error.message, true); }
        finally { busy = false; }
    }

    async function tiktokLogin() {
        if (busy) return;
        busy = true;
        $("studioAuthTikTok").disabled = true;
        authMessage("Apertura accesso TikTok…");
        try { await auth.signInWithTikTok(); }
        catch (error) { authMessage(error.message || "Accesso TikTok non riuscito.", true); }
        finally {
            busy = false;
            $("studioAuthTikTok").disabled = !window.BratTikTokLogin?.configured();
        }
    }

    async function transferGuest() {
        if (busy || !auth.user() || !editor.store) return;
        busy = true;
        try {
            await editor.flush();
            const owner = editor.owner();
            const existing = await editor.store.getActive(owner);
            if (existing) throw new Error("C'è già un progetto attivo: prima esportalo o archiviane una copia.");
            const guest = await editor.store.getActive("guest");
            if (!guest) throw new Error("Non ci sono progetti ospite da copiare.");
            await editor.store.saveActive(guest.payload, owner);
            await editor.reloadActive();
            notify("Progetto ospite copiato nel tuo account locale. L'originale è rimasto nella libreria ospite.");
            await renderProjects();
        } catch (error) { notify(error.message, true); }
        finally { busy = false; }
    }

    async function doLogout(remove) {
        if (busy) return;
        if (remove && !window.confirm("Confermi l'eliminazione definitiva dei progetti locali di questo account? Senza backup non potrai recuperarli.")) return;
        busy = true;
        $("studioLogoutMessage").textContent = "Chiusura sessione…";
        try {
            await editor.flush();
            if (remove) {
                if (!editor.store) throw new Error("Archivio locale non disponibile.");
                await editor.deleteOwnerProjects();
            }
            await auth.signOut();
            closeLogout();
            notify(remove ? "Sessione chiusa. I progetti locali dell'account sono stati eliminati." : "Sessione chiusa. I progetti locali sono stati conservati.");
        } catch (error) {
            $("studioLogoutMessage").textContent = "Impossibile uscire: " + error.message;
        } finally { busy = false; }
    }

    // Only the current authenticated identity determines which local owner is loaded.
    function queueAuthChange(user) {
        const nextId = user?.id || null;
        authChanging = authChanging.catch(() => {}).then(async () => {
            // INITIAL_SESSION/getSession and token refresh may repeat the same
            // identity. Refresh the profile without interrupting the open view.
            if (initialSessionHandled && nextId === currentUserId) {
                profile();
                return;
            }
            const owner = nextId ? "user:" + nextId : "guest";
            if (owner !== editor.owner()) await editor.switchOwner(owner);
            currentUserId = nextId;
            profile();
            await renderProjects();
            if (view === "share") refreshCode().catch(() => {});
            const isFirst = !initialSessionHandled;
            initialSessionHandled = true;
            if (user && (isFirst || view !== "editor")) {
                const project = editor.store && await editor.store.getActive(owner);
                viewSwitch(project ? "editor" : "home");
            } else if (!user && !isFirst) {
                viewSwitch("home");
            }
            if (user && !recoveryPending) closeAuth();
        }).catch(error => notify("Impossibile cambiare libreria: " + error.message, true));
    }

    // Register dashboard controls exactly once. View transitions must never
    // add duplicate listeners (especially destructive project actions).
        $("studioProjectSearch")?.addEventListener("input", () => renderProjects().catch(error => notify(error.message, true)));
    $("studioProjectDialogClose").addEventListener("click", closeProjectDialog);
    $("studioProjectDialogCancel").addEventListener("click", closeProjectDialog);
    $("studioProjectDialogConfirm").addEventListener("click", confirmProjectDialog);
    $("studioProjectRenameInput").addEventListener("keydown", event => {
        if (event.key === "Enter") { event.preventDefault(); confirmProjectDialog(); }
    });
    $("studioBackupActive").addEventListener("click", exportBackup);
    $("studioBackupNow").addEventListener("click", exportBackup);
    $("studioImportBundle").addEventListener("click", importBundle);
    $("studioBackupDismiss").addEventListener("click", () => {
        window.BratBackupReminders?.dismiss(editor.owner(), editor.projectId?.());
        updateBackupReminder();
    });
    $("studioCodeCreate").addEventListener("click", createCode);
    $("studioCodeCopy").addEventListener("click", copyCode);
    $("studioCodeCopyLink").addEventListener("click", copyCodeLink);
    $("studioCodeRevoke").addEventListener("click", revokeCode);
    $("studioCodeImport").addEventListener("click", importCode);
    window.addEventListener("brat:backup-exported", () => {
        notify("Backup completo esportato. Conserva il file .brat.zip al sicuro.");
        updateBackupReminder();
    });
    window.addEventListener("brat:project-imported", () => {
        notify("Progetto .brat.zip importato.");
        viewSwitch("editor");
    });
    window.addEventListener("brat:backup-reminder-state", updateBackupReminder);

    document.querySelectorAll("[data-studio-view]").forEach(button =>
        button.addEventListener("click", () => viewSwitch(button.dataset.studioView)));
    $("studioContinue").addEventListener("click", () => viewSwitch("editor"));
    $("studioNewProject").addEventListener("click", createProject);
    $("studioProjectsNew").addEventListener("click", createProject);
    $("studioAccountButton").addEventListener("click", () => auth.user() ? viewSwitch("settings") : showAuth());
    $("studioNavAccount").addEventListener("click", () => auth.user() ? viewSwitch("settings") : showAuth());
    $("studioSettingsLogin").addEventListener("click", showAuth);
    $("studioSettingsLogout").addEventListener("click", () => { $("studioLogoutMessage").textContent = ""; $("studioLogoutDialog").hidden = false; });
    $("studioAuthClose").addEventListener("click", closeAuth);
    $("studioAuthGuest").addEventListener("click", closeAuth);
    $("studioLogoutCancelX").addEventListener("click", closeLogout);
    $("studioLogoutCancel").addEventListener("click", closeLogout);
    $("studioLogoutKeep").addEventListener("click", () => doLogout(false));
    $("studioLogoutDelete").addEventListener("click", () => doLogout(true));
    $("studioTransferGuest").addEventListener("click", transferGuest);
    $("studioAuthGoogle").addEventListener("click", googleLogin);
    $("studioAuthTikTok").addEventListener("click", tiktokLogin);
    $("studioAuthForm").addEventListener("submit", submitAuth);
    window.addEventListener("brat:auth-recovery", () => {
        recoveryPending = true;
        showAuth("new-password");
    });
    document.querySelectorAll("[data-auth-mode]").forEach(button =>
        button.addEventListener("click", () => setMode(button.dataset.authMode)));
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        if (!$("studioAuthDialog").hidden) closeAuth();
        if (!$("studioLogoutDialog").hidden) closeLogout();
        if (!$("studioProjectDialog").hidden) closeProjectDialog();
    });

    // Mobile editor has no persistent sidebar; provide a one-click return.
    const backButton = document.createElement("button");
    backButton.id = "studioBackToHome";
    backButton.type = "button";
    backButton.className = "studio-editor-back";
    backButton.textContent = "← Studio";
    backButton.setAttribute("aria-label", "Torna alla dashboard");
    backButton.addEventListener("click", () => viewSwitch("home"));
    document.querySelector(".topbar")?.prepend(backButton);

    document.body.classList.add("studio-active");
    // Preserve existing portable project links: they must open the editor.
    // BRATCODE links prefill the import field; importing always requires
    // an explicit click. Remove the bearer code from the address bar after
    // reading it so it is not accidentally reused from browser history.
    const incomingHash = window.location.hash;
    if (incomingHash.startsWith("#bratcode=")) {
        const candidate = incomingHash.slice("#bratcode=".length);
        try {
            $("studioCodeInput").value = window.BratCode.prettyCode(candidate);
            viewSwitch("share");
            $("studioCodeMessage").textContent = "Link ricevuto. Premi Importa progetto per confermare.";
        } catch (_) {
            viewSwitch("share");
            $("studioCodeMessage").textContent = "Il link BRATCODE non contiene un codice valido.";
        }
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } else {
        viewSwitch(incomingHash.startsWith("#project=") ? "editor" : "home");
    }
    profile();
    auth.listen(queueAuthChange);
    auth.initialize().then(result => {
        if (!result.configured) {
            notify("");
            return renderProjects();
        }
    }).catch(error => notify("Login non disponibile: " + error.message + ". L'editor ospite continua a funzionare.", true));
    window.BratStudio = { show: viewSwitch, showAuth, getView: () => view };
})();
