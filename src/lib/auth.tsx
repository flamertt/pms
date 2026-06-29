import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { User, Role } from "./types";

interface AuthCtx {
  user: User | null;
  role: Role | null;
  permissions: string[];
  loading: boolean;
  has: (perm: string) => boolean;
  refresh: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  role: null,
  permissions: [],
  loading: true,
  has: () => false,
  refresh: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    Promise.all([api.currentUser(), api.listRoles()])
      .then(([u, roles]) => {
        setUser(u);
        const r = roles.find((x) => x.id === u?.role_id) ?? null;
        setRole(r);
        // Rol izinleri + (varsa) kullanıcıya özel izinler.
        setPermissions(r?.permissions ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const has = (perm: string) => permissions.includes(perm);

  return (
    <Ctx.Provider value={{ user, role, permissions, loading, has, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
