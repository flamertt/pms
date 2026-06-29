import { useRef, useState } from "react";
import { Avatar, PageHeader } from "../../components/ui";
import { IconCamera } from "../../icons";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

// Ayarlar: profil, foto (DB'ye yazılır), şifre, 2FA.
export function Settings() {
  const { user, refresh, loading } = useAuth();
  const [tab, setTab] = useState<"profil" | "guvenlik" | "bildirim">("profil");
  const [twoFA, setTwoFA] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // user yüklendiğinde başlangıç değerlerini bir kez doldur.
  const [initialized, setInitialized] = useState(false);
  if (user && !initialized) {
    setPhoto(user.avatar_url);
    setTwoFA(user.enable_2fa);
    setInitialized(true);
  }

  if (loading) return <div style={{ color: "var(--muted)" }}>Yükleniyor…</div>;
  if (!user) return <div style={{ color: "var(--muted)" }}>Kullanıcı bulunamadı.</div>;

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSave = async () => {
    // Fotoğrafı DB'ye yaz.
    await api.setUserAvatar(user.id, photo);
    setSaved(true);
    refresh();
    window.setTimeout(() => setSaved(false), 2000);
  };

  const SaveBtn = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {saved && <span style={{ color: "var(--green)", fontSize: 13, fontWeight: 600 }}>✓ Kaydedildi</span>}
      <button className="btn btn-primary" onClick={onSave}>Kaydet</button>
    </div>
  );

  return (
    <>
      <PageHeader title="Ayarlar" subtitle="Hesap ve güvenlik tercihleri" />
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {([["profil", "Profil"], ["guvenlik", "Güvenlik & 2FA"], ["bildirim", "Bildirimler"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={tab === k ? "btn btn-primary btn-sm" : "btn btn-sm"}>
            {l}
          </button>
        ))}
      </div>

      {tab === "profil" && (
        <div className="card" style={{ padding: 22, maxWidth: 620, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <Avatar id={user.id} name={user.full_name} size={64} photoUrl={photo} />
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} style={{ display: "none" }} />
              <button className="btn" onClick={() => fileRef.current?.click()}>
                <IconCamera size={15} /> Fotoğraf Yükle
              </button>
              {photo && (
                <button className="btn btn-ghost btn-sm" onClick={() => setPhoto(null)} style={{ marginLeft: 8, color: "var(--red)" }}>
                  Kaldır
                </button>
              )}
              <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 6 }}>
                Kaydedince fotoğraf veritabanına yazılır.
              </div>
            </div>
          </div>
          <div className="grid-2-form">
            <Input label="Ad Soyad" value={user.full_name} />
            <Input label="Kullanıcı Adı" value={user.username} />
            <Input label="E-posta" value={user.email} />
            <Input label="Telefon" value={user.phone ?? ""} />
            <Input label="Kimlik No" value={user.identity_no ?? ""} />
            <Input label="Telsiz No" value={user.radio_no ?? ""} />
            <Input label="Takım" value={user.team ?? ""} />
            <Input label="Ünvan" value={user.title ?? ""} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <SaveBtn />
          </div>
        </div>
      )}

      {tab === "guvenlik" && (
        <div className="card" style={{ padding: 22, maxWidth: 620, margin: "0 auto" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Şifre Değiştir</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            <Input label="Mevcut Şifre" type="password" value="" />
            <Input label="Yeni Şifre" type="password" value="" />
            <Input label="Yeni Şifre (Tekrar)" type="password" value="" />
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>İki Faktörlü Doğrulama (2FA)</h3>
          <label style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface2)", cursor: "pointer" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>2FA Etkin</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>TOTP / e-posta ile ek güvenlik</div>
            </div>
            <Toggle on={twoFA} onChange={setTwoFA} />
          </label>
          {twoFA && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 8 }}>Doğrulama yöntemi</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary btn-sm">Authenticator (TOTP)</button>
                <button className="btn btn-sm">E-posta</button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <SaveBtn />
          </div>
        </div>
      )}

      {tab === "bildirim" && (
        <div className="card" style={{ padding: 22, maxWidth: 620, margin: "0 auto" }}>
          {["Görev atandığında", "Yorum yapıldığında", "Bahsedildiğimde", "Proje güncellemelerinde"].map((l, i) => (
            <label key={l} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border-soft)" }}>
              <span style={{ flex: 1, fontWeight: 600 }}>{l}</span>
              <Toggle on={i < 3} onChange={() => {}} />
            </label>
          ))}
        </div>
      )}
    </>
  );
}

function Input({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>{label}</span>
      <input className="field" defaultValue={value} type={type} />
    </label>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{ width: 42, height: 24, borderRadius: 12, border: "none", background: on ? "var(--accent)" : "var(--border)", position: "relative", transition: "background .15s" }}
    >
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
    </button>
  );
}
