import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Basit, erişilebilir modal. Esc ile ve arka plana tıklayınca kapanır.
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Portal ile doğrudan body'ye render edilir; böylece hangi div içinde
  // çağrıldığından bağımsız olarak tam ekran ortalanır (yanlış konumlanma olmaz).
  return createPortal(
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 20,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="fade-in"
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-soft)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{title}</h3>
          <button className="btn-ghost btn-sm" onClick={onClose} style={{ width: 30, height: 30, fontSize: 18 }}>
            ×
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto" }}>{children}</div>
        {footer && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 20px", borderTop: "1px solid var(--border-soft)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Modal içinde kullanılan etiketli alan.
export function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>{label}</span>
      {children}
    </label>
  );
}
