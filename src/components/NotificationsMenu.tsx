import { useEffect, useRef, useState } from "react";
import { IconBell, IconTasks, IconChat, IconProjects, IconCheck } from "../icons";
import { api } from "../lib/api";
import { useData } from "../lib/useData";
import type { NotificationItem } from "../lib/types";

const ICON: Record<NotificationItem["kind"], { el: React.ReactNode; color: string }> = {
  task: { el: <IconTasks size={15} />, color: "var(--accent)" },
  comment: { el: <IconChat size={15} />, color: "var(--blue)" },
  project: { el: <IconProjects size={15} />, color: "var(--amber)" },
  mention: { el: <IconBell size={15} />, color: "var(--red)" },
  system: { el: <IconBell size={15} />, color: "var(--muted)" },
};

// Sağ üstteki zil — açılır bildirim paneli (okundu/okunmadı).
export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const { data } = useData(() => api.listNotifications(), []);
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});
  const items: NotificationItem[] = (data ?? []).map((n) =>
    overrides[n.id] ? { ...n, is_read: true } : n
  );
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.is_read).length;

  // Dışarı tıklayınca kapat.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markRead = (id: number) => {
    setOverrides((o) => ({ ...o, [id]: true }));
    api.markNotificationRead(id);
  };
  const markAll = () => {
    items.forEach((n) => !n.is_read && markRead(n.id));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} title="Bildirimler" style={iconBtn}>
        <IconBell size={17} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 7,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 8,
              background: "var(--red)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid var(--surface)",
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fade-in"
          style={{
            position: "absolute",
            top: 48,
            right: 0,
            width: 360,
            maxHeight: 460,
            display: "flex",
            flexDirection: "column",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 16px", borderBottom: "1px solid var(--border-soft)" }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 700, flex: 1 }}>Bildirimler</h3>
            {unread > 0 && (
              <button className="btn-ghost btn-sm" onClick={markAll} style={{ height: 26, color: "var(--accent)" }}>
                <IconCheck size={14} /> Tümünü okundu yap
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto" }}>
            {items.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--faint)", fontSize: 13 }}>
                Bildirim yok
              </div>
            )}
            {items.map((n) => {
              const ic = ICON[n.kind];
              return (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className="row-hover"
                  style={{
                    display: "flex",
                    gap: 11,
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-soft)",
                    cursor: "pointer",
                    background: n.is_read ? "transparent" : "var(--accent-soft)",
                  }}
                >
                  <div style={{ width: 32, height: 32, flex: "none", borderRadius: 8, background: "var(--surface2)", color: ic.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {ic.el}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 3 }}>2 saat önce</div>
                  </div>
                  {!n.is_read && (
                    <span style={{ width: 8, height: 8, flex: "none", borderRadius: "50%", background: "var(--accent)", marginTop: 6 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  position: "relative",
  width: 38,
  height: 38,
  flex: "none",
  border: "1px solid var(--border)",
  background: "var(--surface2)",
  borderRadius: 10,
  color: "var(--muted)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
