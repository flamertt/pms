import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, ProgressBar, PageHeader, EmptyState } from "../../components/ui";
import { Modal, Labeled } from "../../components/Modal";
import { IconPlus, IconTasks, IconCheck, IconChevronRight, IconProjects } from "../../icons";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import { useAuth } from "../../lib/auth";

const COLORS = ["#7c3aed", "#3b7fd9", "#1f9d63", "#cc8a2e", "#d65149", "#c0518f"];

export function ProjectsList() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { data, loading, reload } = useData(
    () => Promise.all([api.listProjects(), api.listUsers(), api.listTasks()]),
    []
  );
  const projects = data?.[0] ?? [];
  const users = data?.[1] ?? [];
  const tasks = data?.[2] ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: COLORS[0] });

  const create = async () => {
    if (!form.name.trim()) return;
    await api.saveProject({ ...form, memberIds: user ? [user.id] : [] });
    setOpen(false);
    setForm({ name: "", description: "", color: COLORS[0] });
    reload();
  };

  return (
    <>
      <PageHeader
        title="Projeler"
        subtitle={`${projects.length} aktif proje`}
        actions={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <IconPlus size={16} /> Yeni Proje
          </button>
        }
      />
      {loading ? (
        <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>
      ) : projects.length === 0 ? (
        <EmptyState icon={<IconProjects size={40} />} title="Proje yok" hint="Yeni Proje ile başla." />
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 18 }}>
        {projects.map((p) => {
          const members = users.filter((u) => p.member_ids.includes(u.id));
          const pTasks = tasks.filter((t) => t.project_id === p.id);
          const doneCount = pTasks.filter((t) => t.board_id === 4).length;
          return (
            <div
              key={p.id}
              className="card card-hover"
              onClick={() => nav(`/projeler/${p.id}`)}
              style={{ padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Başlık */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>
                    {p.description || "Açıklama eklenmemiş"}
                  </div>
                </div>
                <Badge tone="green">Aktif</Badge>
              </div>

              {/* Mini istatistikler */}
              <div style={{ display: "flex", gap: 10 }}>
                <Stat icon={<IconTasks size={14} />} label="Görev" value={pTasks.length} />
                <Stat icon={<IconCheck size={14} />} label="Biten" value={doneCount} />
                <Stat icon={<IconChevronRight size={14} />} label="Üye" value={members.length} />
              </div>

              {/* İlerleme */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "var(--muted)" }}>İlerleme</span>
                  <span style={{ fontWeight: 700 }}>{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress!} />
              </div>

              {/* Çalışanlar (altta) */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border-soft)" }}>
                <div style={{ display: "flex" }}>
                  {members.slice(0, 5).map((u, i) => (
                    <div key={u.id} style={{ marginLeft: i === 0 ? 0 : -10 }} title={u.full_name}>
                      <div style={{ borderRadius: "50%", border: "2px solid var(--surface)" }}>
                        <Avatar id={u.id} name={u.full_name} size={30} photoUrl={u.avatar_url} />
                      </div>
                    </div>
                  ))}
                  {members.length > 5 && (
                    <div style={{ marginLeft: -10, width: 30, height: 30, borderRadius: "50%", border: "2px solid var(--surface)", background: "var(--surface2)", color: "var(--muted)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      +{members.length - 5}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 2 }}>
                  Aç <IconChevronRight size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Yeni Proje"
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>İptal</button>
            <button className="btn btn-primary" onClick={create}>Oluştur</button>
          </>
        }
      >
        <Labeled label="Proje Adı">
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
        </Labeled>
        <Labeled label="Açıklama">
          <input className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Labeled>
        <Labeled label="Renk">
          <div style={{ display: "flex", gap: 10 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: c,
                  border: form.color === c ? "3px solid var(--text)" : "3px solid transparent",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </Labeled>
      </Modal>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div style={{ flex: 1, background: "var(--surface2)", borderRadius: 10, padding: "9px 11px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--faint)", fontSize: 11 }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, marginTop: 2 }}>{value}</div>
    </div>
  );
}
