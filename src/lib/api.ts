// Rust (Tauri) komutları için ince sarmalayıcı.
// Frontend her zaman bu katman üzerinden veriye erişir; doğrudan invoke çağırmaz.
// Böylece ileride backend değişse bile UI kodu sabit kalır.
//
// Not: tarayıcıda (vite dev, Tauri olmadan) çalışırken invoke yoktur;
// bu durumda mock veriye düşeriz, böylece tasarım tarayıcıda da görünür.

import type {
  User,
  Role,
  Project,
  Task,
  Board,
  TaskStatus,
  ChatRoom,
  Message,
  NotificationItem,
  Note,
  ActivityItem,
} from "./types";
import * as mock from "./mock";

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

let invoke: InvokeFn | null = null;
async function getInvoke(): Promise<InvokeFn | null> {
  if (invoke) return invoke;
  // Tauri yoksa (saf tarayıcı önizlemesi) null döner.
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window))
    return null;
  const core = await import("@tauri-apps/api/core");
  invoke = core.invoke as InvokeFn;
  return invoke;
}

async function call<T>(cmd: string, fallback: T, args?: Record<string, unknown>): Promise<T> {
  const fn = await getInvoke();
  if (!fn) return fallback;
  try {
    return await fn<T>(cmd, args);
  } catch (e) {
    console.error(`[api] ${cmd} başarısız:`, e);
    return fallback;
  }
}

/* ----------------------------- accounts ----------------------------- */
export const api = {
  // Oturum
  login: (username: string, password: string) =>
    call<User | null>("login", mock.currentUser, { username, password }),
  currentUser: () => call<User | null>("current_user", mock.currentUser),
  logout: () => call<void>("logout", undefined),

  listUsers: () => call<User[]>("list_users", mock.users),
  listOnlineUsers: () => call<number[]>("list_online_users", mock.onlineUserIds),
  saveUser: (u: Partial<User>) => call<number>("save_user", Date.now(), u as Record<string, unknown>),
  deleteUser: (id: number) => call<void>("delete_user", undefined, { id }),
  setUserAvatar: (userId: number, avatarUrl: string | null) =>
    call<void>("set_user_avatar", undefined, { userId, avatarUrl }),
  setUserPermissions: (userId: number, permissions: string[]) =>
    call<void>("set_user_permissions", undefined, { userId, permissions }),

  listRoles: () => call<Role[]>("list_roles", mock.roles),
  saveRole: (r: { id?: number; name: string; description?: string; permissions: string[] }) =>
    call<number>("save_role", r.id ?? Date.now(), r as Record<string, unknown>),
  deleteRole: (id: number) => call<void>("delete_role", undefined, { id }),

  // Projeler
  listProjects: () => call<Project[]>("list_projects", mock.projects),
  saveProject: (p: { id?: number; name: string; description?: string; color?: string; memberIds: number[] }) =>
    call<number>("save_project", p.id ?? Date.now(), p as Record<string, unknown>),
  deleteProject: (id: number) => call<void>("delete_project", undefined, { id }),
  saveTask: (t: Record<string, unknown>) => call<number>("save_task", Date.now(), t),
  deleteTask: (id: number) => call<void>("delete_task", undefined, { id }),
  listUpdates: () => call<ActivityItem[]>("list_updates", mock.activity),
  listBoards: (projectId: number) =>
    call<Board[]>("list_boards", mock.boards, { projectId }),
  listStatuses: () => call<TaskStatus[]>("list_statuses", mock.statuses),
  listTasks: (projectId?: number) =>
    call<Task[]>("list_tasks", mock.tasks, { projectId }),
  updateTaskBoard: (taskId: number, boardId: number, position: number) =>
    call<void>("update_task_board", undefined, { taskId, boardId, position }),

  // Chat
  listRooms: () => call<ChatRoom[]>("list_rooms", mock.rooms),
  listMessages: (roomId: number) =>
    call<Message[]>("list_messages", mock.messagesFor(roomId), { roomId }),
  sendMessage: (roomId: number, body: string) =>
    call<Message | null>("send_message", null, { roomId, body }),
  createRoom: (name: string, isGroup: boolean, memberIds: number[]) =>
    call<number>("create_room", Date.now(), { name, isGroup, memberIds }),

  // Bildirim & not
  listNotifications: () =>
    call<NotificationItem[]>("list_notifications", mock.notifications),
  markNotificationRead: (id: number) =>
    call<void>("mark_notification_read", undefined, { id }),
  listNotes: () => call<Note[]>("list_notes", mock.notes),
  saveNote: (n: { id?: number; title: string; body: string; pinned: boolean }) =>
    call<number>("save_note", n.id ?? Date.now(), n as Record<string, unknown>),
  deleteNote: (id: number) => call<void>("delete_note", undefined, { id }),
};

export { mock };
