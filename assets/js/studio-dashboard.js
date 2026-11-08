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
        return String(payload?.metadata?.trackName || line || fallback).slice(0, 62);
    }

    function setMode(mode) {
        authMode = mode;
        sentCode = false;
        $("studioAuthCodeWrap").hidden = true;
        $("studioAuthCode").value = "";
        $("studioAuthPasswordWrap").hidden = mode === "otp";
        $("studioAuthPassword").autocomplete = mode === "register" ? "new-password" : "current-password";
        $("studioAuthSubmit").textContent = mode === "register" ? "Crea account" : mode === "otp" ? "Invia codice" : "Accedi";
        document.querySelectorAll("[data-auth-mode]").forEach(button => {
            button.classList.toggle("is-active", button.dataset.authMode === mode);
        });
        authMessage("");
    }

    function showAuth() {
        $("studioAuthDialog").hidden = false;
        $("studioAuthSetup").hidden = auth.configured();
        setMode("login");
        $("studioAuthEmail").focus();
    }

    function closeAuth() { $("studioAuthDialog").hidden = true; }
    function closeLogout() { $("studioLogoutDialog").hidden = true; }

    function profile() {
        const user = auth.user();
        const label = user?.email || "Modalità ospite";
        $("studioNavIdentity").textContent = label;
        $("studioAvatar").textContent = user?.email?.slice(0, 1).toUpperCase() || "G";
        $("studioGreeting").textContent = user
            ? "Bentornato. I tuoi progetti sono salvati su questo dispositivo, separati dagli altri account."
            : "Crea, modifica ed esporta gratis anche senza account. Il tuo lavoro resta su questo dispositivo.";
        $("studioAccountButton").textContent = user ? "Il mio account" : "Accedi / Registrati";
        $("studioAccountDescription").textContent = user
            ? "Accesso effettuato con " + (user.email || "account verificato") + ". I progetti non sono sincronizzati online."
            : "Stai utilizzando Brat Animator come ospite. Non è necessario un account per creare o esportare video.";
        $("studioSettingsLogin").hidden = Boolean(user);
        $("studioSettingsLogout").hidden = !user;
    }

    function makeProjectCard(record, payload, parent) {
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
        parent.append(card);
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
            const ordered = records.filter(row => row.kind !== "temporary").sort((a, b) => b.updatedAt - a.updatedAt);
            $("studioProjectCount").textContent = ordered.length + " progetto/i associati a questo profilo · limite globale 20 + 1 temporaneo";
            if (!ordered.length) {
                target.append(makeEmpty("Crea il tuo primo progetto nell'editor."));
                recent.append(makeEmpty("Inizia con un nuovo lyric video."));
            } else {
                const entries = await Promise.all(ordered.map(async row => ({
                    row, project: await editor.store.getProject(editor.owner(), row.projectId)
                })));
                for (const { row, project } of entries) {
                    makeProjectCard(row, project?.payload, target);
                }
                for (const { row, project } of entries.slice(0, 3)) {
                    makeProjectCard(row, project?.payload, recent);
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
        } catch (error) {
            target.append(makeEmpty("Impossibile leggere la libreria locale."));
            recent.append(makeEmpty("Apri l'editor per continuare."));
            notify("Errore nell'archivio locale: " + error.message, true);
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
        $("studioFutureView").hidden = !(next === "sounds" || next === "share");
        if (next === "sounds" || next === "share") {
            $("studioFutureIcon").textContent = next === "sounds" ? "♫" : "↗";
            $("studioFutureTitle").textContent = next === "sounds" ? "Sound Hub" : "BRATCODE";
            $("studioFutureText").textContent = next === "sounds"
                ? "La libreria audio locale con raccolte e preferiti arriverà nella Fase 4."
                : "La condivisione temporanea dei progetti tramite codice arriverà nella Fase 3.";
        }
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
            await editor.createNew();
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
        if (!email || !$("studioAuthEmail").checkValidity()) {
            authMessage("Inserisci un indirizzo email valido.", true); return;
        }
        if (!auth.configured()) {
            authMessage("Il servizio account non è ancora configurato. Puoi continuare come ospite.", true); return;
        }
        if (authMode !== "otp" && password.length < 8) {
            authMessage("La password deve contenere almeno 8 caratteri.", true); return;
        }
        busy = true;
        $("studioAuthSubmit").disabled = true;
        authMessage("Operazione in corso…");
        try {
            if (authMode === "register") {
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
            const owner = nextId ? "user:" + nextId : "guest";
            if (owner !== editor.owner()) await editor.switchOwner(owner);
            currentUserId = nextId;
            profile();
            await renderProjects();
            const isFirst = !initialSessionHandled;
            initialSessionHandled = true;
            if (user && (isFirst || view !== "editor")) {
                const project = editor.store && await editor.store.getActive(owner);
                viewSwitch(project ? "editor" : "home");
            } else if (!user && !isFirst) {
                viewSwitch("home");
            }
            if (user) closeAuth();
        }).catch(error => notify("Impossibile cambiare libreria: " + error.message, true));
    }

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
    $("studioAuthForm").addEventListener("submit", submitAuth);
    document.querySelectorAll("[data-auth-mode]").forEach(button =>
        button.addEventListener("click", () => setMode(button.dataset.authMode)));
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        if (!$("studioAuthDialog").hidden) closeAuth();
        if (!$("studioLogoutDialog").hidden) closeLogout();
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
    viewSwitch("home");
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
