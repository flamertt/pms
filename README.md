# Proteus — İş & Proje Yönetim Platformu

Tauri 2 + React + TypeScript + SQLite ile geliştirilmiş masaüstü uygulaması.
Renk/tema sistemi `src/styles/root.css` içindeki CSS değişkenlerinden (root) gelir.

## Mimari

```
src/                     React + TS frontend
  styles/root.css        Tasarım sistemi (tema değişkenleri — açık/koyu)
  lib/                   types · api (Tauri sarmalayıcı) · theme · mock veri
  components/            AppShell · Sidebar · Topbar · ortak UI
  features/
    accounts/            Dashboard, Çalışanlar, Profil, Kullanıcı/Rol yönetimi,
                         Ayarlar (2FA), Notlar, Bildirimler, Giriş
    projects/            Projeler, Kanban, Görevlerim, Takvim, Ağaç, Raporlar
    chat/                Gerçek zamanlı sohbet arayüzü
src-tauri/               Rust backend
  src/db/                SQLite şeması + bağlantı + seed
  src/models.rs          Frontend ile eşleşen veri modelleri
  src/commands/          accounts · projects · chat komutları
```

## Çalıştırma

```bash
npm install
npm run tauri:dev      # masaüstü uygulaması (Rust + SQLite ile)
npm run dev            # sadece tarayıcıda UI önizlemesi (mock veri)
```

## Üretim derlemesi

```bash
npm run tauri:build
```

> Not: `tauri build` için `src-tauri/icons/` altında uygulama ikonları gerekir.
> `npm run tauri icon path/to/logo.png` ile üretebilirsiniz.
