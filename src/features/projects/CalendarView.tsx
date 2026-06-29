import { PageHeader, Badge } from "../../components/ui";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import type { Task } from "../../lib/types";

// Takvim görünümü (project_detail_calendar). DB'den yüklenir.
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function CalendarView() {
  const { data, loading } = useData(() => Promise.all([api.listTasks(), api.listProjects()]), []);
  const tasks = data?.[0] ?? [];
  const projects = data?.[1] ?? [];

  // Haziran 2026 — 1 Haziran Pazartesi (gösterim amaçlı sabit).
  const daysInMonth = 30;
  const startOffset = 0; // Pazartesi
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Görevleri güne dağıt (demo dağılım).
  const taskByDay: Record<number, Task[]> = {};
  tasks.forEach((t, i) => {
    const day = ((i * 3) % daysInMonth) + 1;
    (taskByDay[day] ||= []).push(t);
  });

  if (loading) return <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>;

  return (
    <>
      <PageHeader title="Takvim" subtitle="Haziran 2026" actions={<Badge tone="accent">Aylık görünüm</Badge>} />
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginBottom: 8 }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--faint)", padding: "4px 0" }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
          {cells.map((day, i) => {
            const isToday = day === 29;
            return (
              <div
                key={i}
                style={{
                  minHeight: 96,
                  border: "1px solid var(--border-soft)",
                  borderRadius: 10,
                  padding: 8,
                  background: day ? "var(--surface2)" : "transparent",
                  outline: isToday ? "2px solid var(--accent)" : "none",
                }}
              >
                {day && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? "var(--accent)" : "var(--muted)", marginBottom: 6 }}>
                      {day}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {(taskByDay[day] || []).slice(0, 2).map((t) => {
                        const proj = projects.find((p) => p.id === t.project_id);
                        return (
                          <div
                            key={t.id}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 6px",
                              borderRadius: 6,
                              background: "var(--surface)",
                              borderLeft: `3px solid ${proj?.color}`,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {t.title}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
