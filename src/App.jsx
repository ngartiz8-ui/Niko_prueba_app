import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase.js";

/* === Importa los stubs locales (rutas relativas, SIN alias "@") === */
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { ScrollArea } from "./components/ui/scroll-area";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { TooltipProvider } from "./components/ui/tooltip";

/* === Iconos simples (evitamos dependencias externas) === */
const Users = (p)=> <span {...p}>👥</span>;
const Plus = (p)=> <span {...p}>➕</span>;
const ImageIcon = (p)=> <span {...p}>🖼️</span>;
const MessageSquareText = (p)=> <span {...p}>💬</span>;
const Send = (p)=> <span {...p}>📨</span>;

/* === Utilidades === */
function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => (p[0] || "").toUpperCase()).join("") || "?";
}
function timeAgo(ts) {
  const t = typeof ts === "string" ? new Date(ts).getTime() : ts;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); return `${d}d`;
}
function dataUrlFromFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/* === ErrorBoundary para ver errores reales en producción === */
class AppErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { err: null, info: null }; }
  static getDerivedStateFromError(error){ return { err: error }; }
  componentDidCatch(error, info){ this.setState({ info }); }
  render(){
    if (this.state.err) {
      return (
        <div style={{padding:16,fontFamily:"monospace",whiteSpace:"pre-wrap"}}>
          <h3>❌ Error al renderizar</h3>
          <div><b>Error:</b> {String(this.state.err)}</div>
          <div style={{marginTop:8,opacity:.75}}>
            <b>Stack:</b>{"\n"}{this.state.err?.stack}
            {"\n\n"}<b>ComponentStack:</b>{"\n"}{this.state.info?.componentStack}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* === Login (OTP) === */
function LoginGate() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Entrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
          <Button
            disabled={sending || !email}
            onClick={async ()=>{
              setSending(true);
              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: window.location.origin }
              });
              setSending(false);
              if (error) alert(error.message);
              else alert("Te enviamos un enlace a tu email. Ábrelo para entrar ✨");
            }}
          >{sending?"Enviando…":"Enviar enlace mágico"}</Button>
          <div className="text-xs" style={{opacity:.7}}>
            Si el enlace te devuelve al login, abre el link en el navegador del sistema
            y revisa Supabase → Auth → URL (usa tu dominio de Vercel).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* === Componentes UI (tu estética) === */
function TopBar({ user, onEditProfile, onSignOut }) {
  return (
    <div className="sticky top-0 z-20" style={{borderBottom:"1px solid #eee", background:"rgba(255,255,255,0.85)", backdropFilter:"blur(6px)"}}>
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users style={{fontSize:20}} />
          <span className="font-bold text-lg">GrupoNet · Supabase</span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onEditProfile} className="gap-2">
            <Avatar className="h-6 w-6">
              {user?.photo ? <AvatarImage src={user.photo} alt={user.name} /> : <AvatarFallback>{initials(user?.name||"")}</AvatarFallback>}
            </Avatar>
            <span className="hidden sm:inline">{user?.name || "Perfil"}</span>
          </Button>
          <Button onClick={onSignOut}>Salir</Button>
        </div>
      </div>
    </div>
  );
}

function ProfileDialog({ open, setOpen, user, onSave }) {
  const [name, setName] = useState(user?.name || "");
  const [photo, setPhoto] = useState(user?.photo || "");
  const fileRef = useRef(null);

  useEffect(()=>{ if(open){ setName(user?.name||""); setPhoto(user?.photo||""); }},[open, user]);

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await dataUrlFromFile(f);
    setPhoto(url);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tu perfil</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {photo ? <AvatarImage src={photo} alt={name} /> : <AvatarFallback>{initials(name)}</AvatarFallback>}
          </Avatar>
          <div className="grid gap-2 w-full">
            <Input placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)} />
            <div className="flex gap-2">
              <Input placeholder="URL de foto (opcional)" value={photo} onChange={e=>setPhoto(e.target.value)} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <Button onClick={()=>fileRef.current?.click()} className="gap-2"><ImageIcon/>Subir</Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={()=>setOpen(false)}>Cancelar</Button>
          <Button onClick={()=>{ onSave({ name, photo }); setOpen(false); }}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupCard({ group, isMember, onOpen, onJoin }) {
  return (
    <Card className="hover:shadow-md transition cursor-pointer" onClick={onOpen}>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Avatar className="h-10 w-10">
          {group.avatar ? <AvatarImage src={group.avatar} alt={group.name} /> : <AvatarFallback>{initials(group.name)}</AvatarFallback>}
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-base">{group.name}</CardTitle>
          <div className="text-xs" style={{opacity:.7}}>Miembros: {group.members_count ?? "-"}</div>
        </div>
        {isMember ? (
          <Badge>Miembro</Badge>
        ) : (
          <Button onClick={(e)=>{ e.stopPropagation(); onJoin(); }}>Unirme</Button>
        )}
      </CardHeader>
    </Card>
  );
}

function NewGroupDialog({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const fileRef = useRef(null);

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await dataUrlFromFile(f);
    setAvatar(url);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus/>Crear grupo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo grupo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Nombre del grupo" value={name} onChange={e=>setName(e.target.value)} />
          <div className="flex gap-2 items-center">
            <Input placeholder="URL avatar (opcional)" value={avatar} onChange={e=>setAvatar(e.target.value)} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <Button onClick={()=>fileRef.current?.click()} className="gap-2"><ImageIcon/>Subir</Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={()=>setOpen(false)}>Cancelar</Button>
            <Button onClick={()=>{ if(!name.trim()) return; onCreate({ name, avatar }); setName(""); setAvatar(""); setOpen(false); }}>Crear</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PostComposer({ group, me, onPublish }) {
  const [image, setImage] = useState("");
  const [caption, setCaption] = useState("");
  const fileRef = useRef(null);
  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await dataUrlFromFile(f);
    setImage(url);
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Publicar en {group.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {me?.photo ? <AvatarImage src={me.photo} /> : <AvatarFallback>{initials(me?.name||"")}</AvatarFallback>}
          </Avatar>
          <Input placeholder="Título o pie (opcional)" value={caption} onChange={e=>setCaption(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="URL de imagen" value={image} onChange={e=>setImage(e.target.value)} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button onClick={()=>fileRef.current?.click()} className="gap-2"><ImageIcon/>Subir</Button>
          <Button onClick={()=>{ if(!image) return; onPublish({ image, caption }); setImage(""); setCaption(""); }}>Publicar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PostCard({ post, group, author }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Avatar className="h-8 w-8">
          {group?.avatar ? <AvatarImage src={group.avatar} /> : <AvatarFallback>{initials(group?.name||"G")}</AvatarFallback>}
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-sm">{group?.name || "Grupo"}</CardTitle>
          <div className="text-xs" style={{opacity:.7}}>por {author?.name || "Miembro"} · {timeAgo(post.ts || post.created_at)}</div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {post.image && (
          <img src={post.image} alt={post.caption||"post"} style={{width:"100%", maxHeight:420, objectFit:"cover"}} />
        )}
        {post.caption && (
          <div className="px-4 py-3 text-sm">{post.caption}</div>
        )}
      </CardContent>
    </Card>
  );
}

function ChatPanel({ messages, onSend, me }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  return (
    <div className="flex flex-col" style={{height:384, border:"1px solid #eee", borderRadius:12, overflow:"hidden"}}>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.by_user_id===me?.id?"bg-black text-white ml-auto":"bg-[#f4f4f5]"}`}>
              <div style={{opacity:.7, fontSize:12, paddingBottom:2}}>{timeAgo(m.ts || m.created_at)}</div>
              <div>{m.text}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-2 flex gap-2">
        <Input placeholder="Escribe un mensaje..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ if(!text.trim()) return; onSend(text.trim()); setText(""); } }} />
        <Button onClick={()=>{ if(!text.trim()) return; onSend(text.trim()); setText(""); }} className="gap-2"><Send/>Enviar</Button>
      </div>
    </div>
  );
}

function GroupPage({ group, me, posts, allUsers, onPublish, onOpenMembers, onOpenChat }) {
  const groupPosts = posts
    .filter((p) => p.group_id === group.id)
    .sort((a,b)=> (new Date(b.ts||b.created_at)) - (new Date(a.ts||a.created_at)));
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <Avatar className="h-12 w-12">
            {group.avatar ? <AvatarImage src={group.avatar} /> : <AvatarFallback>{initials(group.name)}</AvatarFallback>}
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <div className="text-xs" style={{opacity:.7}}>Admin: {group.admin_id===me?.id?"Tú":(group.admin_id||"").slice(0,6)} · Miembros: {group.members_count ?? "-"}</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onOpenMembers}>Miembros</Button>
            <Button onClick={onOpenChat} className="gap-2"><MessageSquareText/>Chat</Button>
          </div>
        </CardHeader>
      </Card>

      <PostComposer group={group} me={me} onPublish={onPublish} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupPosts.length===0 && (
          <div style={{opacity:.7}}>Aún no hay publicaciones.</div>
        )}
        {groupPosts.map((p) => (
          <PostCard key={p.id} post={p} group={group} author={allUsers.find((u)=>u.id===p.by_user_id)} />
        ))}
      </div>
    </div>
  );
}

function DiscoverList({ groups, myGroups, onOpenGroup, onJoin }) {
  return (
    <div className="grid gap-3">
      {groups.map((g) => (
        <GroupCard key={g.id} group={g} isMember={myGroups.includes(g.id)} onOpen={()=>onOpenGroup(g.id)} onJoin={()=>onJoin(g.id)} />
      ))}
    </div>
  );
}

function Feed({ me, groups, posts }) {
  const myGroupIds = groups.filter((g)=>g._isMine).map((g)=>g.id);
  const visiblePosts = posts
    .filter((p)=>myGroupIds.includes(p.group_id))
    .sort((a,b)=> (new Date(b.ts||b.created_at)) - (new Date(a.ts||a.created_at)));
  return (
    <div className="grid gap-4">
      {visiblePosts.length===0 && <div style={{opacity:.7}}>Tu feed está vacío. Únete a un grupo.</div>}
      {visiblePosts.map((p)=>{
        const group = groups.find((g)=>g.id===p.group_id);
        return <PostCard key={p.id} post={p} group={group} author={p.by_user_id===me?.id?me:null} />;
      })}
    </div>
  );
}

/* ===================== APP PRINCIPAL ===================== */
export default function App() {
  /* Sesión / perfil */
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);

  /* Datos */
  const [groups, setGroups] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [profilesById, setProfilesById] = useState({});

  /* UI */
  const [activeTab, setActiveTab] = useState("feed");
  const [profileOpen, setProfileOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  /* Sesión */
  useEffect(()=>{
    supabase.auth.getSession().then(({ data })=> setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s)=> setSession(s));
    return ()=> sub.subscription.unsubscribe();
  },[]);

  if (!session) return <LoginGate />;

  const meId = session.user.id;

  /* Asegurar perfil */
  useEffect(()=>{
    (async ()=>{
      const { data: p, error } = await supabase.from("profiles").select("*").eq("id", meId).maybeSingle();
      if (error) { console.error("profiles select", error); return; }
      if (!p) {
        const { data: np, error: e2 } = await supabase.from("profiles").insert({ id: meId, name: "" }).select().single();
        if (e2) { console.error("profiles insert", e2); return; }
        setMe(np);
      } else {
        setMe(p);
      }
    })();
  }, [meId]);

  /* Carga principal */
  async function loadAll() {
    // Mis membresías
    const { data: ms } = await supabase.from("memberships").select("*").eq("user_id", meId);
    setMemberships(ms || []);
    const myGroupIds = (ms || []).map(m=>m.group_id);

    // Grupos
    const { data: gs } = await supabase.from("groups").select("*").order("created_at",{ascending:false});
    const marked = (gs||[]).map(g => ({ ...g, _isMine: myGroupIds.includes(g.id) }));
    setGroups(marked);

    // Perfiles (admins + yo) para mostrar nombres
    const adminIds = Array.from(new Set(marked.map(g=>g.admin_id).filter(Boolean).concat(meId)));
    if (adminIds.length) {
      const { data: ps } = await supabase.from("profiles").select("*").in("id", adminIds);
      const map = {}; (ps||[]).forEach(p=>{ map[p.id] = p; });
      setProfilesById(map);
    } else {
      setProfilesById({});
    }

    // Posts (mis grupos)
    if (myGroupIds.length) {
      const { data: ps } = await supabase.from("posts").select("*").in("group_id", myGroupIds).order("ts",{ascending:false}).limit(200);
      setPosts(ps||[]);
    } else {
      setPosts([]);
    }

    // Mensajes (grupo abierto)
    if (openGroupId) {
      const { data: mm } = await supabase.from("messages").select("*").eq("group_id", openGroupId).order("ts",{ascending:true}).limit(200);
      setMessages(mm||[]);
    } else {
      setMessages([]);
    }
  }
  useEffect(()=>{ loadAll(); }, [meId, openGroupId]);

  /* Realtime: posts (mis grupos) */
  useEffect(()=>{
    const myIds = memberships.map(m=>m.group_id);
    if (myIds.length===0) return;
    const ch = supabase.channel("posts-realtime");
    myIds.forEach(gid=>{
      ch.on("postgres_changes",
        { event:"INSERT", schema:"public", table:"posts", filter:`group_id=eq.${gid}` },
        (payload)=> setPosts(cur=>[payload.new, ...cur])
      );
    });
    ch.subscribe();
    return ()=> { supabase.removeChannel(ch); };
  }, [memberships]);

  /* Realtime: mensajes (grupo abierto) */
  useEffect(()=>{
    if (!openGroupId) return;
    const ch = supabase.channel(`msgs-${openGroupId}`)
      .on("postgres_changes",
        { event:"INSERT", schema:"public", table:"messages", filter:`group_id=eq.${openGroupId}` },
        (payload)=> setMessages(cur=>[...cur, payload.new])
      )
      .subscribe();
    return ()=> { supabase.removeChannel(ch); };
  }, [openGroupId]);

  /* Acciones */
  async function updateUser({ name, photo }) {
    const { error } = await supabase.from("profiles").update({ name, photo }).eq("id", meId);
    if (!error) setMe((p)=>({ ...(p||{}), name, photo }));
  }
  async function createGroup({ name, avatar }) {
    const { data: g, error } = await supabase.from("groups").insert({ name, avatar, admin_id: meId }).select().single();
    if (error) { alert(error.message); return; }
    await supabase.from("memberships").insert({ user_id: meId, group_id: g.id });
    setOpenGroupId(g.id);
    setActiveTab("groups");
    await loadAll();
  }
  async function joinGroup(groupId) {
    const { error } = await supabase.from("memberships").insert({ user_id: meId, group_id: groupId });
    if (error) { alert(error.message); return; }
    await loadAll();
  }
  async function publishToGroup(groupId, { image, caption }) {
    const { error } = await supabase.from("posts").insert({ group_id: groupId, by_user_id: meId, image, caption });
    if (error) alert(error.message);
  }
  async function sendGroupMessage(groupId, text) {
    const { error } = await supabase.from("messages").insert({ group_id: groupId, by_user_id: meId, text });
    if (error) alert(error.message);
  }

  /* Derivados para UI */
  const myGroupIds = useMemo(()=> memberships.map(m=>m.group_id), [memberships]);
  const myGroups = useMemo(()=> groups.filter(g=>myGroupIds.includes(g.id)), [groups, myGroupIds]);
  const discover = useMemo(()=> groups.filter(g=>!myGroupIds.includes(g.id)), [groups, myGroupIds]);
  const openGroup = groups.find((g)=>g.id===openGroupId);
  const onboardingNeeded = !me?.name;

  return (
    <AppErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen" style={{background:"white", color:"#111"}}>
          <TopBar user={me} onEditProfile={()=>setProfileOpen(true)} onSignOut={()=>supabase.auth.signOut()} />

          <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid" style={{gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:8}}>
                <TabsTrigger value="feed">Feed</TabsTrigger>
                <TabsTrigger value="groups">Grupos</TabsTrigger>
                <TabsTrigger value="chats">Chats</TabsTrigger>
                <TabsTrigger value="yo">Yo</TabsTrigger>
              </TabsList>

              {/* FEED */}
              <TabsContent value="feed" className="grid gap-4">
                <Feed me={me} groups={groups.map(g=>({...g, _isMine: myGroupIds.includes(g.id)}))} posts={posts} />
              </TabsContent>

              {/* GRUPOS */}
              <TabsContent value="groups" className="grid" style={{gap:24, gridTemplateColumns:"1fr", alignItems:"start"}}>
                <div className="grid gap-4">
                  {openGroup ? (
                    <GroupPage
                      group={openGroup}
                      me={me}
                      posts={posts.filter(p=>p.group_id===openGroup.id)}
                      allUsers={[me]}
                      onPublish={(payload)=>publishToGroup(openGroup.id, payload)}
                      onOpenMembers={()=>setMembersOpen(true)}
                      onOpenChat={()=>setChatOpen(true)}
                    />
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Gestiona tus grupos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm" style={{opacity:.7}}>Selecciona un grupo o crea uno nuevo.</div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="grid gap-3" style={{marginTop:8}}>
                  <NewGroupDialog onCreate={createGroup} />
                  <Separator />
                  <div className="text-sm font-medium">Mis grupos</div>
                  <DiscoverList
                    groups={myGroups}
                    myGroups={myGroupIds}
                    onOpenGroup={(id)=>setOpenGroupId(id)}
                    onJoin={()=>{}}
                  />
                  <Separator />
                  <div className="text-sm font-medium">Descubrir</div>
                  <DiscoverList
                    groups={discover}
                    myGroups={myGroupIds}
                    onOpenGroup={(id)=>setOpenGroupId(id)}
                    onJoin={(id)=>joinGroup(id)}
                  />
                </div>
              </TabsContent>

              {/* CHATS */}
              <TabsContent value="chats" className="grid" style={{gap:24}}>
                <div className="grid gap-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Chats de mis grupos</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                      {myGroups.length===0 && <div className="text-sm" style={{opacity:.7}}>Únete a un grupo para chatear.</div>}
                      {myGroups.map((g) => (
                        <Button key={g.id} className="justify-start" onClick={()=>{ setOpenGroupId(g.id); setActiveTab("groups"); setChatOpen(true); }}>
                          <Avatar className="h-5 w-5" style={{marginRight:8}}>
                            {g.avatar ? <AvatarImage src={g.avatar} /> : <AvatarFallback>{initials(g.name)}</AvatarFallback>}
                          </Avatar>
                          {g.name}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Actividad reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm" style={{opacity:.7}}>
                      Publicaciones y chats que vayas creando aparecerán aquí.
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* YO */}
              <TabsContent value="yo" className="grid gap-4">
                <Card>
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <Avatar className="h-12 w-12">
                      {me?.photo ? <AvatarImage src={me.photo} /> : <AvatarFallback>{initials(me?.name||"")}</AvatarFallback>}
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{me?.name || "Sin nombre"}</CardTitle>
                      <div className="text-xs" style={{opacity:.7}}>{meId}</div>
                    </div>
                    <Button onClick={()=>setProfileOpen(true)}>Editar perfil</Button>
                  </CardHeader>
                </Card>
              </TabsContent>
            </Tabs>
          </main>

          {/* Diálogos */}
          <ProfileDialog open={profileOpen || onboardingNeeded} setOpen={setProfileOpen} user={me} onSave={updateUser} />

          <MembersDialog
            open={membersOpen}
            setOpen={setMembersOpen}
            members={openGroup ? memberships.filter(m=>m.group_id===openGroup.id).map(m=>m.user_id) : []}
            profilesById={profilesById}
            title={openGroup?.name || ""}
          />

          <Dialog open={chatOpen} onOpenChange={setChatOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Chat de {openGroup?.name || ""}</DialogTitle>
              </DialogHeader>
              {openGroup ? (
                <ChatPanel
                  messages={messages}
                  onSend={(t)=>sendGroupMessage(openGroup.id, t)}
                  me={{ id: meId }}
                />
              ) : (
                <div className="text-sm" style={{opacity:.7}}>Selecciona un grupo.</div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </AppErrorBoundary>
  );
}

/* ====== MembersDialog (después de App para evitar hoisting raro) ====== */
function MembersDialog({ open, setOpen, members, profilesById, title }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Miembros de {title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {members.length===0 && <div className="text-sm" style={{opacity:.7}}>Sin miembros.</div>}
          {members.map((uid) => (
            <div key={uid} className="flex items-center gap-2 text-sm">
              <Badge>Miembro</Badge>
              <span>{profilesById[uid]?.name || `Usuario ${uid.slice(0,6)}`}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
