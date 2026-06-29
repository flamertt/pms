import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// Rota -> başlık/alt başlık eşlemesi (topbar için).
const TITLES: Record<string, [string, string]> = {
  "/": ["Ana Sayfa", "Genel bakış ve son aktiviteler"],
  "/projeler": ["Projeler", "Tüm projeleri yönet"],
  "/gorevlerim": ["Görevlerim", "Sana atanan görevler"],
  "/takvim": ["Takvim", "Zaman çizelgesi görünümü"],
  "/agac": ["Proje Ağacı", "Proje hiyerarşisi"],
  "/kullanicilar": ["Kullanıcılar", "Ekip dizini"],
  "/sohbet": ["Sohbet", "Gerçek zamanlı mesajlaşma"],
  "/notlar": ["Notlarım", "Kişisel ve grup notları"],
  "/raporlar": ["Raporlar", "Proje raporları ve dışa aktarım"],
  "/yonetim/roller": ["Roller & İzinler", "Rol tabanlı yetkilendirme"],
  "/ayarlar": ["Ayarlar", "Hesap ve güvenlik"],
};

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  const match =
    TITLES[pathname] ||
    (pathname.startsWith("/projeler/") ? ["Proje Detayı", "Kanban panosu"] : null) ||
    (pathname.startsWith("/kullanicilar/") ? ["Profil", "Kullanıcı profili"] : null) ||
    (pathname.startsWith("/sohbet/") ? ["Sohbet", "Gerçek zamanlı mesajlaşma"] : null) ||
    ["PMS", ""];

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      <Sidebar collapsed={collapsed} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar
          title={match[0]}
          subtitle={match[1]}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />
        <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
          <div className="fade-in" style={{ padding: "26px 30px 48px", maxWidth: 1480, margin: "0 auto" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
