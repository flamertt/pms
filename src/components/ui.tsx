// Küçük, yeniden kullanılabilir sunum bileşenleri.
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { IconUser } from "../icons";

// Tıklanarak girilen detay sayfalarında geri dönüş butonu.
export function BackButton({ label = "Geri", to }: { label?: string; to?: string }) {
  const nav = useNavigate();
  return (
    <button
      className="btn-ghost btn-sm"
      onClick={() => (to ? nav(to) : nav(-1))}
      style={{ marginBottom: 14, paddingLeft: 8 }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>←</span> {label}
    </button>
  );
}

export function Avatar({
  id: _id,
  name: _name,
  size = 34,
  online,
  photoUrl,
}: {
  id: number;
  name: string;
  size?: number;
  online?: boolean;
  photoUrl?: string | null;
}) {
  return (
    <div style={{ position: "relative", flex: "none" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          color: "var(--faint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <IconUser size={Math.round(size * 0.56)} />
        )}
      </div>
      {online !== undefined && (
        <span
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: "50%",
            background: online ? "var(--green)" : "var(--faint)",
            border: "2px solid var(--surface)",
          }}
        />
      )}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "green" | "amber" | "red" | "blue";
}) {
  const map: Record<string, [string, string]> = {
    neutral: ["var(--surface2)", "var(--muted)"],
    accent: ["var(--accent-soft)", "var(--accent)"],
    green: ["var(--green-soft)", "var(--green)"],
    amber: ["var(--amber-soft)", "var(--amber)"],
    red: ["var(--red-soft)", "var(--red)"],
    blue: ["var(--blue-soft)", "var(--blue)"],
  };
  const [bg, fg] = map[tone];
  return (
    <span className="badge" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, color = "var(--accent)" }: { value: number; color?: string }) {
  return (
    <div
      style={{
        height: 7,
        borderRadius: 4,
        background: "var(--surface2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: color,
          borderRadius: 4,
          transition: "width .3s ease",
        }}
      />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 22,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.4px" }}>{title}</h1>
        {subtitle && (
          <p style={{ color: "var(--faint)", fontSize: 13, marginTop: 3 }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        color: "var(--faint)",
        textAlign: "center",
      }}
    >
      {icon && <div style={{ marginBottom: 12, opacity: 0.6 }}>{icon}</div>}
      <div style={{ fontWeight: 600, color: "var(--muted)" }}>{title}</div>
      {hint && <div style={{ fontSize: 13, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
