import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // 🔹 Manejo de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // 🔹 Cargar perfil cuando hay sesión
  useEffect(() => {
    if (session) {
      loadProfile();
      loadGroups();
    }
  }, [session]);

  async function loadProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    } else {
      // si no existe, crear perfil vacío
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert([{ id: session.user.id, name: "Nuevo usuario" }])
        .select()
        .single();
      setProfile(newProfile);
    }
  }

  async function loadGroups() {
    const { data } = await supabase.from("groups").select("*");
    setGroups(data || []);
  }

  async function loadPosts(groupId) {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("group_id", groupId)
      .order("ts", { ascending: false });
    setPosts(data || []);
  }

  async function loadMessages(groupId) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("group_id", groupId)
      .order("ts", { ascending: true });
    setMessages(data || []);
  }

  // 🔹 Enviar login
async function signInWithEmail() {
  setLoading(true);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin } // 👈 clave
  });
  setLoading(false);
  if (error) alert(error.message);
  else alert("Revisa tu email");
}


  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  // 🔹 Crear grupo
  async function createGroup() {
    const name = prompt("Nombre del grupo:");
    if (!name) return;
    const { data, error } = await supabase
      .from("groups")
      .insert([{ name, admin_id: session.user.id }])
      .select()
      .single();
    if (error) alert(error.message);
    else {
      setGroups([data, ...groups]);
    }
  }

  // 🔹 Crear post
  async function createPost() {
    const caption = prompt("Texto del post:");
    if (!caption || !currentGroup) return;
    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          group_id: currentGroup.id,
          by_user_id: session.user.id,
          image: "https://via.placeholder.com/400",
          caption,
        },
      ])
      .select()
      .single();
    if (error) alert(error.message);
    else setPosts([data, ...posts]);
  }

  // 🔹 Enviar mensaje
  async function sendMessage() {
    if (!newMessage || !currentGroup) return;
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          group_id: currentGroup.id,
          by_user_id: session.user.id,
          text: newMessage,
        },
      ])
      .select()
      .single();
    if (!error && data) {
      setMessages([...messages, data]);
      setNewMessage("");
    }
  }

  // 🔹 Suscribirse a mensajes en tiempo real
  useEffect(() => {
    if (!currentGroup) return;
    const channel = supabase
      .channel("room-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${currentGroup.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentGroup]);

  // 🔹 Interfaz
  if (!session) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={signInWithEmail} disabled={loading}>
          {loading ? "Enviando..." : "Entrar con email"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Hola {profile?.name || "usuario"}</h2>
      <button onClick={signOut}>Salir</button>

      <h3>Grupos</h3>
      <button onClick={createGroup}>Crear grupo</button>
      <ul>
        {groups.map((g) => (
          <li key={g.id}>
            <button
              onClick={() => {
                setCurrentGroup(g);
                loadPosts(g.id);
                loadMessages(g.id);
              }}
            >
              {g.name}
            </button>
          </li>
        ))}
      </ul>

      {currentGroup && (
        <div>
          <h3>{currentGroup.name}</h3>
          <button onClick={createPost}>Nuevo post</button>
          <h4>Posts</h4>
          <ul>
            {posts.map((p) => (
              <li key={p.id}>{p.caption}</li>
            ))}
          </ul>
          <h4>Chat</h4>
          <div style={{ border: "1px solid #ccc", padding: 10, height: 200, overflowY: "scroll" }}>
            {messages.map((m) => (
              <div key={m.id}>{m.text}</div>
            ))}
          </div>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
          />
          <button onClick={sendMessage}>Enviar</button>
        </div>
      )}
    </div>
  );
}
