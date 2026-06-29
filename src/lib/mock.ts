// Tasarım önizlemesi için örnek (seed) veri.
// Tauri/Rust devredeyken bu veriler kullanılmaz; sadece tarayıcı önizlemesi
// ve ilk SQLite tohumlaması için referanstır.

import type {
  User,
  Role,
  Project,
  Board,
  TaskStatus,
  Task,
  ChatRoom,
  Message,
  NotificationItem,
  Note,
} from "./types";

export const users: User[] = [
  u(1, "ahmet", "Ahmet Yılmaz", "Proje Yöneticisi", "AY", "Yönetim", 1),
  u(2, "elif", "Elif Demir", "Kıdemli Geliştirici", "ED", "Yazılım", 2),
  u(3, "mert", "Mert Kaya", "UI/UX Tasarımcı", "MK", "Tasarım", 2),
  u(4, "zeynep", "Zeynep Aydın", "Backend Geliştirici", "ZA", "Yazılım", 2),
  u(5, "can", "Can Öztürk", "QA Mühendisi", "CÖ", "Kalite", 3),
  u(6, "selin", "Selin Arslan", "İş Analisti", "SA", "Analiz", 3),
  u(7, "burak", "Burak Şahin", "DevOps", "BŞ", "Altyapı", 2),
  u(8, "deniz", "Deniz Çelik", "Stajyer", "DÇ", "Yazılım", 3),
];

function u(
  id: number,
  username: string,
  full_name: string,
  title: string,
  _initials: string,
  team: string,
  role_id: number
): User {
  return {
    id,
    username,
    email: `${username}@proteus.app`,
    full_name,
    identity_no: null,
    phone: "+90 5xx xxx xx xx",
    radio_no: `TLS-${100 + id}`,
    team,
    avatar_url: null,
    title,
    is_active: true,
    enable_2fa: id <= 2,
    two_factor_method: id <= 2 ? "totp" : null,
    role_id,
  };
}

export const currentUser: User = users[0];

export const roles: Role[] = [
  {
    id: 1,
    name: "Yönetici",
    description: "Tüm yetkilere sahip sistem yöneticisi",
    permissions: [
      "manage_users",
      "manage_roles",
      "edit_user_permissions",
      "manage_projects",
      "view_reports",
    ],
    user_count: 1,
  },
  {
    id: 2,
    name: "Ekip Üyesi",
    description: "Proje ve görev yönetimi",
    permissions: ["manage_projects", "view_reports"],
    user_count: 5,
  },
  {
    id: 3,
    name: "İzleyici",
    description: "Sadece görüntüleme yetkisi",
    permissions: [],
    user_count: 2,
  },
];

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

export const projects: Project[] = [
  p(1, "Mobil Uygulama v2", "#0d9488", 68, [1, 2, 3, 4]),
  p(2, "Kurumsal Web Sitesi", "#3b7fd9", 42, [1, 3, 6]),
  p(3, "Veri Ambarı Göçü", "#1f9d63", 90, [1, 4, 7]),
  p(4, "Pazarlama Otomasyonu", "#cc8a2e", 25, [1, 6, 8]),
  p(5, "İç Araç — IK Portalı", "#d65149", 55, [1, 2, 5]),
];

function p(
  id: number,
  name: string,
  color: string,
  progress: number,
  member_ids: number[]
): Project {
  return {
    id,
    name,
    description: "Aktif proje",
    created_by: 1,
    is_active: true,
    color,
    member_ids,
    progress,
    created_at: "2026-01-10",
  };
}

export const statuses: TaskStatus[] = [
  { id: 1, name: "Yapılacak", color: "var(--faint)", position: 0 },
  { id: 2, name: "Devam Ediyor", color: "var(--blue)", position: 1 },
  { id: 3, name: "İncelemede", color: "var(--amber)", position: 2 },
  { id: 4, name: "Tamamlandı", color: "var(--green)", position: 3 },
];

export const boards: Board[] = statuses.map((s) => ({
  id: s.id,
  project_id: 1,
  name: s.name,
  position: s.position,
}));

export const tasks: Task[] = [
  t(1, 1, "Giriş ekranı tasarımı", 3, 1, "high", 5),
  t(2, 1, "API kimlik doğrulama", 2, 4, "urgent", 8),
  t(3, 2, "Push bildirim entegrasyonu", 2, 7, "normal", 5),
  t(4, 1, "Onboarding akışı", 3, 3, "normal", 3),
  t(5, 3, "Birim testleri", 3, 5, "high", 5),
  t(6, 1, "Profil sayfası API", 4, 4, "normal", 3),
  t(7, 4, "Kanban sürükle-bırak", 2, 2, "high", 8),
  t(8, 4, "Dosya yükleme", 4, 7, "normal", 2),
  t(9, 2, "Raporlama modülü", 1, 6, "urgent", 13),
  t(10, 1, "Dark mode iyileştirmeleri", 1, 3, "low", 2),
  t(11, 3, "Bildirim merkezi", 4, 2, "normal", 5),
  t(12, 1, "Erişilebilirlik denetimi", 4, 5, "low", 3),
];

function t(
  id: number,
  board_id: number,
  title: string,
  assignee_id: number,
  assigner_id: number,
  priority: Task["priority"],
  credit: number
): Task {
  return {
    id,
    project_id: 1,
    board_id,
    title,
    description: null,
    assignee_id,
    assigner_id,
    start_at: "2026-06-20",
    due_at: "2026-07-05",
    credit,
    position: id,
    priority,
  };
}

export const rooms: ChatRoom[] = [
  {
    id: 1,
    name: "Mobil Uygulama v2",
    is_group: true,
    member_ids: [1, 2, 3, 4],
    unread: 3,
    last_message: "Elif: PR'ı birazdan açıyorum",
    last_at: "09:41",
  },
  {
    id: 2,
    name: "Tasarım Ekibi",
    is_group: true,
    member_ids: [1, 3, 6],
    unread: 0,
    last_message: "Mert: Yeni mockup hazır",
    last_at: "Dün",
  },
  {
    id: 3,
    name: "Elif Demir",
    is_group: false,
    member_ids: [1, 2],
    unread: 1,
    last_message: "Toplantıya katılabilir misin?",
    last_at: "08:12",
  },
  {
    id: 4,
    name: "Can Öztürk",
    is_group: false,
    member_ids: [1, 5],
    unread: 0,
    last_message: "Test raporunu gönderdim",
    last_at: "Pzt",
  },
];

const msgs: Record<number, Message[]> = {
  1: [
    m(1, 1, 2, "Günaydın ekip! Bugünkü plan ne?"),
    m(2, 1, 3, "Giriş ekranını bitirdim, inceleyebilirsiniz."),
    m(3, 1, 1, "Harika, ben de API tarafına bakıyorum."),
    m(4, 1, 2, "PR'ı birazdan açıyorum 🚀"),
  ],
  3: [m(5, 3, 2, "Toplantıya katılabilir misin?")],
};

function m(id: number, room_id: number, sender_id: number, body: string): Message {
  return {
    id,
    room_id,
    sender_id,
    body,
    created_at: "2026-06-29T09:00:00",
  };
}

export const messagesFor = (roomId: number): Message[] => msgs[roomId] ?? [];

export const onlineUserIds = [1, 2, 3, 5, 7];

import type { ActivityItem } from "./types";
export const activity: ActivityItem[] = [
  { id: 1, actor_id: 2, actor_name: "Elif Demir", verb: "tamamladı", summary: "API kimlik doğrulama görevini tamamladı", created_at: "10 dk önce" },
  { id: 2, actor_id: 3, actor_name: "Mert Kaya", verb: "yorum", summary: "Giriş ekranı tasarımı görevine yorum yaptı", created_at: "1 saat önce" },
  { id: 3, actor_id: 4, actor_name: "Zeynep Aydın", verb: "oluşturdu", summary: "Profil sayfası API görevini oluşturdu", created_at: "3 saat önce" },
];

export const notifications: NotificationItem[] = [
  n(1, "Yeni görev atandı", "“API kimlik doğrulama” görevi size atandı", "task", false),
  n(2, "Yorum", "Elif Demir bir göreve yorum yaptı", "comment", false),
  n(3, "Proje güncellemesi", "Mobil Uygulama v2 ilerlemesi %68", "project", false),
  n(4, "Bahsedilme", "Mert Kaya sizi bir yorumda etiketledi", "mention", true),
  n(5, "Sistem", "Şifreniz 14 gün sonra sona erecek", "system", true),
];

function n(
  id: number,
  title: string,
  body: string,
  kind: NotificationItem["kind"],
  is_read: boolean
): NotificationItem {
  return {
    id,
    user_id: 1,
    title,
    body,
    kind,
    is_read,
    target_type: null,
    target_id: null,
    created_at: "2026-06-29T08:30:00",
  };
}

export const notes: Note[] = [
  {
    id: 1,
    user_id: 1,
    title: "Sprint planlaması",
    body: "Pazartesi retrospektif, Salı planlama. Kapasite: 40 puan.",
    pinned: true,
    created_at: "2026-06-25",
    updated_at: "2026-06-28",
  },
  {
    id: 2,
    user_id: 1,
    title: "Toplantı notları",
    body: "Müşteri yeni raporlama ekranı istedi — backlog'a eklendi.",
    pinned: false,
    created_at: "2026-06-22",
    updated_at: "2026-06-22",
  },
  {
    id: 3,
    user_id: 1,
    title: "Fikirler",
    body: "Bildirimlere ses efekti ekle. Klavye kısayolları dökümante et.",
    pinned: false,
    created_at: "2026-06-20",
    updated_at: "2026-06-20",
  },
];

// Yardımcı: kullanıcı baş harfleri ve sabit avatar rengi
export function initials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const avatarColors = [
  "#0d9488",
  "#3b7fd9",
  "#1f9d63",
  "#cc8a2e",
  "#d65149",
  "#0f766e",
  "#c0518f",
  "#2f9e72",
];
export const avatarColor = (id: number) => avatarColors[id % avatarColors.length];
