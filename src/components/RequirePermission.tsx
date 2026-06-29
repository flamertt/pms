import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { IconShield } from "../icons";
import { EmptyState } from "./ui";

// Belirli bir izne sahip olmayan kullanıcılara erişimi kapatır.
export function RequirePermission({ perm, children }: { perm: string; children: ReactNode }) {
  const { has, loading } = useAuth();
  if (loading) return null;
  if (!has(perm)) {
    return (
      <EmptyState
        icon={<IconShield size={40} />}
        title="Bu sayfaya erişim yetkiniz yok"
        hint="Bu bölüm yalnızca yöneticiler içindir."
      />
    );
  }
  return <>{children}</>;
}
