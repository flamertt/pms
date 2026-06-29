import { NavLink } from "react-router-dom";
import {
  IconDashboard,
  IconProjects,
  IconTasks,
  IconCalendar,
  IconUsers,
  IconChat,
  IconNote,
  IconReport,
  IconShield,
  IconSettings,
  IconLogout,
} from "../icons";
import { Avatar } from "./ui";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";

// public/ altındaki varlıklar URL ile referanslanır.
const logoLight = "/logo-light.png";
const logoDark = "/logo-dark.png";

interface NavDef {
  to: string;
  label: string;
  icon: typeof IconDashboard;
  badge?: number;
  perm?: string; // gerekli izin (yoksa herkese açık)
}

const NAV: NavDef[] = [
  { to: "/", label: "Ana Sayfa", icon: IconDashboard },
  { to: "/projeler", label: "Projeler", icon: IconProjects },
  { to: "/gorevlerim", label: "Görevlerim", icon: IconTasks, badge: 4 },
  { to: "/takvim", label: "Takvim", icon: IconCalendar },
  { to: "/kullanicilar", label: "Kullanıcılar", icon: IconUsers },
  { to: "/sohbet", label: "Sohbet", icon: IconChat, badge: 4 },
  { to: "/notlar", label: "Notlarım", icon: IconNote },
  { to: "/raporlar", label: "Raporlar", icon: IconReport, perm: "view_reports" },
];

const ADMIN: NavDef[] = [
  { to: "/yonetim/roller", label: "Roller & İzinler", icon: IconShield, perm: "manage_roles" },
  { to: "/ayarlar", label: "Ayarlar", icon: IconSettings },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const showLabels = !collapsed;
  const { theme } = useTheme();
  const { has, user } = useAuth();
  // Açık temada koyu (siyah) logo, koyu temada beyaz logo kullanılır.
  const logo = theme === "dark" ? logoDark : logoLight;
  // İzni olmayan menü öğelerini gizle.
  const visible = (items: NavDef[]) => items.filter((it) => !it.perm || has(it.perm));
  const nav = visible(NAV);
  const admin = visible(ADMIN);
  return (
    <aside
      style={{
        width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
        flex: "none",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width .18s ease",
      }}
    >
      {/* Marka — temaya göre PMS logosu */}
      <div
        style={{
          height: "var(--topbar-h)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: collapsed ? "0 8px" : "0 18px",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <img
          src={logo}
          alt="PMS"
          style={{
            height: collapsed ? 30 : 38,
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      {/* Gezinme */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {nav.map((it) => (
          <Item key={it.to} {...it} showLabels={showLabels} />
        ))}

        {admin.length > 0 && (
          <div
            style={{
              margin: "12px 11px 6px",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: ".6px",
              textTransform: "uppercase",
              color: "var(--faint)",
              opacity: showLabels ? 1 : 0,
              height: showLabels ? "auto" : 0,
            }}
          >
            Yönetim
          </div>
        )}
        {admin.map((it) => (
          <Item key={it.to} {...it} showLabels={showLabels} />
        ))}
      </nav>

      {/* Kullanıcı */}
      <div style={{ padding: 10, borderTop: "1px solid var(--border-soft)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 9px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          <Avatar id={user?.id ?? 0} name={user?.full_name ?? ""} size={34} photoUrl={user?.avatar_url} />
          {showLabels && (
            <>
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.full_name ?? "—"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--faint)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.title ?? ""}
                </div>
              </div>
              <NavLink to="/giris" title="Çıkış" style={{ color: "var(--faint)", display: "flex" }}>
                <IconLogout size={17} />
              </NavLink>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function Item({
  to,
  label,
  icon: Icon,
  badge,
  showLabels,
}: NavDef & { showLabels: boolean }) {
  return (
    <NavLink to={to} end={to === "/"} title={label}>
      {({ isActive }) => (
        <div
          className="nav-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "9px 11px",
            borderRadius: 9,
            fontSize: 13.5,
            fontWeight: isActive ? 700 : 500,
            background: isActive ? "var(--accent-soft)" : "transparent",
            color: isActive ? "var(--accent)" : "var(--muted)",
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: 3,
              height: 18,
              borderRadius: "0 3px 3px 0",
              background: "var(--accent)",
              opacity: isActive ? 1 : 0,
            }}
          />
          <Icon size={18} />
          {showLabels && (
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>{label}</span>
          )}
          {showLabels && badge ? (
            <span
              style={{
                flex: "none",
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                borderRadius: 9,
                background: "var(--accent)",
                color: "#fff",
                fontSize: 10.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>
      )}
    </NavLink>
  );
}
