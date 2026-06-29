import { IconMenu, IconSearch, IconSun, IconMoon } from "../icons";
import { useTheme } from "../lib/theme";
import { NotificationsMenu } from "./NotificationsMenu";

export function Topbar({
  title,
  subtitle,
  onToggleSidebar,
}: {
  title: string;
  subtitle?: string;
  onToggleSidebar: () => void;
}) {
  const { theme, toggle } = useTheme();

  return (
    <header
      style={{
        height: "var(--topbar-h)",
        flex: "none",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "0 22px 0 18px",
      }}
    >
      {/* SOL: menü + başlık */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <button className="btn-ghost" onClick={onToggleSidebar} title="Menüyü daralt"
          style={{ width: 34, height: 34, flex: "none", border: "none", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconMenu />
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</div>
          )}
        </div>
      </div>

      {/* ORTA: arama */}
      <label
        className="topbar-search"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "0 12px",
          height: 38,
          width: 340,
          flex: "none",
          color: "var(--muted)",
        }}
      >
        <IconSearch size={16} />
        <input
          placeholder="Görev, proje veya kişi ara…"
          style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontSize: 13, color: "var(--text)" }}
        />
        <span style={{ fontSize: 11, border: "1px solid var(--border)", borderRadius: 5, padding: "1px 5px", color: "var(--faint)" }}>
          ⌘K
        </span>
      </label>

      {/* SAĞ: tema + bildirim */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, justifyContent: "flex-end" }}>
        <button onClick={toggle} title="Tema değiştir" style={iconBtn}>
          {theme === "light" ? <IconMoon size={17} /> : <IconSun size={17} />}
        </button>
        <NotificationsMenu />
      </div>
    </header>
  );
}

const iconBtn: React.CSSProperties = {
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
