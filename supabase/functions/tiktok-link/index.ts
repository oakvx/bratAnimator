// Brat Animator / TikTok Login Kit (Phase 5).
// Deploy with verify_jwt=false: GET callback requires one-time CSRF state;
// POST actions explicitly verify a Supabase JWT. Secrets never reach GitHub Pages.
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const env=(name:string)=>Deno.env.get(name)||"";
const supabaseUrl=env("SUPABASE_URL");
const serviceKey=env("SUPABASE_SERVICE_ROLE_KEY");
const clientKey=env("TIKTOK_CLIENT_KEY");
const clientSecret=env("TIKTOK_CLIENT_SECRET");
const redirectUri=env("TIKTOK_REDIRECT_URI");
const appOrigin=env("BRAT_APP_ORIGIN");
const appUrl=env("BRAT_APP_URL");
const db=createClient(supabaseUrl||"https://invalid.supabase.co",serviceKey||"unconfigured",{
  auth:{persistSession:false,autoRefreshToken:false}
});
const TOKEN="https://open.tiktokapis.com/v2/oauth/token/";
const REVOKE="https://open.tiktokapis.com/v2/oauth/revoke/";
const PROFILE="https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url";

function configured() {
  try {
    const base=new URL(supabaseUrl),callback=new URL(redirectUri),app=new URL(appUrl);
    return !!(serviceKey&&clientKey&&clientSecret&&appOrigin&&
      base.protocol==="https:"&&!base.search&&!base.hash&&
      callback.protocol==="https:"&&callback.origin===base.origin&&
      callback.pathname==="/functions/v1/tiktok-link"&&
      !callback.search&&!callback.hash&&app.protocol==="https:"&&
      app.origin===appOrigin&&!app.search&&!app.hash);
  } catch (_) {return false;}
}
function cors(req:Request):Record<string,string>{
  if(req.headers.get("origin")!==appOrigin)return {};
  return {"Access-Control-Allow-Origin":appOrigin,
    "Access-Control-Allow-Headers":"authorization,apikey,content-type",
    "Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"};
}
function reply(req:Request,result:unknown,status=200){
  return new Response(JSON.stringify(result),{status,headers:{...cors(req),
    "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff"}});
}
function redirectToApp(state:"connected"|"failed"|"denied") {
  const target=new URL(appUrl);
  target.hash="tiktok="+state;
  return new Response(null,{status:302,headers:{"Location":target.toString(),
    "Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
}
function randomState(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function digest(state:string){
  const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(state));
  return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,"0")).join("");
}
function seconds(value:unknown,fallback:number){
  const n=Number(value);return Number.isFinite(n)&&n>0&&n<40000000?n:fallback;
}
async function tiktokForm(endpoint:string,fields:Record<string,string>){
  const res=await fetch(endpoint,{method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded","Cache-Control":"no-store"},
    body:new URLSearchParams(fields),signal:AbortSignal.timeout(12000)});
  const text=await res.text();
  let payload:Record<string,unknown>={};
  if(text.trim()) {try{payload=JSON.parse(text)}catch(_){throw Error("Invalid provider response")}}
  if(!res.ok||(payload.error&&payload.error!=="ok"))throw Error("TikTok request rejected");
  return payload;
}
async function profile(accessToken:string) {
  const response=await fetch(PROFILE,{headers:{Authorization:"Bearer "+accessToken},
    signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error("TikTok profile unavailable");
  const data=await response.json();
  if(data?.error?.code!=="ok"||!data?.data?.user?.open_id)throw Error("Invalid TikTok profile");
  const u=data.data.user;
  return {open_id:String(u.open_id),display_name:String(u.display_name||"").slice(0,180),
    avatar_url:String(u.avatar_url||"").slice(0,1500)};
}
async function authenticatedUser(req:Request) {
  const bearer=req.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._~-]+$/i.test(bearer))return null;
  const {data,error}=await db.auth.getUser(bearer.slice(7));
  return error?null:data.user?.id||null;
}
type Link={
  user_id:string; open_id:string; display_name:string; avatar_url:string; scopes:string;
  access_token:string; refresh_token:string; access_expires_at:string; refresh_expires_at:string;
};
async function getLink(userId:string):Promise<Link|null>{
  const {data,error}=await db.from("tiktok_connections").select("*")
    .eq("user_id",userId).maybeSingle();
  if(error)throw error;
  return data;
}
async function freshAccess(link:Link):Promise<Link> {
  if(Date.parse(link.access_expires_at)>Date.now()+120000)return link;
  if(Date.parse(link.refresh_expires_at)<Date.now())throw Error("Expired TikTok authorization");
  const tokens=await tiktokForm(TOKEN,{client_key:clientKey,client_secret:clientSecret,
    grant_type:"refresh_token",refresh_token:link.refresh_token});
  const access_token=String(tokens.access_token||"");
  const refresh_token=String(tokens.refresh_token||"");
  if(!access_token||!refresh_token)throw Error("TikTok refresh failed");
  const patch={access_token,refresh_token,
    access_expires_at:new Date(Date.now()+seconds(tokens.expires_in,7200)*1000).toISOString(),
    refresh_expires_at:new Date(Date.now()+seconds(tokens.refresh_expires_in,15552000)*1000).toISOString(),
    updated_at:new Date().toISOString()};
  const {error}=await db.from("tiktok_connections").update(patch).eq("user_id",link.user_id);
  if(error)throw error;
  return {...link,...patch};
}

// Bound request bodies even if Transfer-Encoding is chunked or Content-Length
// is absent. Only tiny JSON actions are accepted: never arbitrary uploads.
async function readAction(req:Request):Promise<string>{
  if((req.headers.get("content-type")||"").split(";")[0].trim().toLowerCase()!=="application/json")
    throw Error("Content type unsupported");
  const reader=req.body?.getReader();
  if(!reader)throw Error("Missing request body");
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let data="",length=0;
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      length+=value.byteLength;
      if(length>1024)throw Error("Oversized request body");
      data+=decoder.decode(value,{stream:true});
    }
    data+=decoder.decode();
    const obj=JSON.parse(data);
    if(!obj||typeof obj!=="object"||Array.isArray(obj)||typeof obj.action!=="string")
      throw Error("Invalid action");
    return obj.action;
  }finally{reader.releaseLock()}
}

async function handlePost(req:Request){
  if(req.headers.get("origin")!==appOrigin)return reply(req,{error:"Origin non autorizzata."},403);
  const userId=await authenticatedUser(req);
  if(!userId)return reply(req,{error:"Accedi prima a Brat Animator."},401);
  let action="";
  try{action=await readAction(req);}
  catch(_){return reply(req,{error:"Richiesta non valida."},400)}
  if(action==="status"){
    const link=await getLink(userId);
    return reply(req,link?{connected:true,profile:{
      open_id:link.open_id,display_name:link.display_name,avatar_url:link.avatar_url
    },scopes:link.scopes}:{connected:false});
  }
  if(action==="start"){
    const {count,error:countError}=await db.from("tiktok_link_states")
      .select("state_hash",{count:"exact",head:true})
      .eq("user_id",userId).gt("created_at",new Date(Date.now()-600000).toISOString());
    if(countError)throw countError;
    if((count||0)>=5)return reply(req,{error:"Troppi tentativi. Riprova più tardi."},429);
    const state=randomState(),state_hash=await digest(state);
    const {error}=await db.from("tiktok_link_states").insert({state_hash,user_id:userId});
    if(error)throw error;
    const url=new URL("https://www.tiktok.com/v2/auth/authorize/");
    url.searchParams.set("client_key",clientKey);
    url.searchParams.set("scope","user.info.basic");
    url.searchParams.set("response_type","code");
    url.searchParams.set("redirect_uri",redirectUri);
    url.searchParams.set("state",state);
    return reply(req,{url:url.toString()});
  }
  if(action==="disconnect"){
    const link=await getLink(userId);
    if(!link)return reply(req,{connected:false,revokedAtProvider:true});
    let revokedAtProvider=false;
    try{
      const fresh=await freshAccess(link);
      await tiktokForm(REVOKE,{client_key:clientKey,client_secret:clientSecret,
        token:fresh.access_token});
      revokedAtProvider=true;
    }catch(_){
      // An expired credential, offline provider or rejected revocation must
      // not trap personal tokens in our database. Report actual revocation
      // status; do not falsely claim TikTok revoked the grant.
    }
    const {error}=await db.from("tiktok_connections").delete().eq("user_id",userId);
    if(error)throw error;
    return reply(req,{connected:false,revokedAtProvider});
  }
  return reply(req,{error:"Azione sconosciuta."},400);
}

async function handleCallback(req:Request){
  const query=new URL(req.url).searchParams;
  const state=query.get("state")||"";
  if(!/^[A-Za-z0-9_-]{43}$/.test(state))
    return new Response("OAuth state mancante.",{status:400});
  const {data:userId,error}=await db.rpc("tiktok_claim_link_state",{p_state_hash:await digest(state)});
  if(error||!userId)return new Response("Sessione OAuth scaduta o già utilizzata.",{status:403});
  if(query.has("error"))return redirectToApp("denied");
  const code=query.get("code")||"";
  if(!code||code.length>2048)return redirectToApp("failed");
  try{
    const tokens=await tiktokForm(TOKEN,{client_key:clientKey,
      client_secret:clientSecret,code,grant_type:"authorization_code",redirect_uri:redirectUri});
    const access=String(tokens.access_token||"");
    const refresh=String(tokens.refresh_token||"");
    const openId=String(tokens.open_id||"");
    if(!access||!refresh||!openId)throw Error("Invalid OAuth token response");
    const account=await profile(access);
    if(account.open_id!==openId)throw Error("Open ID mismatch");
    const {error:saveError}=await db.from("tiktok_connections").upsert({
      user_id:userId,open_id:openId,display_name:account.display_name,
      avatar_url:account.avatar_url,scopes:String(tokens.scope||"user.info.basic"),
      access_token:access,refresh_token:refresh,
      access_expires_at:new Date(Date.now()+seconds(tokens.expires_in,7200)*1000).toISOString(),
      refresh_expires_at:new Date(Date.now()+seconds(tokens.refresh_expires_in,15552000)*1000).toISOString(),
      updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
    if(saveError)throw saveError;
    return redirectToApp("connected");
  }catch(_){
    // Do not log codes, tokens or provider response details.
    return redirectToApp("failed");
  }
}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:req.headers.get("origin")===appOrigin?204:403,
    headers:{...cors(req),"Cache-Control":"no-store"}});
  if(!configured())return reply(req,{error:"TikTok non ancora configurato."},503);
  try{
    if(req.method==="GET")return await handleCallback(req);
    if(req.method==="POST")return await handlePost(req);
    return reply(req,{error:"Metodo non supportato."},405);
  }catch(_){return reply(req,{error:"Operazione TikTok non riuscita."},500)}
});
