import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, Badge } from "../../components/ui";
import { Modal, Labeled } from "../../components/Modal";
import { IconSearch, IconSend, IconPaperclip, IconVideo, IconPlus, IconChat } from "../../icons";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import { useAuth } from "../../lib/auth";
import type { Message, ChatRoom } from "../../lib/types";

// Gerçek zamanlı sohbet: odalar, mesajlar, çevrimiçi kullanıcılar, online toplantı (Jitsi). DB'den yüklenir.
export function Chat() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const nav = useNavigate();
  const { data, loading, reload } = useData(
    () => Promise.all([api.listRooms(), api.listUsers(), api.listOnlineUsers()]),
    []
  );
  const rooms = data?.[0] ?? [];
  const users = data?.[1] ?? [];
  const onlineIds = data?.[2] ?? [];

  // Yeni sohbet modalı
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMembers, setNewMembers] = useState<number[]>([]);
  const createRoom = async () => {
    const isGroup = newMembers.length !== 1;
    const name = newName.trim() || (isGroup ? "Yeni Grup" : users.find((u) => u.id === newMembers[0])?.full_name ?? "Sohbet");
    const id = await api.createRoom(name, isGroup, newMembers);
    setCreateOpen(false);
    setNewName("");
    setNewMembers([]);
    reload();
    nav(`/sohbet/${id}`);
  };
  const toggleMember = (id: number) =>
    setNewMembers((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  // Aktif oda URL'den (/sohbet/:roomId); yoksa ilk oda.
  const urlId = roomId ? Number(roomId) : null;
  const activeRoom: ChatRoom | null = rooms.find((r) => r.id === urlId) ?? rooms[0] ?? null;
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadedRoom, setLoadedRoom] = useState<number | null>(null);

  // Aktif oda değişince mesajları yükle.
  if (activeRoom && loadedRoom !== activeRoom.id) {
    setLoadedRoom(activeRoom.id);
    api.listMessages(activeRoom.id).then(setMessages);
  }

  const selectRoom = (room: ChatRoom) => nav(`/sohbet/${room.id}`);

  const send = async () => {
    if (!draft.trim() || !activeRoom) return;
    const body = draft;
    setDraft("");
    setMessages((m) => [
      ...m,
      { id: Date.now(), room_id: activeRoom.id, sender_id: user?.id ?? 0, body, created_at: "" },
    ]);
    await api.sendMessage(activeRoom.id, body);
  };

  if (loading) return <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 220px", gap: 0, height: "calc(100vh - var(--topbar-h) - 96px)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--surface)" }}>
      {/* Oda listesi */}
      <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 14, borderBottom: "1px solid var(--border-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, flex: 1 }}>Sohbetler</h3>
            <button className="btn-ghost btn-sm" title="Yeni sohbet" onClick={() => setCreateOpen(true)}><IconPlus size={16} /></button>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 9, padding: "0 11px", height: 36, color: "var(--faint)" }}>
            <IconSearch size={15} />
            <input placeholder="Ara…" style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13 }} />
          </label>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {rooms.length === 0 && (
            <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--faint)", fontSize: 13 }}>
              <div style={{ marginBottom: 10 }}>Henüz sohbet yok</div>
              <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
                <IconPlus size={14} /> Yeni Sohbet
              </button>
            </div>
          )}
          {rooms.map((r) => (
            <div
              key={r.id}
              onClick={() => selectRoom(r)}
              className="row-hover"
              style={{
                display: "flex",
                gap: 11,
                padding: "12px 14px",
                cursor: "pointer",
                background: activeRoom?.id === r.id ? "var(--accent-soft)" : "transparent",
              }}
            >
              <Avatar id={r.id + 10} name={r.name} size={42} online={!r.is_group} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                  <span style={{ fontSize: 11, color: "var(--faint)" }}>{r.last_at}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 12.5, color: "var(--muted)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.last_message}
                  </span>
                  {r.unread ? <Badge tone="accent">{r.unread}</Badge> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mesaj alanı */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!activeRoom ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--faint)" }}>
            <IconChat size={42} />
            <div style={{ fontWeight: 600, color: "var(--muted)" }}>Bir sohbet seç ya da yeni başlat</div>
            <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
              <IconPlus size={14} /> Yeni Sohbet
            </button>
          </div>
        ) : (
        <>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 18px", borderBottom: "1px solid var(--border-soft)" }}>
          <Avatar id={activeRoom.id + 10} name={activeRoom.name} size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{activeRoom.name}</div>
            <div style={{ fontSize: 12, color: "var(--green)" }}>
              {activeRoom.is_group ? `${activeRoom.member_ids.length} üye` : "çevrimiçi"}
            </div>
          </div>
          <button className="btn btn-sm" title="Online toplantı (Jitsi)">
            <IconVideo size={16} /> Toplantı
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12, background: "var(--bg)" }}>
          {messages.map((m) => {
            const mine = m.sender_id === (user?.id ?? 0);
            const sender = users.find((u) => u.id === m.sender_id);
            return (
              <div key={m.id} style={{ display: "flex", gap: 10, flexDirection: mine ? "row-reverse" : "row" }}>
                {!mine && sender && <Avatar id={sender.id} name={sender.full_name} size={30} />}
                <div style={{ maxWidth: "65%" }}>
                  {!mine && activeRoom.is_group && (
                    <div style={{ fontSize: 11.5, color: "var(--faint)", marginBottom: 3, marginLeft: 4 }}>{sender?.full_name}</div>
                  )}
                  <div
                    style={{
                      padding: "9px 13px",
                      borderRadius: 13,
                      fontSize: 13.5,
                      background: mine ? "var(--accent)" : "var(--surface)",
                      color: mine ? "#fff" : "var(--text)",
                      border: mine ? "none" : "1px solid var(--border)",
                      borderBottomRightRadius: mine ? 4 : 13,
                      borderBottomLeftRadius: mine ? 13 : 4,
                    }}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderTop: "1px solid var(--border-soft)" }}>
          <button className="btn-ghost btn-sm" title="Dosya ekle"><IconPaperclip size={18} /></button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Mesaj yaz…"
            className="field"
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={send} style={{ width: 44, padding: 0 }}>
            <IconSend size={17} />
          </button>
        </div>
        </>
        )}
      </div>

      {/* Çevrimiçi panel */}
      <div style={{ borderLeft: "1px solid var(--border)", padding: 16, overflowY: "auto" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--faint)", marginBottom: 12 }}>
          Çevrimiçi — {onlineIds.length}
        </div>
        {users.filter((u) => onlineIds.includes(u.id)).map((u) => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
            <Avatar id={u.id} name={u.full_name} size={30} online />
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.full_name}</div>
          </div>
        ))}
      </div>

      {/* Yeni sohbet modalı */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Yeni Sohbet"
        footer={
          <>
            <button className="btn" onClick={() => setCreateOpen(false)}>İptal</button>
            <button className="btn btn-primary" onClick={createRoom} disabled={newMembers.length === 0}>Oluştur</button>
          </>
        }
      >
        <Labeled label="Sohbet adı (grup için)">
          <input className="field" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="örn. Mobil Ekibi" />
        </Labeled>
        <Labeled label="Katılımcılar">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
            {users.filter((u) => u.id !== user?.id).map((u) => {
              const on = newMembers.includes(u.id);
              return (
                <label key={u.id} onClick={() => toggleMember(u.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", border: "1px solid var(--border)", borderRadius: 9, background: on ? "var(--accent-soft)" : "var(--surface2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={on} readOnly />
                  <Avatar id={u.id} name={u.full_name} size={26} photoUrl={u.avatar_url} />
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{u.full_name}</span>
                </label>
              );
            })}
          </div>
        </Labeled>
      </Modal>
    </div>
  );
}
