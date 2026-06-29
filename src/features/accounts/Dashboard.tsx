import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, ProgressBar } from "../../components/ui";
import { IconTasks, IconProjects, IconCheck, IconUsers, IconCrown, IconUser } from "../../icons";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import { useAuth } from "../../lib/auth";
import type { User } from "../../lib/types";

const PRIORITY_COLOR: Record<string, string> = {
  low: "var(--faint)",
  normal: "var(--blue)",
  high: "var(--amber)",
  urgent: "var(--red)",
};


export function Dashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [scope, setScope] = useState<number | "all">("all");

  const { data } = useData(
    () => Promise.all([api.listProjects(), api.listTasks(), api.listUsers(), api.listOnlineUsers(), api.listUpdates()]),
    []
  );
  const projects = data?.[0] ?? [];
  const allTasks = data?.[1] ?? [];
  const users = data?.[2] ?? [];
  const onlineIds = data?.[3] ?? [];
  const activity = data?.[4] ?? [];

  const myTasks = (user ? allTasks.filter((t) => t.assignee_ids.includes(user.id)) : allTasks).slice(0, 5);
  const projectById = (id: number) => projects.find((p) => p.id === id);

  // İstatistikler — gerçek veriden.
  const stats = [
    { icon: <IconProjects size={20} />, value: projects.length, label: "Aktif Proje", soft: "var(--accent-soft)", color: "var(--accent)" },
    { icon: <IconTasks size={20} />, value: allTasks.filter((t) => t.board_id !== 4).length, label: "Açık Görev", soft: "var(--blue-soft)", color: "var(--blue)" },
    { icon: <IconCheck size={20} />, value: allTasks.filter((t) => t.board_id === 4).length, label: "Tamamlanan", soft: "var(--green-soft)", color: "var(--green)" },
    { icon: <IconUsers size={20} />, value: users.length, label: "Ekip Üyesi", soft: "var(--amber-soft)", color: "var(--amber)" },
  ];

  // Ayın elemanları: kapsamdaki tamamlanan görevlerin kredisine göre ilk 3.
  const top3 = useMemo(() => {
    const tasks = scope === "all" ? allTasks : allTasks.filter((t) => t.project_id === scope);
    const score = new Map<number, number>();
    tasks.filter((t) => t.board_id === 4).forEach((t) => {
      t.assignee_ids.forEach((aid) => score.set(aid, (score.get(aid) ?? 0) + t.credit));
    });
    if (score.size < 3) {
      tasks.forEach((t) => {
        t.assignee_ids.forEach((aid) => {
          if (!score.has(aid)) score.set(aid, t.credit);
        });
      });
    }
    return [...score.entries()]
      .map(([id, credit]) => ({ user: users.find((u) => u.id === id), credit }))
      .filter((x): x is { user: User; credit: number } => !!x.user)
      .sort((a, b) => b.credit - a.credit)
      .slice(0, 3);
  }, [scope, allTasks, users]);

  return (
    <>
      {/* ===== Ayın Elemanları ===== */}
      <section className="card" style={{ padding: 20, marginBottom: 18, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <IconCrown size={20} />
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>Ayın Elemanları</h3>
          <div style={{ flex: 1 }} />
          <select
            className="field"
            style={{ width: 220, height: 36 }}
            value={scope}
            onChange={(e) => setScope(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">Genel (tüm projeler)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {top3.map((entry, i) => (
            <Podium key={entry.user.id} rank={i + 1} user={entry.user} credit={entry.credit} />
          ))}
        </div>
      </section>

      {/* İstatistik kartları — ikon solda, sayı+etiket sağda hizalı */}
      <div className="grid-stats">
        {stats.map((s) => (
          <div key={s.label} className="card card-hover" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, flex: "none", borderRadius: 12, background: s.soft, color: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        {/* SOL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <section className="card" style={{ overflow: "hidden" }}>
            <SectionHead title="Bana Atanan Görevler" badge={`${myTasks.length} aktif`} onAll={() => nav("/gorevlerim")} />
            {myTasks.map((t) => {
              const proj = projectById(t.project_id);
              return (
                <div key={t.id} className="row-hover" onClick={() => nav("/gorevlerim")} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 18px", borderBottom: "1px solid var(--border-soft)", cursor: "pointer" }}>
                  <span style={{ width: 9, height: 9, flex: "none", borderRadius: "50%", background: PRIORITY_COLOR[t.priority] }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 11.5, color: "var(--muted)" }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: proj?.color || "var(--faint)" }} />
                      {proj?.name}
                    </div>
                  </div>
                  <Badge tone="amber">{t.credit} kredi</Badge>
                </div>
              );
            })}
          </section>

          <section className="card" style={{ overflow: "hidden" }}>
            <SectionHead title="Son Güncellemeler" />
            {activity.length === 0 && (
              <div style={{ padding: "20px 18px", color: "var(--faint)", fontSize: 13 }}>Henüz aktivite yok.</div>
            )}
            {activity.map((a) => {
              const actor = users.find((u) => u.id === a.actor_id);
              return (
                <div key={a.id} style={{ display: "flex", gap: 12, padding: "13px 18px", borderBottom: "1px solid var(--border-soft)" }}>
                  <Avatar id={a.actor_id} name={a.actor_name} size={32} photoUrl={actor?.avatar_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}>
                      <b>{a.actor_name}</b> <span style={{ color: "var(--muted)" }}>{a.summary}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{a.created_at}</div>
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        {/* SAĞ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <section className="card" style={{ overflow: "hidden" }}>
            <SectionHead title="Proje İlerlemesi" onAll={() => nav("/projeler")} />
            <div style={{ padding: "6px 18px 16px" }}>
              {projects.map((p) => (
                <div key={p.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--border-soft)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color: "var(--muted)", fontWeight: 600 }}>{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress!} />
                </div>
              ))}
            </div>
          </section>

          <section className="card" style={{ overflow: "hidden" }}>
            <SectionHead title="Çevrimiçi Ekip" badge={` aktif`} />
            <div style={{ padding: "8px 18px 16px" }}>
              {users.filter((u) => onlineIds.includes(u.id)).map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0" }}>
                  <Avatar id={u.id} name={u.full_name} size={32} online />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{u.full_name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{u.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// Podyum kartı — 1.'de taç ve altın çerçeve efekti.
function Podium({ rank, user, credit }: { rank: number; user: User; credit: number }) {
  const medal = ["#f4b400", "#b8bcc6", "#cd7f4d"][rank - 1];
  const isFirst = rank === 1;
  return (
    <div
      className="card-hover"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        borderRadius: 14,
        background: isFirst ? "linear-gradient(135deg, var(--accent-soft), transparent)" : "var(--surface2)",
        border: `1px solid ${isFirst ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      <div style={{ position: "relative" }}>
        {isFirst && (
          <span style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", color: "#f4b400" }}>
            <IconCrown size={20} />
          </span>
        )}
        <div style={{ position: "relative", width: 52, height: 52, borderRadius: "50%", background: "var(--surface)", border: `2px solid ${medal}`, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
          {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : <IconUser size={26} />}
          <span style={{ position: "absolute", bottom: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: medal, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--surface)" }}>
            {rank}
          </span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.full_name}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{user.title}</div>
        <div style={{ marginTop: 6 }}>
          <Badge tone="accent">{credit} kredi</Badge>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, badge, onAll }: { title: string; badge?: string; onAll?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border-soft)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
      {badge && <Badge tone="accent">{badge}</Badge>}
      <div style={{ flex: 1 }} />
      {onAll && (
        <button className="btn-ghost btn-sm" onClick={onAll} style={{ height: 26 }}>
          Tümü →
        </button>
      )}
    </div>
  );
}
