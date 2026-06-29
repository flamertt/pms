// Uygulama genelinde paylaşılan veri tipleri.
// Rust tarafındaki modellerle (src-tauri/src/models) birebir eşleşir.

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  identity_no: string | null;
  phone: string | null;
  radio_no: string | null;
  team: string | null;
  avatar_url: string | null;
  title: string | null;
  is_active: boolean;
  enable_2fa: boolean;
  two_factor_method: "email" | "totp" | null;
  role_id: number | null;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: string[]; // izin kodları
  user_count?: number;
}

// Sistemdeki tüm izin kodları (manage_users, manage_roles, ...)
export type PermissionCode = string;

export interface Permission {
  code: PermissionCode;
  label: string;
  group: string;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  body: string;
  pinned: boolean;
  scope?: "personal" | "group"; // kişisel mi grup notu mu
  group?: string | null; // grup adı (scope=group ise)
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  body: string;
  kind: "task" | "project" | "comment" | "mention" | "system";
  is_read: boolean;
  target_type: string | null;
  target_id: number | null;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  is_active: boolean;
  color: string | null;
  member_ids: number[];
  progress?: number;
  created_at: string;
}

export interface ProjectMember {
  project_id: number;
  user_id: number;
  role: string;
}

export interface Board {
  id: number;
  project_id: number;
  name: string;
  position: number;
}

export interface TaskStatus {
  id: number;
  name: string;
  color: string;
  position: number;
}

export interface Task {
  id: number;
  project_id: number;
  board_id: number;
  title: string;
  description: string | null;
  assignee_id: number | null; // birincil atanan (geri uyumluluk; assignee_ids[0])
  assignee_ids: number[]; // göreve atanan tüm kişiler
  assigner_id: number | null;
  start_at: string | null;
  due_at: string | null;
  credit: number; // puanlama
  position: number;
  priority: "low" | "normal" | "high" | "urgent";
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  body: string;
  created_at: string;
}

export interface TaskFile {
  id: number;
  task_id: number;
  name: string;
  size: number;
  uploaded_by: number;
  created_at: string;
}

export interface UpdateLog {
  id: number;
  actor_id: number;
  verb: string;
  target_type: string;
  target_id: number;
  summary: string;
  created_at: string;
}

// Dashboard aktivite akışı (updates_log + aktör adı).
export interface ActivityItem {
  id: number;
  actor_id: number;
  actor_name: string;
  verb: string;
  summary: string;
  created_at: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  is_group: boolean;
  member_ids: number[];
  unread?: number;
  last_message?: string;
  last_at?: string;
}

export interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  body: string;
  created_at: string;
}
