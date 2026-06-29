import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconTrash, IconShield } from "../icons";

type Tone = "danger" | "warning" | "info";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: Tone;
}

type Resolver = (ok: boolean) => void;

const Ctx = createContext<(o: ConfirmOptions) => Promise<boolean>>(async () => false);

const TONES: Record<Tone, { color: string; soft: string; icon: ReactNode }> = {
  danger: { color: "var(--red)", soft: "var(--red-soft)", icon: <IconTrash size={26} /> },
  warning: { color: "var(--amber)", soft: "var(--amber-soft)", icon: <IconShield size={26} /> },
  info: { color: "var(--accent)", soft: "var(--accent-soft)", icon: <IconShield size={26} /> },
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<{ fn: Resolver } | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => setResolver({ fn: resolve }));
  }, []);

  const close = (ok: boolean) => {
    resolver?.fn(ok);
    setOpts(null);
    setResolver(null);
  };

  const tone = TONES[opts?.tone ?? "danger"];

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {opts &&
        createPortal(
          <div
            onMouseDown={() => close(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 300,
              padding: 20,
            }}
          >
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="fade-in"
              style={{
                width: 380,
                maxWidth: "100%",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                boxShadow: "var(--shadow-lg)",
                padding: 26,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: tone.soft,
                  color: tone.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                {tone.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{opts.title}</h3>
              {opts.message && (
                <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, marginBottom: 22 }}>
                  {opts.message}
                </p>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: opts.message ? 0 : 18 }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => close(false)}>
                  {opts.cancelText ?? "Vazgeç"}
                </button>
                <button
                  className="btn"
                  style={{
                    flex: 1,
                    background: tone.color,
                    borderColor: tone.color,
                    color: "#fff",
                  }}
                  onClick={() => close(true)}
                >
                  {opts.confirmText ?? "Sil"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </Ctx.Provider>
  );
}

export const useConfirm = () => useContext(Ctx);
