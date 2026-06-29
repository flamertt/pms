import { useParams } from "react-router-dom";
import { Avatar, Badge, BackButton } from "../../components/ui";
import { IconShield } from "../../icons";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";

export function EmployeeProfile() {
  const { id } = useParams();
  const uid = Number(id);
  const { data, loading } = useData(
    () => Promise.all([api.listUsers(), api.listRoles(), api.listTasks(), api.listOnlineUsers(), api.listProjects()]),
    [uid]
  );
  const user = (data?.[0] ?? []).find((u) => u.id === uid) ?? null;
  const role = (data?.[1] ?? []).find((r) => r.id === user?.role_id);
  const tasks = (data?.[2] ?? []).filter((t) => t.assignee_id === uid);
  const onlineIds = data?.[3] ?? [];
  const projects = data?.[4] ?? [];

  if (loading) return <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>;
  if (!user) return <><BackButton to="/kullanicilar" label="Kullanıcılar" /><div style={{ color: "var(--muted)" }}>Kullanıcı bulunamadı.</div></>;

  return (
    <>
      <BackButton to="/kullanicilar" label="Kullanıcılar" />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, alignItems: "start" }}>
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <Avatar id={user.id} name={user.full_name} size={84} photoUrl={user.avatar_url} online={onlineIds.includes(user.id)} />
          <div style={{ fontWeight: 800, fontSize: 19, marginTop: 14 }}>{user.full_name}</div>
          <div style={{ color: "var(--muted)" }}>{user.title}</div>
          <div style={{ marginTop: 12 }}>
            <Badge tone="accent">{role?.name}</Badge>
          </div>
          <div style={{ width: "100%", marginTop: 20, display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
            <Field label="E-posta" value={user.email} />
            <Field label="Telefon" value={user.phone || "—"} />
            <Field label="Telsiz No" value={user.radio_no || "—"} />
            <Field label="Takım" value={user.team || "—"} />
            <Field label="2FA" value={user.enable_2fa ? "Aktif (TOTP)" : "Kapalı"} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Yetkiler</h3>
            <p style={{ fontSize: 12.5, color: "var(--faint)", marginBottom: 12 }}>Rolden gelen izinler</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(role?.permissions || []).map((perm) => (
                <span key={perm} className="badge" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
                  <IconShield size={12} /> {perm}
                </span>
              ))}
              {role?.permissions.length === 0 && <span style={{ color: "var(--faint)" }}>Özel izin yok</span>}
            </div>
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "15px 18px", borderBottom: "1px solid var(--border-soft)", fontWeight: 700, fontSize: 15 }}>
              Atanan Görevler ({tasks.length})
            </div>
            {tasks.map((t) => {
              const proj = projects.find((p) => p.id === t.project_id);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: "1px solid var(--border-soft)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: proj?.color ?? "var(--faint)" }} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{t.title}</span>
                  <Badge tone="amber">{t.credit}p</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingBottom: 10, borderBottom: "1px solid var(--border-soft)" }}>
      <span style={{ color: "var(--faint)" }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}
