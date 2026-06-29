import { useState } from "react";
import { useParams } from "react-router-dom";
import { Avatar, Badge, PageHeader, BackButton } from "../../components/ui";
import { Modal, Labeled } from "../../components/Modal";
import { IconPlus, IconClock, IconPaperclip } from "../../icons";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import { useAuth } from "../../lib/auth";
import type { Task } from "../../lib/types";

const PRIORITY: Record<string, { tone: "neutral" | "blue" | "amber" | "red"; label: string }> = {
  low: { tone: "neutral", label: "Düşük" },
  normal: { tone: "blue", label: "Normal" },
  high: { tone: "amber", label: "Yüksek" },
  urgent: { tone: "red", label: "Acil" },
};

// Sürükle-bırak ile görev pano değiştirme (update_task_board). DB'den yüklenir.
export function KanbanBoard() {
  const { id } = useParams();
  const projectId = Number(id) || 1;
  const { user } = useAuth();
  const { data, loading } = useData(
    () => Promise.all([api.listProjects(), api.listStatuses(), api.listUsers(), api.listTasks(projectId)]),
    [projectId]
  );
  const projects = data?.[0] ?? [];
  const statuses = data?.[1] ?? [];
  const users = data?.[2] ?? [];
  const project = projects.find((p) => p.id === projectId);

  // Sürükle-bırak için yerel kopya; yüklenen veriyle senkronlanır.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [syncedKey, setSyncedKey] = useState<string>("");
  const loadedKey = `${projectId}:${(data?.[3] ?? []).length}`;
  if (data && syncedKey !== loadedKey) {
    setTasks(data[3]);
    setSyncedKey(loadedKey);
  }
  const [dragId, setDragId] = useState<number | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    board_id: 1,
    assignee_id: 0,
    credit: 3,
    priority: "normal" as Task["priority"],
  });

  const onDrop = (boardId: number) => {
    if (dragId == null) return;
    setTasks((ts) => ts.map((t) => (t.id === dragId ? { ...t, board_id: boardId } : t)));
    api.updateTaskBoard(dragId, boardId, 0); // backend'e kalıcı yaz (Tauri)
    setDragId(null);
  };

  const addTask = async () => {
    if (!form.title.trim()) return;
    const assignee = form.assignee_id || users[0]?.id || null;
    const id = await api.saveTask({
      project_id: projectId,
      board_id: form.board_id,
      title: form.title,
      assignee_id: assignee,
      credit: form.credit,
      priority: form.priority,
    });
    setTasks((ts) => [
      ...ts,
      {
        id,
        project_id: projectId,
        board_id: form.board_id,
        title: form.title,
        description: null,
        assignee_id: assignee,
        assigner_id: user?.id ?? null,
        start_at: null,
        due_at: null,
        credit: form.credit,
        position: ts.length,
        priority: form.priority,
      },
    ]);
    setOpen(false);
    setForm({ ...form, title: "" });
  };

  if (loading) return <><BackButton to="/projeler" label="Projeler" /><div style={{ color: "var(--muted)" }}>Yükleniyor…</div></>;
  if (!project) return <><BackButton to="/projeler" label="Projeler" /><div style={{ color: "var(--muted)" }}>Proje bulunamadı.</div></>;

  return (
    <>
      <BackButton to="/projeler" label="Projeler" />
      <PageHeader
        title={project.name}
        subtitle="Kanban panosu — görevleri sürükleyip bırakın"
        actions={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <IconPlus size={16} /> Görev Ekle
          </button>
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${statuses.length},minmax(260px,1fr))`, gap: 14, alignItems: "start" }}>
        {statuses.map((st) => {
          const colTasks = tasks.filter((t) => t.board_id === st.id);
          return (
            <div
              key={st.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(st.id)}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: 10, minHeight: 200 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 12px" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: st.color }} />
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{st.name}</span>
                <span style={{ fontSize: 12, color: "var(--faint)" }}>{colTasks.length}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {colTasks.map((t) => {
                  const assignee = users.find((u) => u.id === t.assignee_id);
                  const pr = PRIORITY[t.priority];
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      className="card"
                      style={{ padding: 13, cursor: "grab", boxShadow: dragId === t.id ? "var(--shadow-lg)" : "var(--shadow-sm)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 9 }}>
                        <Badge tone={pr.tone}>{pr.label}</Badge>
                        <Badge tone="amber">{t.credit}p</Badge>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 11 }}>{t.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {assignee && <Avatar id={assignee.id} name={assignee.full_name} size={24} />}
                        <div style={{ flex: 1 }} />
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--faint)" }}>
                          <IconPaperclip size={13} /> 2
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--faint)" }}>
                          <IconClock size={13} /> 5 Tem
                        </span>
                      </div>
                    </div>
                  );
                })}
                <button
                  className="btn-ghost btn-sm"
                  style={{ justifyContent: "flex-start" }}
                  onClick={() => {
                    setForm((f) => ({ ...f, board_id: st.id }));
                    setOpen(true);
                  }}
                >
                  <IconPlus size={14} /> Ekle
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Yeni Görev"
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>İptal</button>
            <button className="btn btn-primary" onClick={addTask}>Ekle</button>
          </>
        }
      >
        <Labeled label="Başlık">
          <input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
        </Labeled>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Labeled label="Durum">
            <select className="field" value={form.board_id} onChange={(e) => setForm({ ...form, board_id: Number(e.target.value) })}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Atanan">
            <select className="field" value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: Number(e.target.value) })}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Öncelik">
            <select className="field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}>
              <option value="low">Düşük</option>
              <option value="normal">Normal</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
          </Labeled>
          <Labeled label="Kredi (puan)">
            <input type="number" className="field" value={form.credit} onChange={(e) => setForm({ ...form, credit: Number(e.target.value) })} />
          </Labeled>
        </div>
      </Modal>
    </>
  );
}
