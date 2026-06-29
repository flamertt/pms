import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ThemeProvider } from "./lib/theme";
import { AuthProvider } from "./lib/auth";
import { TimerProvider } from "./lib/timers";
import { ConfirmProvider } from "./components/Confirm";
import { RequirePermission } from "./components/RequirePermission";

import { Dashboard } from "./features/accounts/Dashboard";
import { Users } from "./features/accounts/Users";
import { EmployeeProfile } from "./features/accounts/EmployeeProfile";
import { RolesAdmin } from "./features/accounts/RolesAdmin";
import { Settings } from "./features/accounts/Settings";
import { Notes } from "./features/accounts/Notes";
import { Auth } from "./features/accounts/Auth";

import { ProjectsList } from "./features/projects/ProjectsList";
import { KanbanBoard } from "./features/projects/KanbanBoard";
import { MyTasks } from "./features/projects/MyTasks";
import { CalendarView } from "./features/projects/CalendarView";
import { ProjectTree } from "./features/projects/ProjectTree";
import { Reports } from "./features/projects/Reports";

import { Chat } from "./features/chat/Chat";

const router = createBrowserRouter([
  { path: "/giris", element: <Auth /> },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "projeler", element: <ProjectsList /> },
      { path: "projeler/:id", element: <KanbanBoard /> },
      { path: "gorevlerim", element: <MyTasks /> },
      { path: "takvim", element: <CalendarView /> },
      { path: "agac", element: <ProjectTree /> },
      { path: "kullanicilar", element: <Users /> },
      { path: "kullanicilar/:id", element: <EmployeeProfile /> },
      { path: "sohbet", element: <Chat /> },
      { path: "sohbet/:roomId", element: <Chat /> },
      { path: "notlar", element: <Notes /> },
      {
        path: "raporlar",
        element: (
          <RequirePermission perm="view_reports">
            <Reports />
          </RequirePermission>
        ),
      },
      {
        path: "yonetim/roller",
        element: (
          <RequirePermission perm="manage_roles">
            <RolesAdmin />
          </RequirePermission>
        ),
      },
      { path: "ayarlar", element: <Settings /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TimerProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </TimerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
