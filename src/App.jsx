import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase.js";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});


/* --- Tus imports de UI (mantenlos como ya tenías) --- */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Check, Image as ImageIcon, Link2, MessageSquareText, Plus, Send, Users } from "lucide-react";

/* =============== Utilidades =============== */
function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => (p[0] || "").toUpperCase()).join("") || "?";
}
function timeAgo(ts) {
  const d = typeof ts === "string" ? new Date(ts).getTime() : ts;
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const dd = Math.floor(h / 24); return `${dd}d`;
}
function dataUrlFromFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/* =============== Login simple =============== */
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
          <div className="text-xs text-muted-foreground">
            Si el enlace vuelve al login en bucle, abre el link en el <b>navegador</b> (no dentro de la app de correo) y revisa en Supabase → Auth → URL que esté tu dominio de Vercel.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =============== Componentes UI =============== */
function TopBar({ user, onEditProfile, onSignOut }) {
  return (
    <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <span className="font-bold text-lg">GrupoNet · Supabase</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onEditProfile} className="gap-2">
            <Avatar className="h-6 w-6">
              {user?.photo ? <AvatarImage src={user.photo} alt={user.name} /> : <AvatarFallback>{initials(user?.name||"")}</AvatarFallback>}
            </Avatar>
            <span className="hidden sm:inline">{user?.name || "Perfil"}</span>
          </Button>
          <Button variant="outline" onClick={onSignOut}>Salir</Button>
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
              <Button variant="outline" onClick={()=>fileRef.current?.click()} className="gap-2"><ImageIcon className="h-4 w-4"/>Subir</Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Button>
          <Button onClick={()=>{ onSave({ name, photo }); setOpen(false); }}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupCard({ group, isMember, onOpen, onJoinRequest }) {
  return (
    <Card className="hover:shadow-md transition cursor-pointer" onClick={onOpen}>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Avatar className="h-10 w-10">
          {group.avatar ? <AvatarImage src={group.avatar} alt={group.name} /> : <AvatarFallback>{initials(group.name)}</AvatarFallback>}
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-base">{group.name}</CardTitle>
          <div className="text-xs text-muted-foreground">Miembros: {group.members_count ?? "-"}</div>
        </div>
        {isMember ? (
          <Badge variant="secondary">Miembro</Badge>
        ) : (
          <Button size="sm" onClick={(e)=>{ e.stopPropagation(); onJoinRequest(); }}>Unirme</Button>
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
        <Button className="gap-2"><Plus className="h-4 w-4"/>Crear grupo</Button>
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
            <Button variant="outline" onClick={()=>fileRef.current?.click()} className="gap-2"><ImageIcon className="h-4 w-4"/>Subir</Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Button>
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
          <Button variant="outline" onClick={()=>fileRef.current?.click()} className="gap-2"><ImageIcon className="h-4 w-4"/>Subir</Button>
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
          <div className="text-xs text-muted-foreground">por {author?.name || "Miembro"} · {timeAgo(post.ts || post.created_at)}</div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {post.image && (
          <img src={post.image} alt={post.caption||"post"} className="w-full max-h-[420px] object-cover" />
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
    <div className="flex flex-col h-96 border rounded-xl overflow-hidden">
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.by_user_id===me?.id?"bg-primary text-primary-foreground ml-auto":"bg-muted"}`}>
              <div className="opacity-70 text-xs pb-0.5">{timeAgo(m.ts || m.created_at)}</div>
              <div>{m.text}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-2 flex gap-2">
        <Input placeholder="Escribe un mensaje..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ if(!text.trim()) return; onSend(text.trim()); setText(""); } }} />
        <Button onClick={()=>{ if(!text.trim()) return; onSend(text.trim()); setText(""); }} className="gap-2"><Send className="h-4 w-4"/>Enviar</Button>
      </div>
    </div>
  );
}

function GroupPage({ group, me, posts, allUsers, onPublish, onOpenMembers, onOpenChat }) {
  const groupPosts = posts.filter((p) => p.group_id === group.id).sort((a,b)=> (new Date(b.ts||b.created_at)) - (new Date(a.ts||a.created_at)));
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <Avatar className="h-12 w-12">
            {group.avatar ? <AvatarImage src={group.avatar} /> : <AvatarFallback>{initials(group.name)}</AvatarFallback>}
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <div className="text-xs text-muted-foreground">Admin: {group.admin_id===me?.id?"Tú":(group.admin_id||"").slice(0,6)} · Miembros: {group.members_count ?? "-"}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onOpenMembers}>Miembros</Button>
            <Button onClick={onOpenChat} className="gap-2"><MessageSquareText className="h-4 w-4"/>Chat</Button>
          </div>
        </CardHeader>
      </Card>

      <PostComposer group={group} me={me} onPublish={onPublish} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupPosts.length===0 && (
          <div className="text-muted-foreground">Aún no hay publicaciones.</div>
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
        <GroupCard key={g.id} group={g} isMember={myGroups.includes(g.id)} onOpen={()=>onOpenGroup(g.id)} onJoinRequest={()=>onJoin(g.id)} />
      ))}
    </div>
  );
}

function Feed({ me, groups, posts }) {
  // Posts de mis grupos
  const myGroupIds = groups.filter((g)=>g._isMine).map((g)=>g.id);
  const visiblePosts = posts.filter((p)=>myGroupIds.includes(p.group_id))
    .sort((a,b)=> (new Date(b.ts||b.created_at)) - (new Date(a.ts||a.created_at)));
  return (
    <div className="grid gap-4">
      {visiblePosts.length===0 && <div className="text-muted-foreground">Tu feed está vacío. Únete a un grupo.</div>}
      {visiblePosts.map((p)=>{
        const group = groups.find((g)=>g.id===p.group_id);
        return <PostCard key={p.id} post={p} group={group} author={p.by_user_id===me?.id?me:null} />
      })}
    </div>
  );
}

function MembersDialog({ open, setOpen, members, profilesById, title }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Miembros de {title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {members.length===0 && <div className="text-sm text-muted-foreground">Sin miembros.</div>}
          {members.map((uid) => (
            <div key={uid} className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">Miembro</Badge>
              <span>{profilesById[uid]?.name || `Usuario ${uid.slice(0,6)}`}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* =============== APP PRINCIPAL (Supabase + UI guapa) =============== */
export default function App() {
  /* --- Sesión y perfil --- */
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null); // profiles row

  /* --- Datos principales --- */
  const [groups, setGroups] = useState([]);           // todas (añadimos flag _isMine para UX)
  const [memberships, setMemberships] = useState([]); // mis membresías
  const [posts, setPosts] = useState([]);             // posts visibles (mis grupos)
  const [messages, setMessages] = useState([]);       // mensajes del grupo abierto
  const [profilesById, setProfilesById] = useState({});

  /* --- UI state --- */
  const [activeTab, setActiveTab] = useState("feed");
  const [profileOpen, setProfileOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  /* --- Sesión --- */
  useEffect(()=>{
    supabase.auth.getSession().then(({ data })=> setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s)=> setSession(s));
    return ()=> sub.subscription.unsubscribe();
  },[]);

  if (!session) return <LoginGate />;

  const meId = session.user.id;

  /* --- Asegurar perfil --- */
  useEffect(()=>{
    (async ()=>{
      const { data: p } = await supabase.from("profiles").select("*").eq("id", meId).maybeSingle();
      if (!p) {
        const { data: np } = await supabase.from("profiles").insert({ id: meId, name: "" }).select().single();
        setMe(np);
      } else {
        setMe(p);
      }
    })();
  }, [meId]);

  /* --- Carga principal --- */
  async function loadAll() {
    // mis membresías
    const { data: ms } = await supabase.from("memberships").select("*").eq("user_id", meId);
    setMemberships(ms || []);
    const myGroupIds = (ms || []).map(m=>m.group_id);

    // grupos
    const { data: gs } = await supabase.from("groups").select("*").order("created_at",{ascending:false});
    const marked = (gs||[]).map(g => ({ ...g, _isMine: myGroupIds.includes(g.id) }));
    setGroups(marked);

    // perfiles (ligeros): de admins de grupos + mi perfil (para mostrar nombres)
    const adminIds = Array.from(new Set(marked.map(g=>g.admin_id).filter(Boolean).concat(meId)));
    if (adminIds.length) {
      const { data: ps } = await supabase.from("profiles").select("*").in("id", adminIds);
      const map = {};
      (ps||[]).forEach(p=>{ map[p.id] = p; });
      setProfilesById(map);
    }

    // posts de mis grupos
    if (myGroupIds.length) {
      const { data: ps } = await supabase
        .from("posts").select("*").in("group_id", myGroupIds)
        .order("ts",{ascending:false}).limit(200);
      setPosts(ps||[]);
    } else {
      setPosts([]);
    }

    // mensajes del grupo abierto
    if (openGroupId) {
      const { data: ms2 } = await supabase
        .from("messages").select("*").eq("group_id", openGroupId)
        .order("ts",{ascending:true}).limit(200);
      setMessages(ms2||[]);
    } else {
      setMessages([]);
    }
  }
  useEffect(()=>{ loadAll(); }, [meId, openGroupId]);

  /* --- Realtime posts (mis grupos) --- */
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

  /* --- Realtime mensajes (grupo abierto) --- */
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

  /* --- Acciones --- */
  async function updateUser({ name, photo }) {
    const { error } = await supabase.from("profiles").update({ name, photo }).eq("id", meId);
    if (!error) setMe((p)=>({ ...(p||{}), name, photo }));
  }
  async function createGroup({ name, avatar }) {
    const { data: g, error } = await supabase.from("groups").insert({ name, avatar, admin_id: meId }).select().single();
    if (error) return alert(error.message);
    await supabase.from("memberships").insert({ user_id: meId, group_id: g.id });
    setOpenGroupId(g.id);
    setActiveTab("groups");
    await loadAll();
  }
  async function joinGroup(groupId) {
    const { error } = await supabase.from("memberships").insert({ user_id: meId, group_id: groupId });
    if (error) return alert(error.message);
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

  /* --- Derivados para la UI --- */
  const myGroupIds = useMemo(()=> memberships.map(m=>m.group_id), [memberships]);
  const myGroups = useMemo(()=> groups.filter(g=>myGroupIds.includes(g.id)), [groups, myGroupIds]);
  const discover = useMemo(()=> groups.filter(g=>!myGroupIds.includes(g.id)), [groups, myGroupIds]);

  const openGroup = groups.find((g)=>g.id===openGroupId);

  const onboardingNeeded = !me?.name;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <TopBar user={me} onEditProfile={()=>setProfileOpen(true)} onSignOut={()=>supabase.auth.signOut()} />

        <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
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
            <TabsContent value="groups" className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid gap-4">
                {/* Grupo abierto */}
                {openGroup ? (
                  <GroupPage
                    group={openGroup}
                    me={me}
                    posts={posts.filter(p=>p.group_id===openGroup.id)}
                    allUsers={[me]} // para autor local; podrías ampliar con profilesById
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
                      <div className="text-sm text-muted-foreground">Selecciona un grupo de la derecha o crea uno nuevo.</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid gap-3">
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
            <TabsContent value="chats" className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Chats de mis grupos</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {myGroups.length===0 && <div className="text-sm text-muted-foreground">Únete a un grupo para chatear.</div>}
                    {myGroups.map((g) => (
                      <Button key={g.id} variant="outline" className="justify-start" onClick={()=>{ setOpenGroupId(g.id); setActiveTab("groups"); setChatOpen(true); }}>
                        <Avatar className="h-5 w-5 mr-2">
                          {g.avatar ? <AvatarImage src={g.avatar} /> : <AvatarFallback>{initials(g.name)}</AvatarFallback>}
                        </Avatar>
                        {g.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actividad reciente</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
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
                    <div className="text-xs text-muted-foreground">{meId}</div>
                  </div>
                  <Button variant="outline" onClick={()=>setProfileOpen(true)}>Editar perfil</Button>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Dialogos */}
        <ProfileDialog open={profileOpen || onboardingNeeded} setOpen={setProfileOpen} user={me} onSave={updateUser} />

        <MembersDialog
          open={membersOpen}
          setOpen={setMembersOpen}
          members={
            openGroup
              ? memberships.filter(m=>m.group_id===openGroup.id).map(m=>m.user_id)
              : []
          }
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
              <div className="text-sm text-muted-foreground">Selecciona un grupo.</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
