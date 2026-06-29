import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../lib/theme";

// Şifre işlemleri: giriş, şifremi unuttum + token ile sıfırlama.
type Mode = "login" | "forgot" | "reset" | "twofa";

function Shell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const logo = theme === "dark" ? "/logo-dark.png" : "/logo-light.png";
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 20,
      }}
    >
      <div className="card fade-in" style={{ width: 400, maxWidth: "100%", padding: 34, boxShadow: "var(--shadow-md)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <img src={logo} alt="PMS" style={{ height: 46, width: "auto" }} />
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>{label}</span>
      <input className="field" type={type} />
    </label>
  );
}

export function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const nav = useNavigate();

  if (mode === "login")
    return (
      <Shell>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Tekrar hoş geldin</h2>
        <p style={{ color: "var(--faint)", fontSize: 13, marginBottom: 22 }}>Devam etmek için giriş yap</p>
        <Input label="Kullanıcı adı veya e-posta" />
        <Input label="Şifre" type="password" />
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
          <button onClick={() => setMode("forgot")} className="btn-ghost btn-sm" style={{ color: "var(--accent)" }}>
            Şifremi unuttum
          </button>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", height: 44 }} onClick={() => setMode("twofa")}>
          Giriş Yap
        </button>
      </Shell>
    );

  if (mode === "twofa")
    return (
      <Shell>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>İki faktörlü doğrulama</h2>
        <p style={{ color: "var(--faint)", fontSize: 13, marginBottom: 22 }}>
          Authenticator uygulamandaki 6 haneli kodu gir
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginBottom: 22 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              maxLength={1}
              className="field"
              style={{ width: 48, height: 56, textAlign: "center", fontSize: 22, fontWeight: 700, padding: 0 }}
            />
          ))}
        </div>
        <button className="btn btn-primary" style={{ width: "100%", height: 44 }} onClick={() => nav("/")}>
          Doğrula
        </button>
      </Shell>
    );

  if (mode === "forgot")
    return (
      <Shell>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Şifreni mi unuttun?</h2>
        <p style={{ color: "var(--faint)", fontSize: 13, marginBottom: 22 }}>
          E-posta adresine sıfırlama bağlantısı gönderelim
        </p>
        <Input label="E-posta" type="text" />
        <button className="btn btn-primary" style={{ width: "100%", height: 44, marginBottom: 12 }} onClick={() => setMode("reset")}>
          Bağlantı Gönder
        </button>
        <button className="btn-ghost btn-sm" style={{ width: "100%" }} onClick={() => setMode("login")}>
          ← Girişe dön
        </button>
      </Shell>
    );

  // reset (token ile)
  return (
    <Shell>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Yeni şifre belirle</h2>
      <p style={{ color: "var(--faint)", fontSize: 13, marginBottom: 22 }}>Token doğrulandı. Yeni şifreni gir.</p>
      <Input label="Yeni şifre" type="password" />
      <Input label="Yeni şifre (tekrar)" type="password" />
      <button className="btn btn-primary" style={{ width: "100%", height: 44 }} onClick={() => setMode("login")}>
        Şifreyi Güncelle
      </button>
    </Shell>
  );
}
