import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase.js";

/* ===== Estilos simples móviles ===== */
const S = {
  app: { fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", background: "#0B0C10", color: "#F5F7FA", minHeight: "100vh" },
  container: { maxWidth: 880, margin: "0 auto", padding: 12 },
  card: { background: "#111827", border: "1px solid #1F2937", borderRadius: 14, padding: 12 },
  btn: { padding: "10px 12px", borderRadius: 12, border: "1px solid #374151", background: "#111827", color: "#F9FAFB" },
  input: { width: "100%", padding: "12px 12px", borderRadius: 12, border: "1px solid #374151", background: "#0B0C10", color: "#F9FAFB", outline: "none" },
  avatar: { width: 48, height: 48, borderRadius: "50%", background: "#1F2937", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }
};

function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0,2);
  return parts.map(p=>p[0]?.toUpperCase()||"").join("") || "??";
}
function timeAgo(ts) {
  const d = typeof ts === "string" ? new Date(ts).getTime() : ts;
  const s = Math.floor((Date.now()-d)/1000);
  if (s<60) return `${s}s`;
  const m = Math.floor(s/60); if (m<60) return `${m}m`;
  const h = Math.floor(m/60); if (h<24) return `${h}h`;
  const dd = Math.floor(h/24); return `${dd}d`;
}
function readImageFile(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

/* ===== Autenticación (magic link) ===== */
function AuthBox({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div style={{...S.card, maxWidth: 420, margin: "40px auto"}}>
      <div style={{fontWeight:700, marginBottom:8}}>Entrar</div>
      <input style={{...S.input, marginBottom:8}} placeholder="Tu email" value={email} onChange={e=>setEmail(e.target.value)} />
      {!sent ? (
        <button
          style={S.btn}
          onClick={async ()=>{
            if(!email) return;
            const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
            if (error) { alert(error.message); return; }
            setSent(true);
          }}
        >
          Enviar enlace mágico
        </button>
      ) : (
        <div style={{opacity:0.8}}>Revisa tu email y toca el enlace para entrar.</div>
      )}
      <div style={{opacity:0.7, fontSize:12, marginTop:8}}>
        * Si ya entraste antes desde este dispositivo, recarga la página.
      </div>
    </div>
  );
}

/* ===== Componentes UI ===== */
function TopBar({ profile, onEdit, onSignOut }) {
  return (
    <div style={{position:"sticky", top:0, zIndex:5, background:"rgba(11,12,16,0.85)", backdropFilter:"blur(6px)", borderBottom:"1px solid #1F2937", padding:"10px 12px", display:"flex", justifyContent:"space-between"}}>
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <div style={{...S.avatar, width:32, height:32, fontSize:12}}>
          {profile?.photo ? <img src={profile.photo} alt="me" style={{width:"100%", height:"100%", borderRadius:"50%"}}/> : initials(profile?.name || "P")}
        </div>
        <div style={{fontWeight:700}}>GrupoNet</div>
      </div>
      <div style={{display:"flex", gap:8}}>
        <button style={S.btn} onClick={onEdit}>Perfil</button>
        <button style={S.btn} onClick={onSignOut}>Salir</button>
      </div>
    </div>
  );
}

function ProfileModal({ open, profile, onClose, onSave }) {
  const [name, setName] = useState(profile?.name||"");
  const [photo, setPhoto] = useState(profile?.photo||"");
  const fileRef = useRef(null);
  useEffect(()=>{ if(open){ setName(profile?.name||""); setPhoto(profile?.photo||""); }},[open, profile]);
  if(!open) return null;
  return (
    <div onClick={onClose} style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"grid", placeItems:"center", padding:12}}>
      <div onClick={e=>e.stopPropagation()} style={{...S.card, width:"100%", maxWidth:440}}>
        <div style={{fontWeight:700, marginBottom:8}}>Tu perfil</div>
        <div style={{display:"flex", gap:12, alignItems:"center"}}>
          <div style={S.avatar}>{photo?<img src={photo} alt="" style={{width:"100%", height:"100%", borderRadius:"50%"}}/>:initials(name||"P")}</div>
          <div style={{flex:1}}>
            <input style={{...S.input, marginBottom:8}} placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)} />
            <div style={{display:"flex", gap:8}}>
              <input style={S.input} placeholder="URL foto (opcional)" value={photo} onChange={e=>setPhoto(e.target.value)} />
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={async e=>{ const f=e.target.files?.[0]; if(!f) return; const url=await readImageFile(f); setPhoto(url); }} />
              <button style={S.btn} onClick={()=>fileRef.current?.click()}>Subir</button>
            </div>
          </div>
        </div>
        <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:12}}>
          <button style={S.btn} onClick={()=>{ onSave({name, photo}); onClose(); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function NewGroupCard({ meId, onCreated }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const fileRef = useRef(null);
  return (
    <div style={S.card}>
      <div style={{fontWeight:700, marginBottom:6}}>Crear grupo</div>
      <input style={{...S.input, marginBottom:8}} placeholder="Nombre del grupo" value={name} onChange={e=>setName(e.target.value)} />
      <div style={{display:"flex", gap:8}}>
        <input style={S.input} placeholder="URL avatar (opcional)" value={avatar} onChange={e=>setAvatar(e.target.value)} />
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={async e=>{ const f=e.target.files?.[0]; if(!f) return; const url=await readImageFile(f); setAvatar(url); }} />
        <button style={S.btn} onClick={()=>fileRef.current?.click()}>Subir</button>
      </div>
      <div style={{display:"flex", justifyContent:"flex-end", marginTop:8}}>
        <button
          style={S.btn}
          onClick={async ()=>{
            const nm = name.trim();
            if(!nm) return;
            const { data: g, error } = await supabase.from("groups").insert({ name: nm, avatar, admin_id: meId }).select().single();
            if(error){ alert(error.message); return; }
            // auto-membership admin
            await supabase.from("memberships").insert({ user_id: meId, group_id: g.id });
            onCreated && onCreated();
            setName(""); setAvatar("");
          }}
        >Crear</button>
      </div>
    </div>
  );
}

function GroupItem({ g, isMember, pending, onOpen, onJoin }) {
  return (
    <div style={{...S.card, display:"flex", alignItems:"center", gap:10}} onClick={onOpen}>
      <div style={{...S.avatar, width:40, height:40}}>
        {g.avatar ? <img src={g.avatar} alt={g.name} style={{width:"100%", height:"100%", borderRadius:"50%"}}/> : initials(g.name)}
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight:700}}>{g.name}</div>
        <div style={{fontSize:12, opacity:0.75}}>Miembros: {g.members_count ?? "-"}</div>
      </div>
      {isMember ? <span style={{opacity:.8, fontSize:12}}>Miembro</span> : (
        <button style={S.btn} onClick={(e)=>{ e.stopPropagation(); onJoin(); }}>Unirme</button>
      )}
    </div>
  );
}

function PostComposer({ meId, group, onPosted }) {
  const [caption,setCaption] = useState("");
  const [image,setImage] = useState("");
  const fileRef = useRef(null);
  return (
    <div style={S.card}>
      <div style={{fontWeight:700, marginBottom:6}}>Publicar en {group.name}</div>
      <input style={{...S.input, marginBottom:8}} placeholder="Pie (opcional)" value={caption} onChange={e=>setCaption(e.target.value)} />
      <div style={{display:"flex", gap:8}}>
        <input style={S.input} placeholder="URL de imagen" value={image} onChange={e=>setImage(e.target.value)} />
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={async e=>{ const f=e.target.files?.[0]; if(!f) return; const url=await readImageFile(f); setImage(url); }} />
        <button style={S.btn} onClick={()=>fileRef.current?.click()}>Cámara</button>
      </div>
      <div style={{display:"flex", justifyContent:"flex-end", marginTop:8}}>
        <button style={S.btn} onClick={async ()=>{
          if(!image) return;
          const { error } = await supabase.from("posts").insert({ group_id: group.id, by_user_id: meId, image, caption });
          if(error){ alert(error.message); return; }
          setCaption(""); setImage(""); onPosted && onPosted();
        }}>Publicar</button>
      </div>
    </div>
  );
}

function PostCard({ post, group, author }) {
  return (
    <div style={{...S.card, padding:0, overflow:"hidden"}}>
      <div style={{padding:12, display:"flex", gap:8}}>
        <div style={{...S.avatar, width:32, height:32, fontSize:12}}>
          {group?.avatar ? <img src={group.avatar} alt={group.name} style={{width:"100%", height:"100%", borderRadius:"50%"}}/> : initials(group?.name||"G")}
        </div>
        <div>
          <div style={{fontWeight:700, fontSize:14}}>{group?.name||"Grupo"}</div>
          <div style={{fontSize:12, opacity:.7}}>{author?.name||"Miembro"} · {timeAgo(post.ts)}</div>
        </div>
      </div>
      {post.image && <img src={post.image} alt={post.caption||"post"} style={{width:"100%", maxHeight:420, objectFit:"cover"}}/>}
      {post.caption && <div style={{padding:12, fontSize:14}}>{post.caption}</div>}
    </div>
  );
}

function ChatPanel({ meId, groupId }) {
  const [text,setText] = useState("");
  const [messages,setMessages] = useState([]);
  const endRef = useRef(null);

  async function load() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("group_id", groupId)
      .order("ts", { ascending: true })
      .limit(200);
    if(!error) setMessages(data||[]);
  }

  useEffect(()=>{ load(); },[groupId]);

  useEffect(()=>{
    const channel = supabase
      .channel(`msgs-${groupId}`)
      .on("postgres_changes",{ event: "INSERT", schema:"public", table:"messages", filter:`group_id=eq.${groupId}` }, (payload)=>{
        setMessages((cur)=>[...cur, payload.new]);
        endRef.current?.scrollIntoView({behavior:"smooth"});
      })
      .subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[groupId]);

  return (
    <div style={{...S.card, padding:0, display:"flex", flexDirection:"column", height:320}}>
      <div style={{padding:10, overflowY:"auto", flex:1}}>
        {messages.map(m=>(
          <div key={m.id} style={{
            maxWidth:"80%", margin: m.by_user_id===meId ? "6px 0 6px auto" : "6px 0",
            background: m.by_user_id===meId ? "#2563EB" : "#1F2937", color:"#fff",
            borderRadius:14, padding:"8px 10px", fontSize:14
          }}>
            <div style={{opacity:.7, fontSize:11, marginBottom:2}}>{timeAgo(m.ts)}</div>
            {m.text}
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <div style={{padding:10, borderTop:"1px solid #1F2937", display:"flex", gap:8}}>
        <input style={S.input} placeholder="Escribe un mensaje…" value={text} onChange={e=>setText(e.target.value)} onKeyDown={async (e)=>{ if(e.key==="Enter" && text.trim()){ await supabase.from("messages").insert({ group_id: groupId, by_user_id: meId, text: text.trim() }); setText(""); } }} />
        <button style={S.btn} onClick={async ()=>{ if(!text.trim()) return; await supabase.from("messages").insert({ group_id: groupId, by_user_id: meId, text: text.trim() }); setText(""); }}>Enviar</button>
      </div>
    </div>
  );
}

/* ===== App principal (modo Supabase) ===== */
export default function App(){
  const [session,setSession] = useState(null);
  const [profile,setProfile] = useState(null);
  const [tab,setTab] = useState("feed");
  const [groups,setGroups] = useState([]);
  const [memberships,setMemberships] = useState([]);
  const [posts,setPosts] = useState([]);
  const [openGroup,setOpenGroup] = useState(null);
  const [profileOpen,setProfileOpen] = useState(false);

  // Sesión
  useEffect(()=>{
    supabase.auth.getSession().then(({ data })=> setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s)=> setSession(s));
    return ()=> sub.subscription.unsubscribe();
  },[]);

  // Si no hay sesión -> login
  if(!session){
    return <div style={S.app}><AuthBox/></div>;
  }

  const meId = session.user.id;

  // Perfil: upsert
  async function ensureProfile(){
    const { data } = await supabase.from("profiles").select("*").eq("id", meId).maybeSingle();
    if(!data){
      await supabase.from("profiles").insert({ id: meId, name: "", photo: "" });
      setProfile({ id: meId, name: "", photo: "" });
    } else {
      setProfile(data);
    }
  }
  useEffect(()=>{ ensureProfile(); },[meId]);

  // Cargar grupos + memberships + posts visibles (de mis grupos)
  async function loadAll(){
    const { data: ms } = await supabase.from("memberships").select("*").eq("user_id", meId);
    setMemberships(ms||[]);
    const myGroupIds = (ms||[]).map(m=>m.group_id);
    // Grupos (con contador de miembros)
    const { data: gs } = await supabase.rpc("rpc_groups_with_counts").catch(()=>({data:null}));
    if(gs){ setGroups(gs); } else {
      // Fallback sin RPC: carga simple
      const { data: allg } = await supabase.from("groups").select("*").order("created_at",{ascending:false});
      if(allg) setGroups(allg);
    }
    // Posts de mis grupos
    if(myGroupIds.length){
      const { data: ps } = await supabase.from("posts").select("*").in("group_id", myGroupIds).order("ts",{ascending:false}).limit(200);
      setPosts(ps||[]);
    } else setPosts([]);
  }
  useEffect(()=>{ loadAll(); },[meId]);

  // Realtime posts de mis grupos
  useEffect(()=>{
    const myIds = memberships.map(m=>m.group_id);
    if(myIds.length===0) return;
    const channel = supabase.channel("posts-realtime");
    myIds.forEach(gid=>{
      channel.on("postgres_changes",{ event:"INSERT", schema:"public", table:"posts", filter:`group_id=eq.${gid}` }, (payload)=>{
        setPosts((cur)=>[payload.new, ...cur]);
      });
    });
    channel.subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[memberships]);

  // Acciones
  async function saveProfile({name,photo}){
    const { error } = await supabase.from("profiles").update({ name, photo }).eq("id", meId);
    if(!error) setProfile((p)=>({ ...(p||{}), name, photo }));
  }
  async function createGroup({name,avatar}){
    const { data: g, error } = await supabase.from("groups").insert({ name, avatar, admin_id: meId }).select().single();
    if(error){ alert(error.message); return; }
    await supabase.from("memberships").insert({ user_id: meId, group_id: g.id });
    setOpenGroup(g);
    await loadAll();
  }
  async function joinGroup(groupId){
    const { error } = await supabase.from("memberships").insert({ user_id: meId, group_id: groupId });
    if(error){ alert(error.message); return; }
    await loadAll();
  }
  async function publish(groupId, {image, caption}){
    const { error } = await supabase.from("posts").insert({ group_id: groupId, by_user_id: meId, image, caption });
    if(error){ alert(error.message); return; }
    // posts se actualiza por realtime si eres miembro; si no, recargamos
    await loadAll();
  }

  const myGroupIds = useMemo(()=> memberships.map(m=>m.group_id), [memberships]);
  const myGroups = useMemo(()=> groups.filter(g=>myGroupIds.includes(g.id)), [groups, myGroupIds]);
  const feedPosts = posts; // ya filtrados

  return (
    <div style={S.app}>
      <TopBar profile={profile} onEdit={()=>setProfileOpen(true)} onSignOut={()=>supabase.auth.signOut()} />

      {/* Tabs */}
      <div style={{...S.container, paddingTop:12, display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8}}>
        {["feed","groups","chats","yo"].map(t=>(
          <button key={t} style={{...S.btn, border: "1px solid #374151"}} onClick={()=>setTab(t)}>{t.toUpperCase()}</button>
        ))}
      </div>

      <div style={{...S.container, paddingBottom:80}}>
        {tab==="feed" && (
          <div style={{display:"grid", gap:12}}>
            {feedPosts.length===0 && <div style={{opacity:.7}}>Tu feed está vacío. Únete a un grupo.</div>}
            {feedPosts.map(p=>{
              const g = groups.find(x=>x.id===p.group_id);
              const author = p.by_user_id === meId ? profile : null;
              return <PostCard key={p.id} post={p} group={g} author={author} />;
            })}
          </div>
        )}

        {tab==="groups" && (
          <div style={{display:"grid", gap:12}}>
            {/* Panel izquierdo: grupo abierto */}
            <div style={{display:"grid", gap:12}}>
              {openGroup ? (
                <>
                  <div style={S.card}>
                    <div style={{display:"flex", gap:10, alignItems:"center"}}>
                      <div style={{...S.avatar, width:56, height:56}}>
                        {openGroup.avatar ? <img src={openGroup.avatar} alt={openGroup.name} style={{width:"100%", height:"100%", borderRadius:"50%"}}/> : initials(openGroup.name)}
                      </div>
                      <div>
                        <div style={{fontWeight:700, fontSize:18}}>{openGroup.name}</div>
                        <div style={{fontSize:12, opacity:.75}}>
                          Admin: {openGroup.admin_id===meId?"Tú":openGroup.admin_id?.slice(0,6)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <PostComposer meId={meId} group={openGroup} onPosted={()=>{}}/>

                  <div style={{display:"grid", gap:12}}>
                    {/* Posts del grupo abierto */}
                    {/* NOTA: simplificamos consultando backend al entrar en group feed */}
                    {/* (ya se mostrarán en la pestaña Feed por realtime) */}
                  </div>

                  <ChatPanel meId={meId} groupId={openGroup.id} />
                </>
              ) : (
                <div style={S.card}>
                  <div style={{fontWeight:700, marginBottom:6}}>Gestiona tus grupos</div>
                  <div style={{opacity:.7}}>Crea o abre un grupo desde la lista.</div>
                </div>
              )}
            </div>

            {/* Panel derecho: crear/descubrir */}
            <div style={{display:"grid", gap:12}}>
              <NewGroupCard meId={meId} onCreated={loadAll} />

              <div style={{opacity:.8, fontSize:14}}>Mis grupos</div>
              <div style={{display:"grid", gap:12}}>
                {myGroups.map(g=>(
                  <GroupItem key={g.id} g={g} isMember pending={false} onOpen={()=>setOpenGroup(g)} onJoin={()=>{}} />
                ))}
              </div>

              <div style={{opacity:.8, fontSize:14}}>Descubrir</div>
              <div style={{display:"grid", gap:12}}>
                {groups.filter(g=>!myGroupIds.includes(g.id)).map(g=>(
                  <GroupItem key={g.id} g={g} isMember={false} pending={false} onOpen={()=>setOpenGroup(g)} onJoin={()=>joinGroup(g.id)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==="chats" && (
          <div style={{display:"grid", gap:12}}>
            <div style={S.card}>
              <div style={{fontWeight:700, marginBottom:6}}>Chats de mis grupos</div>
              <div style={{display:"grid", gap:8}}>
                {myGroups.length===0 && <div style={{opacity:.7}}>Únete a un grupo.</div>}
                {myGroups.map(g=>(
                  <button key={g.id} style={S.btn} onClick={()=>{ setOpenGroup(g); setTab("groups"); }}>{g.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==="yo" && (
          <div style={{display:"grid", gap:12}}>
            <div style={S.card}>
              <div style={{fontWeight:700, marginBottom:6}}>Tu perfil</div>
              <div style={{display:"flex", gap:12, alignItems:"center"}}>
                <div style={S.avatar}>{profile?.photo ? <img src={profile.photo} alt={profile.name} style={{width:"100%", height:"100%", borderRadius:"50%"}}/> : initials(profile?.name||"P")}</div>
                <div>
                  <div style={{fontWeight:700}}>{profile?.name || "Sin nombre"}</div>
                  <div style={{fontSize:12, opacity:.7}}>{meId}</div>
                </div>
              </div>
              <div style={{marginTop:10}}>
                <button style={S.btn} onClick={()=>setProfileOpen(true)}>Editar perfil</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProfileModal
        open={profileOpen || !profile?.name}
        profile={profile||{name:"",photo:""}}
        onClose={()=>setProfileOpen(false)}
        onSave={saveProfile}
      />
    </div>
  );
}

/*
NOTA:
- Para contador de miembros por grupo podrías crear una RPC en Supabase:
  create or replace view groups_with_counts as
  select g.*, (select count(*) from memberships m where m.group_id=g.id) as members_count
  from groups g;

  o una función:
  create or replace function rpc_groups_with_counts()
  returns setof groups
  language sql
  as $$ select * from groups; $$

- Aquí hacemos fallback si no existe.
*/

