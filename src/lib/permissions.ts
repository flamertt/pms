// Sistemdeki tüm izin kodları (statik katalog — DB verisi değil, yapılandırmadır).
// Roller bu kodların alt kümesini seçer.
export const permissionGroups = [
  {
    group: "Kullanıcı & Yetki",
    items: [
      { code: "manage_users", label: "Kullanıcıları yönet" },
      { code: "manage_roles", label: "Rolleri yönet" },
      { code: "edit_user_permissions", label: "Kullanıcı izinlerini düzenle" },
    ],
  },
  {
    group: "Proje",
    items: [
      { code: "manage_projects", label: "Projeleri yönet" },
      { code: "view_reports", label: "Raporları görüntüle" },
    ],
  },
];
