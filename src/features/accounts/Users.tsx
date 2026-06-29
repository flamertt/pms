import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, PageHeader, EmptyState } from "../../components/ui";
import { Modal, Labeled } from "../../components/Modal";
import { IconPlus, IconEdit, IconTrash, IconUser, IconChevronRight, IconShield, IconMail, IconRadio, IconUsers } from "../../icons";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useData } from "../../lib/useData";
import { useConfirm } from "../../components/Confirm";
import type { User } from "../../lib/types";

type Form = {
  username: string;
  email: string;
  full_name: string;
  title: string;
  team: string;
  role_id: number;
  enable_2fa: boolean;
};
const EMPTY: Form = { username: "", email: "", full_name: "", title: "", team: "", role_id: 2, enable_2fa: false };

// Birleşik Kullanıcılar dizini: herkes görür, yönetim işlemleri yalnızca manage_users iznine açık.
export function Users() {
  const nav = useNavigate();
  const { has } = useAuth();
  const confirm = useConfirm();
  const canManage = has("manage_users");

  // Veriler DB'den (Tauri) — tarayıcıda mock'a düşer.
  const { data, loading, reload } = useData(
    () => Promise.all([api.listUsers(), api.listRoles(), api.listOnlineUsers()]),
    []
  );
  const users = data?.[0] ?? [];
  const roles = data?.[1] ?? [];
  const onlineIds = data?.[2] ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ username: u.username, email: u.email, full_name: u.full_name, title: u.title ?? "", team: u.team ?? "", role_id: u.role_id ?? 2, enable_2fa: u.enable_2fa });
    setOpen(true);
  };

  const save = async () => {
    if (!form.full_name.trim() || !form.username.trim()) return;
    await api.saveUser({ id: editing?.id, ...form });
    setOpen(false);
    reload();
  };

  const remove = async (u: User) => {
    const ok = await confirm({
      title: "Kullanıcıyı sil",
      message: `${u.full_name} kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
    });
    if (!ok) return;
    await api.deleteUser(u.id);
    reload();
  };

  return (
    <>
      <PageHeader
        title="Kullanıcılar"
        subtitle={`${users.length} ekip üyesi`}
        actions={canManage && (
          <button className="btn btn-primary" onClick={openNew}>
            <IconPlus size={16} /> Kullanıcı Ekle
          </button>
        )}
      />

      {loading ? (
        <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>
      ) : users.length === 0 ? (
        <EmptyState icon={<IconUser size={40} />} title="Kullanıcı yok" />
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 18 }}>
        {users.map((u) => {
          const role = roles.find((r) => r.id === u.role_id);
          const online = onlineIds.includes(u.id);
          return (
            <div key={u.id} className="card card-hover" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Üst: foto + isim + rol */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative", width: 54, height: 54, flex: "none", borderRadius: "50%", overflow: "hidden", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IconUser size={28} />}
                  <span style={{ position: "absolute", bottom: 1, right: 1, width: 13, height: 13, borderRadius: "50%", background: online ? "var(--green)" : "var(--faint)", border: "2px solid var(--surface)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.full_name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{u.title}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge tone="accent">{role?.name}</Badge>
                    {u.enable_2fa && <Badge tone="green"><IconShield size={11} /> 2FA</Badge>}
                  </div>
                </div>
              </div>

              {/* İletişim bilgileri */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <InfoRow icon={<IconMail size={14} />} value={u.email} />
                <InfoRow icon={<IconUsers size={14} />} value={u.team || "—"} />
                <InfoRow icon={<IconRadio size={14} />} value={u.radio_no || "—"} />
              </div>

              {/* Aksiyonlar */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 14, borderTop: "1px solid var(--border-soft)" }}>
                <button className="btn btn-sm" onClick={() => nav(`/kullanicilar/${u.id}`)} style={{ flex: 1 }}>
                  Profili gör <IconChevronRight size={14} />
                </button>
                {canManage && (
                  <>
                    <button className="btn-ghost btn-sm" title="Düzenle" onClick={() => openEdit(u)}><IconEdit size={15} /></button>
                    <button className="btn-ghost btn-sm" title="Sil" onClick={() => remove(u)} style={{ color: "var(--red)" }}><IconTrash size={15} /></button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı"}
        width={520}
        footer={<><button className="btn" onClick={() => setOpen(false)}>İptal</button><button className="btn btn-primary" onClick={save}>Kaydet</button></>}
      >
        <div className="grid-2-form">
          <Labeled label="Ad Soyad"><input className="field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Labeled>
          <Labeled label="Kullanıcı Adı"><input className="field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Labeled>
          <Labeled label="E-posta"><input className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Labeled>
          <Labeled label="Takım"><input className="field" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} /></Labeled>
          <Labeled label="Ünvan"><input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Labeled>
          <Labeled label="Rol">
            <select className="field" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Labeled>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>
          <input type="checkbox" checked={form.enable_2fa} onChange={(e) => setForm({ ...form, enable_2fa: e.target.checked })} />
          İki faktörlü doğrulama (2FA) aktif
        </label>
      </Modal>
    </>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--muted)", minWidth: 0 }}>
      <span style={{ color: "var(--faint)", flex: "none" }}>{icon}</span>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </div>
  );
}
