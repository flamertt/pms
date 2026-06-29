import { useState } from "react";
import { PageHeader, ProgressBar, Badge, Avatar } from "../../components/ui";
import { IconReport, IconCheck, IconClock, IconTasks, IconDownload, IconFile } from "../../icons";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import { useTimers, formatDuration } from "../../lib/timers";

// Raporlama: proje bazında performans, durum dağılımı, ekip katkısı + dışa aktarım. DB'den yüklenir.
export function Reports() {
  const [scope, setScope] = useState<number | "all">("all");
  const timers = useTimers();
  const { data, loading } = useData(
    () => Promise.all([api.listTasks(), api.listProjects(), api.listUsers(), api.listStatuses()]),
    []
  );
  const all = { tasks: data?.[0] ?? [], projects: data?.[1] ?? [], users: data?.[2] ?? [], statuses: data?.[3] ?? [] };

  const tasks = scope === "all" ? all.tasks : all.tasks.filter((t) => t.project_id === scope);
  const totalTracked = tasks.reduce((s, t) => s + timers.seconds(t.id), 0);

  // Çalışan bazında: yaptığı görevler + her görevin süresi + toplam süre.
  const byEmployee = all.users
    .map((u) => {
      const ut = tasks.filter((t) => t.assignee_ids.includes(u.id));
      const time = ut.reduce((s, t) => s + timers.seconds(t.id), 0);
      return { user: u, tasks: ut, time, credit: ut.reduce((s, t) => s + t.credit, 0) };
    })
    .filter((e) => e.tasks.length > 0)
    .sort((a, b) => b.time - a.time);
  const total = tasks.length;
  const done = tasks.filter((t) => t.board_id === 4).length;
  const totalCredit = tasks.reduce((s, t) => s + t.credit, 0);
  const doneCredit = tasks.filter((t) => t.board_id === 4).reduce((s, t) => s + t.credit, 0);
  const completionRate = total ? Math.round((done / total) * 100) : 0;

  // Durum dağılımı
  const byStatus = all.statuses.map((s) => ({
    ...s,
    count: tasks.filter((t) => t.board_id === s.id).length,
  }));

  // Ekip katkısı: kişi başına tamamlanan kredi
  const contributors = all.users
    .map((u) => {
      const ut = tasks.filter((t) => t.assignee_ids.includes(u.id));
      return {
        user: u,
        tasks: ut.length,
        credit: ut.reduce((s, t) => s + t.credit, 0),
        done: ut.filter((t) => t.board_id === 4).length,
      };
    })
    .filter((c) => c.tasks > 0)
    .sort((a, b) => b.credit - a.credit);
  const maxCredit = Math.max(1, ...contributors.map((c) => c.credit));

  // CSV dışa aktarım (Excel uyumlu) — gerçek, çalışan indirme.
  const exportCSV = () => {
    const rows = [
      ["Proje", "Görev", "Atanan", "Durum", "Kredi", "Süre"],
      ...tasks.map((t) => [
        all.projects.find((p) => p.id === t.project_id)?.name ?? "",
        t.title,
        t.assignee_ids
          .map((aid) => all.users.find((u) => u.id === aid)?.full_name)
          .filter(Boolean)
          .join(", "),
        all.statuses.find((s) => s.id === t.board_id)?.name ?? "",
        String(t.credit),
        formatDuration(timers.seconds(t.id)),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proteus-rapor.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => window.print(); // yazdır → PDF olarak kaydet

  if (loading) return <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>;

  return (
    <>
      <PageHeader
        title="Raporlar"
        subtitle="Performans, durum dağılımı ve ekip katkısı"
        actions={
          <>
            <select
              className="field"
              style={{ width: 200, height: 38 }}
              value={scope}
              onChange={(e) => setScope(e.target.value === "all" ? "all" : Number(e.target.value))}
            >
              <option value="all">Tüm projeler</option>
              {all.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button className="btn" onClick={exportPDF}><IconFile size={15} /> PDF</button>
            <button className="btn btn-primary" onClick={exportCSV}><IconDownload size={15} /> Excel (CSV)</button>
          </>
        }
      />

      {/* KPI kartları */}
      <div className="grid-stats" style={{ marginBottom: 18 }}>
        <Kpi icon={<IconTasks size={18} />} tone="accent" value={total} label="Toplam Görev" />
        <Kpi icon={<IconCheck size={18} />} tone="green" value={done} label="Tamamlanan" sub={`%${completionRate}`} />
        <Kpi icon={<IconClock size={18} />} tone="amber" value={formatDuration(totalTracked)} label="Toplam Çalışma Süresi" />
        <Kpi icon={<IconReport size={18} />} tone="blue" value={`${doneCredit}/${totalCredit}`} label="Kazanılan Kredi" />
      </div>

      <div className="grid-2-even" style={{ marginBottom: 18 }}>
        {/* Durum dağılımı */}
        <section className="card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Durum Dağılımı</h3>
          {/* Yatay yığılmış bar */}
          <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 16 }}>
            {byStatus.map((s) => (
              <div
                key={s.id}
                title={`${s.name}: ${s.count}`}
                style={{ width: `${total ? (s.count / total) * 100 : 0}%`, background: s.color }}
              />
            ))}
          </div>
          {byStatus.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
              <span style={{ flex: 1, fontSize: 13 }}>{s.name}</span>
              <span style={{ fontWeight: 700 }}>{s.count}</span>
              <span style={{ color: "var(--faint)", fontSize: 12, width: 44, textAlign: "right" }}>
                %{total ? Math.round((s.count / total) * 100) : 0}
              </span>
            </div>
          ))}
        </section>

        {/* Ekip katkısı */}
        <section className="card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Ekip Katkısı (kredi)</h3>
          {contributors.map((c) => (
            <div key={c.user.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0" }}>
              <Avatar id={c.user.id} name={c.user.full_name} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{c.user.full_name}</span>
                  <span style={{ color: "var(--muted)" }}>{c.credit}p · {c.done}/{c.tasks}</span>
                </div>
                <ProgressBar value={(c.credit / maxCredit) * 100} />
              </div>
            </div>
          ))}
          {contributors.length === 0 && (
            <div style={{ color: "var(--faint)", fontSize: 13 }}>Bu kapsamda atanmış görev yok.</div>
          )}
        </section>
      </div>

      {/* Çalışan bazında görevler ve süreler */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border-soft)" }}>
          <IconClock size={18} />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Çalışan Bazında Görevler & Süreler</h3>
        </div>
        {byEmployee.length === 0 && (
          <div style={{ padding: "20px 18px", color: "var(--faint)", fontSize: 13 }}>Bu kapsamda atanmış görev yok.</div>
        )}
        {byEmployee.map((e) => (
          <div key={e.user.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
            {/* Çalışan başlığı */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", background: "var(--surface2)" }}>
              <Avatar id={e.user.id} name={e.user.full_name} size={34} photoUrl={e.user.avatar_url} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{e.user.full_name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{e.user.title}</div>
              </div>
              <Badge tone="accent">{e.tasks.length} görev</Badge>
              <Badge tone="amber">{e.credit} kredi</Badge>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                <IconClock size={14} /> {formatDuration(e.time)}
              </span>
            </div>
            {/* Görev satırları */}
            {e.tasks.map((t) => {
              const st = all.statuses.find((s) => s.id === t.board_id);
              const proj = all.projects.find((p) => p.id === t.project_id);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px 10px 42px", borderTop: "1px solid var(--border-soft)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: proj?.color ?? "var(--faint)" }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{t.title}</span>
                  <Badge tone="neutral">{st?.name}</Badge>
                  <Badge tone="amber">{t.credit}p</Badge>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--muted)", width: 92, justifyContent: "flex-end", fontVariantNumeric: "tabular-nums" }}>
                    <IconClock size={13} /> {formatDuration(timers.seconds(t.id))}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Proje bazında tablo */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px", borderBottom: "1px solid var(--border-soft)" }}>
          <IconReport size={18} />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Proje Bazında Özet</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--faint)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".4px" }}>
              <th style={th}>Proje</th>
              <th style={th}>Görev</th>
              <th style={th}>Tamamlanan</th>
              <th style={th}>Kredi</th>
              <th style={{ ...th, width: 220 }}>İlerleme</th>
            </tr>
          </thead>
          <tbody>
            {all.projects
              .filter((p) => scope === "all" || p.id === scope)
              .map((p) => {
                const pt = all.tasks.filter((t) => t.project_id === p.id);
                const pd = pt.filter((t) => t.board_id === 4).length;
                const pc = pt.reduce((s, t) => s + t.credit, 0);
                return (
                  <tr key={p.id} className="row-hover" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <td style={td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color! }} />
                        {p.name}
                      </span>
                    </td>
                    <td style={td}>{pt.length}</td>
                    <td style={td}>
                      <Badge tone="green">
                        <IconCheck size={12} /> {pd}/{pt.length}
                      </Badge>
                    </td>
                    <td style={td}>{pc}p</td>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <ProgressBar value={p.progress!} />
                        </div>
                        <span style={{ fontWeight: 700, width: 38, textAlign: "right" }}>{p.progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Kpi({
  icon,
  tone,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  tone: "accent" | "green" | "amber" | "blue";
  value: string | number;
  label: string;
  sub?: string;
}) {
  return (
    <div className="card" style={{ padding: "16px 17px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `var(--${tone}-soft)`, color: `var(--${tone})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        {sub && <Badge tone={tone}>{sub}</Badge>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-1px", marginTop: 13 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "13px 18px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "13px 18px" };
