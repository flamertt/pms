import { useState } from "react";
import { Badge, PageHeader, EmptyState } from "../../components/ui";
import { Modal } from "../../components/Modal";
import { IconClock, IconPlay, IconStop, IconCheck, IconTasks } from "../../icons";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import { useAuth } from "../../lib/auth";
import { useTimers, formatDuration } from "../../lib/timers";
import type { Task, Project, TaskStatus, User } from "../../lib/types";

interface Ctx {
  projects: Project[];
  statuses: TaskStatus[];
  users: User[];
}

const STATUS_TONE: Record<number, "neutral" | "blue" | "amber" | "green"> = {
  1: "neutral",
  2: "blue",
  3: "amber",
  4: "green",
};
const PRIORITY: Record<string, { tone: "neutral" | "blue" | "amber" | "red"; label: string }> = {
  low: { tone: "neutral", label: "Düşük" },
  normal: { tone: "blue", label: "Normal" },
  high: { tone: "amber", label: "Yüksek" },
  urgent: { tone: "red", label: "Acil" },
};

const descFor = (t: Task, projName?: string) =>
  t.description ?? `${projName ?? "—"} · tahmini efor ${t.credit} kredi`;

// "Görevli olduğum projeler" — kart tabanlı, tıklanınca detay + zamanlayıcı. DB'den yüklenir.
export function MyTasks() {
  const { user } = useAuth();
  const { data, loading, reload } = useData(
    () => Promise.all([api.listTasks(), api.listProjects(), api.listStatuses(), api.listUsers()]),
    []
  );
  const allTasks = data?.[0] ?? [];
  const ctx: Ctx = { projects: data?.[1] ?? [], statuses: data?.[2] ?? [], users: data?.[3] ?? [] };
  const my = user ? allTasks.filter((t) => t.assignee_ids.includes(user.id)) : allTasks;

  const [activeId, setActiveId] = useState<number | null>(null);
  const active = my.find((t) => t.id === activeId) ?? null;
  const timers = useTimers();

  return (
    <>
      <PageHeader title="Görevlerim" subtitle={`${my.length} görev sana atanmış`} />

      {loading ? (
        <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>
      ) : my.length === 0 ? (
        <EmptyState icon={<IconTasks size={40} />} title="Sana atanmış görev yok" />
      ) : (
      <div className="grid-cards">
        {my.map((t) => {
          const proj = ctx.projects.find((p) => p.id === t.project_id);
          const st = ctx.statuses.find((s) => s.id === t.board_id);
          const pr = PRIORITY[t.priority];
          const running = timers.isRunning(t.id);
          const secs = timers.seconds(t.id);
          return (
            <div key={t.id} className="card card-hover" onClick={() => setActiveId(t.id)} style={{ padding: 18, cursor: "pointer", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge tone={pr.tone}>{pr.label}</Badge>
                <Badge tone={STATUS_TONE[t.board_id]}>{st?.name}</Badge>
                <div style={{ flex: 1 }} />
                <Badge tone="amber">{t.credit}p</Badge>
              </div>

              <div style={{ fontWeight: 700, fontSize: 15 }}>{t.title}</div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: proj?.color ?? "var(--faint)" }} />
                {proj?.name}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid var(--border-soft)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: running ? "var(--accent)" : "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                  <IconClock size={15} /> {formatDuration(secs)}
                  {running && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />}
                </span>
                <div style={{ flex: 1 }} />
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Görev detayı */}
      <Modal open={!!active} onClose={() => setActiveId(null)} title={active?.title ?? ""} width={560}>
        {active && <TaskDetail task={active} ctx={ctx} onChanged={reload} />}
      </Modal>
    </>
  );
}

function TaskDetail({ task, ctx, onChanged }: { task: Task; ctx: Ctx; onChanged: () => void }) {
  const timers = useTimers();
  const proj = ctx.projects.find((p) => p.id === task.project_id);
  const st = ctx.statuses.find((s) => s.id === task.board_id);
  const assigner = ctx.users.find((u) => u.id === task.assigner_id);
  const pr = PRIORITY[task.priority];
  const running = timers.isRunning(task.id);
  const secs = timers.seconds(task.id);

  const changeStatus = async (statusId: number) => {
    await api.updateTaskBoard(task.id, statusId, task.position);
    onChanged();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <Badge tone={pr.tone}>{pr.label}</Badge>
        <Badge tone="neutral">{st?.name}</Badge>
        <Badge tone="amber">{task.credit} kredi</Badge>
        <Badge tone="accent">{proj?.name}</Badge>
      </div>

      <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 18 }}>
        {descFor(task, proj?.name)}
      </div>

      {/* Durum değiştir: başladı / yanıt bekliyor / bitti ... */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
          Durum
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ctx.statuses.map((s) => (
            <button
              key={s.id}
              className={s.id === task.board_id ? "btn btn-primary btn-sm" : "btn btn-sm"}
              onClick={() => changeStatus(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <Info label="Atayan" value={assigner?.full_name ?? "—"} />
        <Info label="Bitiş" value={task.due_at ?? "—"} />
      </div>

      {/* Zamanlayıcı */}
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
          Çalışma Süresi
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums", color: running ? "var(--accent)" : "var(--text)" }}>
          {formatDuration(secs)}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
          {running ? (
            <button className="btn" onClick={() => timers.stop(task.id)}><IconStop size={16} /> Durdur</button>
          ) : (
            <button className="btn btn-primary" onClick={() => timers.start(task.id)}><IconPlay size={16} /> Başlat</button>
          )}
          <button className="btn" onClick={() => timers.reset(task.id)}><IconCheck size={16} /> Sıfırla</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 11.5, color: "var(--faint)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{value}</div>
    </div>
  );
}
