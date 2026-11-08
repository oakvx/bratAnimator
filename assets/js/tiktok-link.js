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
    async function request(action) {
        if (!["start", "status", "disconnect"].includes(action))
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
            body:JSON.stringify({action}),
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
                const data=await request("start");
                const url=new URL(data.url);
                if(url.origin!=="https://www.tiktok.com"||url.pathname!=="/v2/auth/authorize/") {
                    throw new Error("Indirizzo di autorizzazione non valido.");
                }
                root.location.assign(url.toString());
            } catch (error) {
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
                await request("disconnect");
                profileDetails(null);
                setStatus("TikTok scollegato e autorizzazione revocata.");
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
            if(root.location.hash.startsWith("#tiktok="))handleReturn();
        });
        function handleReturn() {
            const hash=root.location.hash;
            if (!hash.startsWith("#tiktok=")) return;
            const state=hash.slice("#tiktok=".length);
            root.history.replaceState(null,"",root.location.pathname+root.location.search);
            if(state==="denied")setStatus("Autorizzazione TikTok annullata.");
            else if(state==="failed")setStatus("Il collegamento TikTok non è riuscito. Riprova.",true);
            else if(state==="connected") {
                setStatus("TikTok autorizzato. Verifica profilo…");
                refresh().catch(()=>{});
            }
        }
        accessState();
        handleReturn();
        auth.initialize().then(()=>refresh()).catch(()=>accessState());
        root.BratTikTokUI=Object.freeze({refresh,connect});
    }
    return Object.freeze({configured,request,mount});
});
