import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase.js";

/** =========================================================
 *  GrupoNet – MVP móvil sin dependencias externas (React)
 *  Funciona con localStorage. Listo para Vercel.
 *  ========================================================= */

const STORAGE_KEY = "groupnet_mobile_mvp_v1";

// ID simple (sin librerías)
function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  ).toUpperCase();
}

// Helpers
function initials(name = "") {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "??";
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function readImageFile(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

// Estado inicial con 3 grupos “semilla”
function makeSeed() {
  const meId = uid();
  return {
    user: { id: meId, name: "", photo: "" },
    groups: [
      {
        id: uid(),
        name: "Amigos Donosti",
        avatar: "",
        adminId: "seed",
        members: [],
        connectionIds: [],
        pendingJoin: [],
        pendingConnect: [],
      },
      {
        id: uid(),
        name: "UPV/EHU Proy. Uni",
        avatar: "",
        adminId: "seed",
        members: [],
        connectionIds: [],
        pendingJoin: [],
        pendingConnect: [],
      },
      {
        id: uid(),
        name: "Familia",
        avatar: "",
        adminId: "seed",
        members: [],
        connectionIds: [],
        pendingJoin: [],
        pendingConnect: [],
      },
    ],
    posts: [], // {id,image,caption,byUserId,groupId,ts}
    messages: [], // {id,groupId?,interGroupId?,byUserId,text,ts}
    interChats: [], // {id,groupA,groupB,name}
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : makeSeed();
  } catch {
    return makeSeed();
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ===================== UI BASICA (estilos móviles) ===================== */

const S = {
  app: {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    background: "#0B0C10",
    color: "#F5F7FA",
    minHeight: "100vh",
  },
  container: { maxWidth: 880, margin: "0 auto", padding: "12px" },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    background: "rgba(11,12,16,0.85)",
    backdropFilter: "blur(6px)",
    borderBottom: "1px solid #1F2937",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  btn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #374151",
    background: "#111827",
    color: "#F9FAFB",
    fontSize: 16,
  },
  btnGhost: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid transparent",
    background: "transparent",
    color: "#E5E7EB",
    fontSize: 14,
  },
  sectionTitle: { margin: "10px 0 6px", fontSize: 14, opacity: 0.8 },
  card: {
    background: "#111827",
    border: "1px solid #1F2937",
    borderRadius: 14,
    padding: 12,
  },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #374151",
    background: "#0B0C10",
    color: "#F9FAFB",
    fontSize: 16,
    outline: "none",
  },
  row: { display: "flex", gap: 8, alignItems: "center" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#1F2937",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  chip: {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 16,
    background: "#1F2937",
    border: "1px solid #374151",
  },
  grid: { display: "grid", gap: 12 },
  gridCols2: { display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" },
};

/* ============================ Componentes ============================= */

function TopBar({ me, onEdit, onReset }) {
  return (
    <div style={S.topbar}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ ...S.avatar, width: 32, height: 32, fontSize: 12 }}>
          {me.photo ? (
            <img
              src={me.photo}
              alt={me.name}
              style={{ width: "100%", height: "100%", borderRadius: "50%" }}
            />
          ) : (
            initials(me.name || "Perfil")
          )}
        </div>
        <div style={{ fontWeight: 700 }}>GrupoNet</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={S.btnGhost} onClick={onEdit}>
          Perfil
        </button>
        <button style={S.btnGhost} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

function ProfileModal({ open, me, onClose, onSave }) {
  const [name, setName] = useState(me.name || "");
  const [photo, setPhoto] = useState(me.photo || "");
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName(me.name || "");
      setPhoto(me.photo || "");
    }
  }, [open, me]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 10,
        display: "grid",
        placeItems: "center",
        padding: 12,
      }}
      onClick={onClose}
    >
      <div style={{ ...S.card, width: "100%", maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Tu perfil</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={S.avatar}>
            {photo ? (
              <img
                src={photo}
                alt="avatar"
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
            ) : (
              initials(name || "P")
            )}
          </div>
          <div style={{ flex: 1 }}>
            <input
              style={{ ...S.input, marginBottom: 8 }}
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div style={S.row}>
              <input
                style={S.input}
                placeholder="URL de foto (opcional)"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const url = await readImageFile(f);
                  setPhoto(url);
                }}
              />
              <button style={S.btn} onClick={() => fileRef.current?.click()}>
                Subir
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button style={S.btnGhost} onClick={onClose}>
            Cancelar
          </button>
          <button
            style={S.btn}
            onClick={() => {
              onSave({ name, photo });
              onClose();
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function NewGroupCard({ onCreate }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const fileRef = useRef(null);

  return (
    <div style={S.card}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Crear grupo</div>
      <input
        style={{ ...S.input, marginBottom: 8 }}
        placeholder="Nombre del grupo"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div style={S.row}>
        <input
          style={S.input}
          placeholder="URL avatar (opcional)"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = await readImageFile(f);
            setAvatar(url);
          }}
        />
        <button style={S.btn} onClick={() => fileRef.current?.click()}>
          Subir
        </button>
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
        <button
          style={S.btn}
          onClick={() => {
            const nm = name.trim();
            if (!nm) return;
            onCreate({ name: nm, avatar });
            setName("");
            setAvatar("");
          }}
        >
          Crear
        </button>
      </div>
    </div>
  );
}

function GroupListItem({ g, isMember, pending, onOpen, onJoin }) {
  return (
    <div
      style={{ ...S.card, display: "flex", alignItems: "center", gap: 10 }}
      onClick={onOpen}
    >
      <div style={{ ...S.avatar, width: 40, height: 40 }}>
        {g.avatar ? (
          <img
            src={g.avatar}
            alt={g.name}
            style={{ width: "100%", height: "100%", borderRadius: "50%" }}
          />
        ) : (
          initials(g.name)
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{g.name}</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>Miembros: {g.members.length}</div>
      </div>
      {isMember ? (
        <span style={S.chip}>Miembro</span>
      ) : pending ? (
        <span style={S.chip}>Pendiente</span>
      ) : (
        <button
          style={S.btn}
          onClick={(e) => {
            e.stopPropagation();
            onJoin();
          }}
        >
          Unirme
        </button>
      )}
    </div>
  );
}

function PostComposer({ me, group, onPublish }) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState("");
  const fileRef = useRef(null);

  return (
    <div style={S.card}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Publicar en {group.name}</div>
      <input
        style={{ ...S.input, marginBottom: 8 }}
        placeholder="Pie (opcional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <div style={S.row}>
        <input
          style={S.input}
          placeholder="URL de imagen"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = await readImageFile(f);
            setImage(url);
          }}
        />
        <button style={S.btn} onClick={() => fileRef.current?.click()}>
          Cámara
        </button>
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
        <button
          style={S.btn}
          onClick={() => {
            if (!image) return;
            onPublish({ image, caption });
            setImage("");
            setCaption("");
          }}
        >
          Publicar
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, group, authorName }) {
  return (
    <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ ...S.avatar, width: 32, height: 32, fontSize: 12 }}>
          {group.avatar ? (
            <img
              src={group.avatar}
              alt={group.name}
              style={{ width: "100%", height: "100%", borderRadius: "50%" }}
            />
          ) : (
            initials(group.name)
          )}
        </div>
        <div style={{ fontSize: 14 }}>
          <div style={{ fontWeight: 700 }}>{group.name}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {authorName} · {timeAgo(post.ts)}
          </div>
        </div>
      </div>
      {post.image && (
        <img
          src={post.image}
          alt={post.caption || "post"}
          style={{ width: "100%", maxHeight: 420, objectFit: "cover" }}
        />
      )}
      {post.caption && (
        <div style={{ padding: 12, fontSize: 14 }}>{post.caption}</div>
      )}
    </div>
  );
}

function ChatPanel({ me, messages, onSend }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    <div style={{ ...S.card, padding: 0, display: "flex", flexDirection: "column", height: 320 }}>
      <div style={{ padding: 10, overflowY: "auto", flex: 1 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              maxWidth: "80%",
              margin: m.byUserId === me.id ? "6px 0 6px auto" : "6px 0",
              background: m.byUserId === me.id ? "#2563EB" : "#1F2937",
              color: "#fff",
              borderRadius: 14,
              padding: "8px 10px",
              fontSize: 14,
            }}
          >
            <div style={{ opacity: 0.7, fontSize: 11, marginBottom: 2 }}>
              {timeAgo(m.ts)}
            </div>
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 10, borderTop: "1px solid #1F2937", display: "flex", gap: 8 }}>
        <input
          style={S.input}
          placeholder="Escribe un mensaje…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              onSend(text.trim());
              setText("");
            }
          }}
        />
        <button
          style={S.btn}
          onClick={() => {
            if (!text.trim()) return;
            onSend(text.trim());
            setText("");
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

/* =============================== APP =============================== */

export default function App() {
  const [state, setState] = useState(load());
  const [tab, setTab] = useState("feed");
  const [profileOpen, setProfileOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [openIGId, setOpenIGId] = useState(null);

  const me = state.user;

  useEffect(() => save(state), [state]);
  useEffect(() => {
    if (!me.name) setProfileOpen(true);
  }, [me.name]);

  // Derivados
  const myGroups = useMemo(
    () => state.groups.filter((g) => g.members.includes(me.id)),
    [state.groups, me.id]
  );
  const pendingForMe = useMemo(
    () =>
      state.groups
        .filter((g) => g.pendingJoin.includes(me.id))
        .map((g) => g.id),
    [state.groups, me.id]
  );

  // Acciones
  function updateUser({ name, photo }) {
    setState((s) => ({ ...s, user: { ...s.user, name, photo } }));
  }
  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setState(makeSeed());
    setProfileOpen(true);
  }
  function createGroup({ name, avatar }) {
    const id = uid();
    const g = {
      id,
      name,
      avatar,
      adminId: me.id,
      members: [me.id],
      connectionIds: [],
      pendingJoin: [],
      pendingConnect: [],
    };
    setState((s) => ({ ...s, groups: [g, ...s.groups] }));
    setTab("groups");
    setOpenGroupId(id);
  }
  function requestJoin(groupId) {
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) =>
        g.id === groupId
          ? { ...g, pendingJoin: Array.from(new Set([...g.pendingJoin, me.id])) }
          : g
      ),
    }));
  }
  function approveJoin(groupId, userId) {
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: Array.from(new Set([...g.members, userId])),
              pendingJoin: g.pendingJoin.filter((u) => u !== userId),
            }
          : g
      ),
    }));
  }
  function publishToGroup(groupId, { image, caption }) {
    const post = { id: uid(), image, caption, byUserId: me.id, groupId, ts: Date.now() };
    setState((s) => ({ ...s, posts: [post, ...s.posts] }));
  }
  function sendGroupMessage(groupId, text) {
    const msg = { id: uid(), groupId, byUserId: me.id, text, ts: Date.now() };
    setState((s) => ({ ...s, messages: [...s.messages, msg] }));
  }
  function requestConnect(fromGroupId, toGroupId) {
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) => {
        if (g.id !== toGroupId) return g;
        const exists = (g.pendingConnect || []).some(
          (r) => r.fromGroupId === fromGroupId && r.toGroupId === toGroupId
        );
        const next = exists ? g.pendingConnect : [...(g.pendingConnect || []), { fromGroupId, toGroupId }];
        return { ...g, pendingConnect: next };
      }),
    }));
  }
  function approveConnect(myGroupId, fromGroupId) {
    setState((s) => {
      const groups = s.groups.map((g) => {
        if (g.id === myGroupId)
          return {
            ...g,
            connectionIds: Array.from(new Set([...g.connectionIds, fromGroupId])),
            pendingConnect: (g.pendingConnect || []).filter(
              (r) => !(r.fromGroupId === fromGroupId && r.toGroupId === myGroupId)
            ),
          };
        if (g.id === fromGroupId)
          return { ...g, connectionIds: Array.from(new Set([...g.connectionIds, myGroupId])) };
        return g;
      });
      const exists = s.interChats.find(
        (ic) =>
          (ic.groupA === myGroupId && ic.groupB === fromGroupId) ||
          (ic.groupA === fromGroupId && ic.groupB === myGroupId)
      );
      const interChats = exists
        ? s.interChats
        : [...s.interChats, { id: uid(), groupA: myGroupId, groupB: fromGroupId, name: "Intergrupo" }];
      return { ...s, groups, interChats };
    });
  }
  function sendInterGroupMessage(interGroupId, text) {
    const msg = { id: uid(), interGroupId, byUserId: me.id, text, ts: Date.now() };
    setState((s) => ({ ...s, messages: [...s.messages, msg] }));
  }

  // Vistas
  const openGroup = state.groups.find((g) => g.id === openGroupId);
  const myInterChats = state.interChats.filter(
    (ic) => myGroups.some((g) => g.id === ic.groupA || g.id === ic.groupB)
  );

  // Feed: posts de mis grupos + conectados
  const feedPosts = useMemo(() => {
    const myIds = new Set(myGroups.map((g) => g.id));
    const connected = new Set();
    state.groups.forEach((g) => {
      if (myIds.has(g.id)) g.connectionIds.forEach((cid) => connected.add(cid));
    });
    const visible = new Set([...myIds, ...Array.from(connected)]);
    return state.posts
      .filter((p) => visible.has(p.groupId))
      .sort((a, b) => b.ts - a.ts);
  }, [state.posts, state.groups, myGroups]);

  return (
    <div style={S.app}>
      <TopBar me={me} onEdit={() => setProfileOpen(true)} onReset={resetAll} />

      {/* Tabs */}
      <div style={{ ...S.container, paddingTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {["feed", "groups", "chats", "yo"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...S.btn,
                padding: "10px 6px",
                fontSize: 14,
                border:
                  tab === t ? "2px solid #2563EB" : "1px solid #374151",
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ ...S.container, paddingBottom: 80 }}>
        {tab === "feed" && (
          <div style={S.grid}>
            {feedPosts.length === 0 && (
              <div style={{ opacity: 0.7 }}>
                Tu feed está vacío. Únete a un grupo o conecta grupos.
              </div>
            )}
            {feedPosts.map((p) => {
              const g = state.groups.find((gg) => gg.id === p.groupId);
              const authorName = p.byUserId === me.id ? "Tú" : "Miembro";
              return (
                <PostCard
                  key={p.id}
                  post={p}
                  group={g || { name: "Grupo", avatar: "" }}
                  authorName={authorName}
                />
              );
            })}
          </div>
        )}

        {tab === "groups" && (
          <div className="groups" style={{ display: "grid", gap: 12 }}>
            {/* Panel izquierdo: grupo abierto o vacío */}
            <div style={{ ...S.grid }}>
              {openGroup ? (
                <>
                  <div style={{ ...S.card }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ ...S.avatar, width: 56, height: 56 }}>
                        {openGroup.avatar ? (
                          <img
                            src={openGroup.avatar}
                            alt={openGroup.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                            }}
                          />
                        ) : (
                          initials(openGroup.name)
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>
                          {openGroup.name}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                          Admin:{" "}
                          {openGroup.adminId === me.id
                            ? "Tú"
                            : openGroup.adminId.slice(0, 6)}{" "}
                          · Miembros: {openGroup.members.length}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        style={S.btn}
                        onClick={() => {
                          const txt = prompt("Mensaje para el chat del grupo:");
                          if (txt?.trim()) sendGroupMessage(openGroup.id, txt.trim());
                        }}
                      >
                        Chat grupo
                      </button>
                      <button
                        style={S.btn}
                        onClick={() => {
                          const options = state.groups.filter(
                            (g) =>
                              g.id !== openGroup.id &&
                              !openGroup.connectionIds.includes(g.id)
                          );
                          if (options.length === 0) {
                            alert("No hay grupos disponibles para conectar.");
                            return;
                          }
                          const names = options.map((o, i) => `${i + 1}) ${o.name}`).join("\n");
                          const pick = prompt(
                            `Conectar ${openGroup.name} con...\n${names}\nEscribe el número:`
                          );
                          const idx = Number(pick) - 1;
                          const target = options[idx];
                          if (target) requestConnect(openGroup.id, target.id);
                        }}
                      >
                        Conectar
                      </button>
                      <button
                        style={S.btn}
                        onClick={() => {
                          // Revisar solicitudes (join + connect) del grupo abierto
                          const joins = openGroup.pendingJoin;
                          const connects = openGroup.pendingConnect || [];
                          const canAdmin = openGroup.adminId === me.id;
                          if (!canAdmin) {
                            alert("Solo el admin puede gestionar solicitudes.");
                            return;
                          }
                          if (joins.length === 0 && connects.length === 0) {
                            alert("No hay solicitudes pendientes.");
                            return;
                          }
                          // Aprobar una join
                          if (joins.length) {
                            const user = joins[0];
                            approveJoin(openGroup.id, user);
                            alert("Solicitud de unión aprobada.");
                            return;
                          }
                          // Aprobar una connect
                          if (connects.length) {
                            const from = connects[0].fromGroupId;
                            approveConnect(openGroup.id, from);
                            alert("Conexión entre grupos aprobada.");
                            return;
                          }
                        }}
                      >
                        Solicitudes
                      </button>
                    </div>
                  </div>

                  <PostComposer
                    me={me}
                    group={openGroup}
                    onPublish={(payload) => publishToGroup(openGroup.id, payload)}
                  />

                  {/* Posts del grupo */}
                  <div style={S.grid}>
                    {state.posts.filter((p) => p.groupId === openGroup.id).length === 0 && (
                      <div style={{ opacity: 0.7 }}>Aún no hay publicaciones.</div>
                    )}
                    {state.posts
                      .filter((p) => p.groupId === openGroup.id)
                      .sort((a, b) => b.ts - a.ts)
                      .map((p) => (
                        <PostCard
                          key={p.id}
                          post={p}
                          group={openGroup}
                          authorName={p.byUserId === me.id ? "Tú" : "Miembro"}
                        />
                      ))}
                  </div>

                  {/* Chat del grupo */}
                  <ChatPanel
                    me={me}
                    messages={state.messages
                      .filter((m) => m.groupId === openGroup.id && !m.interGroupId)
                      .sort((a, b) => a.ts - b.ts)}
                    onSend={(text) => sendGroupMessage(openGroup.id, text)}
                  />
                </>
              ) : (
                <div style={S.card}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    Gestiona tus grupos
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 14 }}>
                    Crea o abre un grupo desde la lista.
                  </div>
                </div>
              )}
            </div>

            {/* Panel derecho: crear/descubrir */}
            <div style={S.grid}>
              <NewGroupCard onCreate={createGroup} />

              <div style={S.sectionTitle}>Mis grupos</div>
              <div style={S.grid}>
                {state.groups
                  .filter((g) => g.members.includes(me.id))
                  .map((g) => (
                    <GroupListItem
                      key={g.id}
                      g={g}
                      isMember
                      pending={false}
                      onOpen={() => setOpenGroupId(g.id)}
                      onJoin={() => {}}
                    />
                  ))}
              </div>

              <div style={S.sectionTitle}>Descubrir</div>
              <div style={S.grid}>
                {state.groups
                  .filter((g) => !g.members.includes(me.id))
                  .map((g) => (
                    <GroupListItem
                      key={g.id}
                      g={g}
                      isMember={false}
                      pending={pendingForMe.includes(g.id)}
                      onOpen={() => setOpenGroupId(g.id)}
                      onJoin={() => requestJoin(g.id)}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {tab === "chats" && (
          <div style={S.grid}>
            <div style={{ ...S.card }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Chats de mis grupos</div>
              <div style={S.grid}>
                {myGroups.length === 0 && <div style={{ opacity: 0.7 }}>Únete a un grupo.</div>}
                {myGroups.map((g) => (
                  <button
                    key={g.id}
                    style={S.btn}
                    onClick={() => {
                      setOpenGroupId(g.id);
                      setTab("groups");
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...S.card }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Chats intergrupales</div>
              <div style={S.grid}>
                {myInterChats.length === 0 && (
                  <div style={{ opacity: 0.7 }}>
                    Conecta dos grupos para abrir chat común.
                  </div>
                )}
                {myInterChats.map((ic) => {
                  const gA = state.groups.find((g) => g.id === ic.groupA);
                  const gB = state.groups.find((g) => g.id === ic.groupB);
                  return (
                    <button
                      key={ic.id}
                      style={S.btn}
                      onClick={() => setOpenIGId(ic.id)}
                    >
                      {gA?.name} ↔ {gB?.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal simple para chat intergrupal */}
            {openIGId && (
              <div
                onClick={() => setOpenIGId(null)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "grid",
                  placeItems: "center",
                  padding: 12,
                  zIndex: 10,
                }}
              >
                <div
                  style={{ ...S.card, width: "100%", maxWidth: 600 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const inter = state.interChats.find((ic) => ic.id === openIGId);
                    if (!inter) return <div>No encontrado</div>;
                    const gA = state.groups.find((g) => g.id === inter.groupA);
                    const gB = state.groups.find((g) => g.id === inter.groupB);
                    return (
                      <>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>
                          Chat entre {gA?.name} y {gB?.name}
                        </div>
                        <ChatPanel
                          me={me}
                          messages={state.messages
                            .filter((m) => m.interGroupId === openIGId)
                            .sort((a, b) => a.ts - b.ts)}
                          onSend={(text) => sendInterGroupMessage(openIGId, text)}
                        />
                        <div style={{ marginTop: 8, textAlign: "right" }}>
                          <button style={S.btnGhost} onClick={() => setOpenIGId(null)}>
                            Cerrar
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "yo" && (
          <div style={S.grid}>
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Tu perfil</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={S.avatar}>
                  {me.photo ? (
                    <img
                      src={me.photo}
                      alt={me.name}
                      style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                    />
                  ) : (
                    initials(me.name || "Perfil")
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{me.name || "Sin nombre"}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{me.id}</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <button style={S.btn} onClick={() => setProfileOpen(true)}>
                  Editar perfil
                </button>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Tips para móviles</div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Usa el botón <b>Cámara</b> para subir una foto al post.</li>
                <li>Guarda estado automático en este dispositivo (localStorage).</li>
                <li>Para multiusuario real, añadiremos Supabase (siguiente paso).</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <ProfileModal
        open={profileOpen || !me.name}
        me={me}
        onClose={() => setProfileOpen(false)}
        onSave={updateUser}
      />
    </div>
  );
}
