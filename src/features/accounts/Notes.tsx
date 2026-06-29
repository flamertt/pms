import { useState } from "react";
import { Badge, PageHeader, EmptyState } from "../../components/ui";
import { Modal, Labeled } from "../../components/Modal";
import { IconPlus, IconStar, IconEdit, IconTrash, IconNote, IconUser, IconUsers, IconClock } from "../../icons";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import { useConfirm } from "../../components/Confirm";
import type { Note } from "../../lib/types";

type Scope = "personal" | "group";

// Kişisel veya grup notları (Note — CRUD). DB'den yüklenir.
export function Notes() {
  const confirm = useConfirm();
  const { data, loading, reload } = useData(() => Promise.all([api.listNotes(), api.listProjects()]), []);
  const notes = data?.[0] ?? [];
  const projects = data?.[1] ?? [];
  const [filter, setFilter] = useState<"all" | Scope>("all");
  const [editing, setEditing] = useState<Note | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; body: string; pinned: boolean; scope: Scope; group: string }>({
    title: "",
    body: "",
    pinned: false,
    scope: "personal",
    group: "",
  });

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", body: "", pinned: false, scope: "personal", group: "" });
    setOpen(true);
  };
  const openEdit = (n: Note) => {
    setEditing(n);
    setForm({ title: n.title, body: n.body, pinned: n.pinned, scope: n.scope ?? "personal", group: n.group ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    await api.saveNote({ id: editing?.id, title: form.title, body: form.body, pinned: form.pinned });
    setOpen(false);
    reload();
  };

  const remove = async (n: Note) => {
    const ok = await confirm({
      title: "Notu sil",
      message: `“${n.title}” notu silinecek.`,
    });
    if (!ok) return;
    await api.deleteNote(n.id);
    reload();
  };
  const togglePin = async (n: Note) => {
    await api.saveNote({ id: n.id, title: n.title, body: n.body, pinned: !n.pinned });
    reload();
  };

  const visible = notes
    .filter((n) => filter === "all" || (n.scope ?? "personal") === filter)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <>
      <PageHeader
        title="Notlarım"
        subtitle={`${notes.length} not`}
        actions={
          <button className="btn btn-primary" onClick={openNew}>
            <IconPlus size={16} /> Yeni Not
          </button>
        }
      />

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {([["all", "Tümü"], ["personal", "Kişisel"], ["group", "Grup"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={filter === k ? "btn btn-primary btn-sm" : "btn btn-sm"}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<IconNote size={40} />} title="Not yok" hint="Yeni Not ile oluştur." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 18 }}>
          {visible.map((note) => {
            const group = (note.scope ?? "personal") === "group";
            return (
              <div key={note.id} className="card card-hover" style={{ padding: 20, display: "flex", flexDirection: "column", minHeight: 190 }}>
                {/* Üst: tür çipi + sabitle */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  {group ? (
                    <Badge tone="blue"><IconUsers size={12} /> {note.group || "Grup"}</Badge>
                  ) : (
                    <Badge tone="accent"><IconUser size={12} /> Kişisel</Badge>
                  )}
                  <div style={{ flex: 1 }} />
                  <button className="btn-ghost btn-sm" title={note.pinned ? "Sabitlemeyi kaldır" : "Sabitle"} onClick={() => togglePin(note)} style={{ width: 28, height: 28, color: note.pinned ? "var(--amber)" : "var(--faint)" }}>
                    <IconStar size={16} />
                  </button>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 7 }}>{note.title}</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, flex: 1, whiteSpace: "pre-wrap" }}>{note.body}</p>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, paddingTop: 13, borderTop: "1px solid var(--border-soft)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--faint)" }}>
                    <IconClock size={13} /> {note.updated_at}
                  </span>
                  <div style={{ flex: 1 }} />
                  <button className="btn-ghost btn-sm" title="Düzenle" onClick={() => openEdit(note)}><IconEdit size={14} /></button>
                  <button className="btn-ghost btn-sm" title="Sil" onClick={() => remove(note)} style={{ color: "var(--red)" }}><IconTrash size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Notu Düzenle" : "Yeni Not"}
        footer={<><button className="btn" onClick={() => setOpen(false)}>İptal</button><button className="btn btn-primary" onClick={save}>Kaydet</button></>}
      >
        <Labeled label="Tür">
          <div style={{ display: "flex", gap: 8 }}>
            <button className={form.scope === "personal" ? "btn btn-primary btn-sm" : "btn btn-sm"} onClick={() => setForm({ ...form, scope: "personal" })} style={{ flex: 1 }}>
              <IconUser size={14} /> Kişisel
            </button>
            <button className={form.scope === "group" ? "btn btn-primary btn-sm" : "btn btn-sm"} onClick={() => setForm({ ...form, scope: "group" })} style={{ flex: 1 }}>
              <IconUsers size={14} /> Grup
            </button>
          </div>
        </Labeled>
        {form.scope === "group" && (
          <Labeled label="Grup / Proje">
            <select className="field" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
              <option value="">Seç…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
              <option value="Tasarım Ekibi">Tasarım Ekibi</option>
              <option value="Yönetim">Yönetim</option>
            </select>
          </Labeled>
        )}
        <Labeled label="Başlık">
          <input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
        </Labeled>
        <Labeled label="İçerik">
          <textarea className="field" style={{ height: 140, padding: 12, resize: "vertical" }} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Labeled>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
          <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
          Sabitle
        </label>
      </Modal>
    </>
  );
}
