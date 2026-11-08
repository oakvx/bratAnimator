/* Brat Animator / optional TikTok account link.
 * TikTok authorization code, client secret, access and refresh tokens are
 * handled exclusively by our Supabase Edge Function, never in this client.
 */
(function (root, factory) {
    "use strict";
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root && root.document) { root.BratTikTokLink = api; api.mount(); }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    "use strict";

    function config() {
        const supabase = root.BratSupabaseConfig || {};
        return {
            enabled: root.BratTikTokConfig?.enabled === true,
            url: String(supabase.url || "").replace(/\/+$/, ""),
            publishableKey: String(supabase.publishableKey || supabase.anonKey || "")
        };
    }
    function configured() {
        const settings = config();
        try {
            const parsed = new URL(settings.url);
            return settings.enabled && parsed.protocol === "https:" &&
                settings.publishableKey.length > 15;
        } catch (_) { return false; }
    }
    function endpoint() {
        if (!configured()) throw new Error("TikTok non è ancora configurato.");
        return config().url + "/functions/v1/tiktok-link";
    }
    async function request(action, details = {}) {
        if (!["start", "complete", "status", "disconnect"].includes(action))
            throw new Error("Azione TikTok non supportata.");
        const auth = root.BratAuth;
        if (!auth?.user()) throw new Error("Accedi prima a Brat Animator.");
        const token = await auth.getAccessToken();
        const response = await root.fetch(endpoint(), {
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":"Bearer " + token,
                "apikey": config().publishableKey
            },
            body:JSON.stringify({...details,action}),
            credentials:"omit",
            cache:"no-store",
            redirect:"error"
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.error) {
            throw new Error(typeof payload.error === "string"
                ? payload.error : "Impossibile contattare TikTok.");
        }
        return payload;
    }

    function mount() {
        const document=root.document;
        const $=id=>document.getElementById(id);
        if (!$("studioTikTokSettings") || !root.BratAuth) return;
        const auth=root.BratAuth;
        let busy=false;
        let lastUser=null;
        let requestNumber=0;
        let confirmation=false;
        const proofKey="brat.tiktok.link.v1";

        function setStatus(message, error=false) {
            const node=$("studioTikTokStatus");
            node.textContent=message;
            node.dataset.error=String(error);
        }
        function profileDetails(profile) {
            const target=$("studioTikTokProfile");
            const name=$("studioTikTokName");
            const avatar=$("studioTikTokAvatar");
            const present=Boolean(profile);
            target.hidden=!present;
            name.textContent=present?String(profile.display_name||"Account TikTok"):"";
            avatar.hidden=true;
            avatar.removeAttribute("src");
            if (present && profile.avatar_url) {
                try {
                    const url=new URL(profile.avatar_url);
                    if (url.protocol==="https:") {
                        avatar.src=url.toString();
                        avatar.hidden=false;
                    }
                } catch (_) {}
            }
            $("studioTikTokConnect").hidden=present;
            $("studioTikTokDisconnect").hidden=!present;
        }
        function accessState() {
            const user=auth.user();
            if (!user) {
                profileDetails(null);
                $("studioTikTokConnect").disabled=false;
                setStatus("Per collegare TikTok, accedi prima a Brat Animator.");
                return "guest";
            }
            if (!configured()) {
                profileDetails(null);
                $("studioTikTokConnect").disabled=true;
                setStatus("TikTok non è ancora configurato sul server. L'editor resta utilizzabile.");
                return "disabled";
            }
            $("studioTikTokConnect").disabled=false;
            return "ready";
        }
        async function refresh() {
            const user=auth.user();
            const serial=++requestNumber;
            lastUser=user?.id||null;
            const state=accessState();
            if (state!=="ready") return;
            setStatus("Verifica collegamento…");
            try {
                const result=await request("status");
                if(serial!==requestNumber || auth.user()?.id!==lastUser)return;
                profileDetails(result.connected ? result.profile : null);
                setStatus(result.connected
                    ? "Account TikTok collegato. Nessun file o progetto viene sincronizzato."
                    : "Nessun account TikTok collegato.");
            } catch (error) {
                if(serial!==requestNumber)return;
                profileDetails(null);
                setStatus(error.message,true);
            }
        }
        async function connect() {
            if(busy)return;
            if(!auth.user()) {root.BratStudio?.showAuth?.();return;}
            if(!configured()) {setStatus("Configura prima Login Kit e Supabase.",true);return;}
            busy=true;
            $("studioTikTokConnect").disabled=true;
            setStatus("Apertura autorizzazione TikTok…");
            try {
                const verifier=[...root.crypto.getRandomValues(new Uint8Array(32))]
                    .map(n=>n.toString(16).padStart(2,"0")).join("");
                const pending={verifier,state:"",createdAt:Date.now()};
                root.sessionStorage.setItem(proofKey,JSON.stringify(pending));
                const hash=await root.crypto.subtle.digest("SHA-256",new TextEncoder().encode(verifier));
                const challenge=[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,"0")).join("");
                const data=await request("start",{challenge});
                const url=new URL(data.url);
                pending.state=url.searchParams.get("state")||"";
                if(url.origin!=="https://www.tiktok.com"||url.pathname!=="/v2/auth/authorize/"||
                    !/^[A-Za-z0-9_-]{43}$/.test(pending.state)) {
                    throw new Error("Indirizzo di autorizzazione non valido.");
                }
                root.sessionStorage.setItem(proofKey,JSON.stringify(pending));
                root.location.assign(url.toString());
            } catch (error) {
                try {root.sessionStorage.removeItem(proofKey);} catch (_) {}
                setStatus(error.message,true);
                busy=false;
                $("studioTikTokConnect").disabled=false;
            }
        }
        function showConfirmation() {
            if(busy||confirmation)return;
            confirmation=true;
            $("studioTikTokDialog").hidden=false;
        }
        function closeConfirmation() {
            confirmation=false;
            $("studioTikTokDialog").hidden=true;
        }
        async function disconnect() {
            if(busy)return;
            closeConfirmation();
            busy=true;
            $("studioTikTokDisconnect").disabled=true;
            setStatus("Scollegamento TikTok…");
            try {
                const result=await request("disconnect");
                profileDetails(null);
                setStatus(result.revokedAtProvider === true
                    ? "TikTok scollegato e autorizzazione revocata presso TikTok."
                    : "Collegamento locale eliminato. Verifica e revoca eventuali autorizzazioni ancora attive dalle impostazioni privacy di TikTok.");
            } catch (error) {
                setStatus(error.message + " Il collegamento è stato conservato.",true);
            } finally {
                busy=false;
                $("studioTikTokDisconnect").disabled=false;
            }
        }
        $("studioTikTokConnect").addEventListener("click",connect);
        $("studioTikTokDisconnect").addEventListener("click",showConfirmation);
        $("studioTikTokConfirmYes").addEventListener("click",disconnect);
        $("studioTikTokConfirmNo").addEventListener("click",closeConfirmation);
        $("studioTikTokConfirmClose").addEventListener("click",closeConfirmation);
        auth.listen(()=>{requestNumber++;refresh().catch(()=>{});});
        root.addEventListener("brat:studio-view",event=>{
            if(event.detail?.view==="settings")refresh().catch(()=>{});
        });
        root.addEventListener("hashchange",()=> {
            if(root.location.hash.startsWith("#tiktok="))handleReturn().catch(error=>setStatus(error.message,true));
        });
        async function handleReturn() {
            const hash=root.location.hash;
            if (!hash.startsWith("#tiktok=")) return false;
            // The OAuth redirect lands on the app root; open Settings to show
            // the result instead of hiding the status in a different page.
            root.BratStudio?.show?.("settings");
            // Ignore in-flight status checks from initialization/view changes:
            // they must not overwrite an authorization failure or cancellation.
            requestNumber++;
            const query=new URLSearchParams(hash.slice(1));
            const state=query.get("tiktok");
            root.history.replaceState(null,"",root.location.pathname+root.location.search);
            if(state==="denied")setStatus("Autorizzazione TikTok annullata.");
            else if(state==="failed")setStatus("Il collegamento TikTok non è riuscito. Riprova.",true);
            else if(state==="connected") {
                setStatus("TikTok autorizzato. Verifica profilo…");
                refresh().catch(()=>{});
            }
            else if(state==="pending") {
                let pending;
                try {pending=JSON.parse(root.sessionStorage.getItem(proofKey)||"null");}
                finally {root.sessionStorage.removeItem(proofKey);}
                const ticket=query.get("ticket")||"";
                if(!pending||pending.state!==query.get("state")||
                    !/^[a-f0-9]{64}$/.test(pending.verifier)||!/^[A-Za-z0-9_-]{43}$/.test(ticket)||
                    Date.now()-pending.createdAt>480000||Date.now()<pending.createdAt)
                    throw new Error("Collegamento scaduto o avviato in un altro browser. Riprova.");
                await auth.initialize();
                await request("complete",{state:pending.state,verifier:pending.verifier,ticket});
                await refresh();
            }
            if(state==="denied"||state==="failed") {
                try {root.sessionStorage.removeItem(proofKey);} catch (_) {}
            }
            return true;
        }
        accessState();
        auth.initialize().then(async()=> {
            if(!await handleReturn())await refresh();
        }).catch(error=>setStatus(error.message,true));
        root.BratTikTokUI=Object.freeze({refresh,connect});
    }
    return Object.freeze({configured,request,mount});
});
