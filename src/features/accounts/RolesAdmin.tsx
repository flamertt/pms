import { useState } from "react";
import { Badge, PageHeader } from "../../components/ui";
import { IconPlus, IconShield, IconCheck } from "../../icons";
import { permissionGroups } from "../../lib/permissions";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import type { Role } from "../../lib/types";

// Rol yönetimi: oluşturma/düzenleme/silme (manage_roles) + izin atama. DB'den yüklenir.
export function RolesAdmin() {
  const { data, loading, reload } = useData(() => api.listRoles(), []);
  const roles = data ?? [];

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  // İlk yüklemede ilk rolü seç.
  if (selectedId == null && roles.length > 0) {
    setSelectedId(roles[0].id);
    setDraft(roles[0].permissions);
  }

  const selected = roles.find((r) => r.id === selectedId) ?? roles[0];

  const select = (r: Role) => {
    setSelectedId(r.id);
    setDraft(r.permissions);
    setSaved(false);
  };

  const togglePerm = (code: string) => {
    setSaved(false);
    setDraft((d) => (d.includes(code) ? d.filter((c) => c !== code) : [...d, code]));
  };

  const addRole = async () => {
    const name = prompt("Yeni rol adı:");
    if (!name) return;
    const id = await api.saveRole({ name, description: "", permissions: [] });
    setSelectedId(id);
    setDraft([]);
    reload();
  };

  const save = async () => {
    if (!selected) return;
    await api.saveRole({ id: selected.id, name: selected.name, description: selected.description ?? "", permissions: draft });
    setSaved(true);
    reload();
  };

  if (loading) return <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>;
  if (!selected) return <div style={{ color: "var(--muted)" }}>Rol bulunamadı.</div>;

  return (
    <>
      <PageHeader
        title="Roller & İzinler"
        subtitle="Rol tabanlı yetkilendirme"
        actions={
          <button className="btn btn-primary" onClick={addRole}>
            <IconPlus size={16} /> Yeni Rol
          </button>
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "start" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          {roles.map((r) => (
            <div
              key={r.id}
              onClick={() => select(r)}
              className="row-hover"
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border-soft)",
                cursor: "pointer",
                background: selected.id === r.id ? "var(--accent-soft)" : "transparent",
                borderLeft: selected.id === r.id ? "3px solid var(--accent)" : "3px solid transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ color: "var(--accent)" }}><IconShield size={17} /></span>
                <span style={{ fontWeight: 700, flex: 1 }}>{r.name}</span>
                <Badge tone="neutral">{r.user_count}</Badge>
              </div>
              <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4, marginLeft: 26 }}>{r.description}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>{selected.name}</h3>
          <p style={{ color: "var(--faint)", fontSize: 13, marginTop: 2, marginBottom: 18 }}>{selected.description}</p>

          {permissionGroups.map((g) => (
            <div key={g.group} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--faint)", marginBottom: 8 }}>
                {g.group}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.items.map((perm) => {
                  const on = draft.includes(perm.code);
                  return (
                    <label
                      key={perm.code}
                      onClick={() => togglePerm(perm.code)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                        padding: "10px 13px",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        background: on ? "var(--accent-soft)" : "var(--surface2)",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          background: on ? "var(--accent)" : "transparent",
                          border: on ? "none" : "1.5px solid var(--border)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {on && <IconCheck size={13} />}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13.5, flex: 1 }}>{perm.label}</span>
                      <code style={{ fontSize: 11.5, color: "var(--faint)" }}>{perm.code}</code>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            {saved && <span style={{ color: "var(--green)", fontSize: 13, fontWeight: 600 }}>✓ Kaydedildi</span>}
            <div style={{ flex: 1 }} />
            <button className="btn" onClick={() => select(selected)}>Geri Al</button>
            <button className="btn btn-primary" onClick={save}>Kaydet</button>
          </div>
        </div>
      </div>
    </>
  );
}
