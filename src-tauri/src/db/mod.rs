use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

/// Uygulama genelinde paylaşılan veritabanı bağlantısı.
/// Tauri `State` olarak yönetilir; komutlar `state.0.lock()` ile erişir.
pub struct Db(pub Mutex<Connection>);

/// Veritabanını açar, şemayı uygular ve eksik tabloları tohumlar (idempotent seed).
pub fn init(app: &AppHandle) -> Result<Db, Box<dyn std::error::Error>> {
    let dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&dir)?;
    let path = dir.join("proteus.sqlite3");

    let conn = Connection::open(path)?;
    conn.execute_batch(include_str!("schema.sql"))?;
    seed(&conn)?;

    Ok(Db(Mutex::new(conn)))
}

fn count(conn: &Connection, table: &str) -> rusqlite::Result<i64> {
    conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |r| r.get(0))
}

/// Her bölümü yalnızca boşsa doldurur — mevcut DB'lerde eksik test verisini de tamamlar.
fn seed(conn: &Connection) -> rusqlite::Result<()> {
    // --- Roller ---
    if count(conn, "roles")? == 0 {
        conn.execute_batch(
            r#"
            INSERT INTO roles (name, description) VALUES
                ('Yönetici', 'Tüm yetkilere sahip sistem yöneticisi'),
                ('Ekip Üyesi', 'Proje ve görev yönetimi'),
                ('İzleyici', 'Sadece görüntüleme');
            INSERT INTO role_permissions (role_id, permission)
            SELECT id, p FROM roles, (SELECT 'manage_users' p UNION SELECT 'manage_roles'
                UNION SELECT 'edit_user_permissions' UNION SELECT 'manage_projects'
                UNION SELECT 'view_reports') WHERE roles.name='Yönetici';
            INSERT INTO role_permissions (role_id, permission)
            SELECT id, p FROM roles, (SELECT 'manage_projects' p UNION SELECT 'view_reports')
                WHERE roles.name='Ekip Üyesi';
            "#,
        )?;
    }

    // --- Görev durumları ---
    if count(conn, "task_statuses")? == 0 {
        conn.execute_batch(
            r#"INSERT INTO task_statuses (name,color,position) VALUES
                ('Yapılacak','var(--faint)',0),('Devam Ediyor','var(--blue)',1),
                ('İncelemede','var(--amber)',2),('Tamamlandı','var(--green)',3);"#,
        )?;
    }

    // --- Kullanıcılar (admin + ekip). Var olanlar korunur. ---
    let admin_role: i64 = conn
        .query_row("SELECT id FROM roles WHERE name='Yönetici'", [], |r| r.get(0))
        .unwrap_or(1);
    let member_role: i64 = conn
        .query_row("SELECT id FROM roles WHERE name='Ekip Üyesi'", [], |r| r.get(0))
        .unwrap_or(2);

    // (kullanıcı adı, e-posta, ad, ünvan, takım, telsiz, rol, şifre)
    let seed_users = [
        ("admin", "admin@proteus.app", "Ahmet Yılmaz", "Proje Yöneticisi", "Yönetim", "TLS-101", admin_role, "admin"),
        ("elif", "elif@proteus.app", "Elif Demir", "Kıdemli Geliştirici", "Yazılım", "TLS-102", member_role, "1234"),
        ("mert", "mert@proteus.app", "Mert Kaya", "UI/UX Tasarımcı", "Tasarım", "TLS-103", member_role, "1234"),
        ("zeynep", "zeynep@proteus.app", "Zeynep Aydın", "Backend Geliştirici", "Yazılım", "TLS-104", member_role, "1234"),
        ("can", "can@proteus.app", "Can Öztürk", "QA Mühendisi", "Kalite", "TLS-105", member_role, "1234"),
    ];
    for (un, em, fn_, title, team, radio, role, pass) in seed_users {
        conn.execute(
            "INSERT OR IGNORE INTO users (username,email,password_hash,full_name,title,team,radio_no,role_id,is_active) \
             VALUES (?1,?2,?8,?3,?4,?5,?6,?7,1)",
            rusqlite::params![un, em, fn_, title, team, radio, role, pass],
        )?;
    }

    // Mevcut kullanıcı id'leri (FK güvenliği için dinamik).
    let ids: Vec<i64> = {
        let mut stmt = conn.prepare("SELECT id FROM users ORDER BY id")?;
        let v = stmt.query_map([], |r| r.get(0))?.collect::<rusqlite::Result<Vec<i64>>>()?;
        v
    };
    let uid = |i: usize| ids.get(i).copied().unwrap_or(ids[0]);
    let owner = ids[0];

    // --- Projeler + panolar + üyeler + görevler ---
    if count(conn, "projects")? == 0 && !ids.is_empty() {
        let projects = [
            ("Mobil Uygulama v2", "Yeni nesil mobil istemci", "#7c3aed"),
            ("Kurumsal Web Sitesi", "Tanıtım sitesi yenileme", "#3b7fd9"),
            ("Veri Ambarı Göçü", "Eski sistemden geçiş", "#1f9d63"),
        ];
        for (name, desc, color) in projects {
            conn.execute(
                "INSERT INTO projects (name,description,created_by,color,is_active) VALUES (?1,?2,?3,?4,1)",
                rusqlite::params![name, desc, owner, color],
            )?;
            let pid = conn.last_insert_rowid();
            // Panolar
            for (n, pos) in [("Yapılacak", 0), ("Devam Ediyor", 1), ("İncelemede", 2), ("Tamamlandı", 3)] {
                conn.execute(
                    "INSERT INTO boards (project_id,name,position) VALUES (?1,?2,?3)",
                    rusqlite::params![pid, n, pos],
                )?;
            }
            // Üyeler (sahip + birkaç kişi)
            for i in 0..ids.len().min(4) {
                conn.execute(
                    "INSERT OR IGNORE INTO project_members (project_id,user_id) VALUES (?1,?2)",
                    rusqlite::params![pid, uid(i)],
                )?;
            }
        }

        // İlk projenin panolarına örnek görevler
        let first_pid: i64 = conn.query_row("SELECT id FROM projects ORDER BY id LIMIT 1", [], |r| r.get(0))?;
        let boards: Vec<i64> = {
            let mut s = conn.prepare("SELECT id FROM boards WHERE project_id=?1 ORDER BY position")?;
            let v = s.query_map([first_pid], |r| r.get(0))?.collect::<rusqlite::Result<Vec<i64>>>()?;
            v
        };
        let b = |i: usize| boards.get(i).copied().unwrap_or(boards[0]);
        let tasks = [
            (b(0), "Dark mode iyileştirmeleri", 1usize, 2i64, "low"),
            (b(0), "Raporlama modülü", 1, 13, "urgent"),
            (b(1), "API kimlik doğrulama", 3, 8, "urgent"),
            (b(1), "Push bildirim entegrasyonu", 1, 5, "normal"),
            (b(2), "Giriş ekranı tasarımı", 2, 5, "high"),
            (b(3), "Profil sayfası API", 3, 3, "normal"),
            (b(3), "Erişilebilirlik denetimi", 0, 3, "low"),
        ];
        for (bid, title, assignee_idx, credit, prio) in tasks {
            conn.execute(
                "INSERT INTO tasks (project_id,board_id,title,assignee_id,assigner_id,due_at,credit,priority) \
                 VALUES (?1,?2,?3,?4,?5,'2026-07-05',?6,?7)",
                rusqlite::params![first_pid, bid, title, uid(assignee_idx), owner, credit, prio],
            )?;
            // Birincil atananı çoklu-atama tablosuna da yaz; bazılarına ikinci kişi ekle.
            let tid = conn.last_insert_rowid();
            conn.execute(
                "INSERT OR IGNORE INTO task_assignees (task_id,user_id) VALUES (?1,?2)",
                rusqlite::params![tid, uid(assignee_idx)],
            )?;
            conn.execute(
                "INSERT OR IGNORE INTO task_assignees (task_id,user_id) VALUES (?1,?2)",
                rusqlite::params![tid, uid((assignee_idx + 1) % ids.len())],
            )?;
        }
    }

    // --- Notlar ---
    if count(conn, "notes")? == 0 {
        conn.execute(
            "INSERT INTO notes (user_id,title,body,pinned) VALUES (?1,'Sprint planlaması','Pazartesi retrospektif, Salı planlama. Kapasite: 40 puan.',1)",
            [owner],
        )?;
        conn.execute(
            "INSERT INTO notes (user_id,title,body,pinned) VALUES (?1,'Toplantı notları','Müşteri yeni raporlama ekranı istedi.',0)",
            [owner],
        )?;
    }

    // --- Bildirimler ---
    if count(conn, "notifications")? == 0 {
        for (t, b, k) in [
            ("Yeni görev atandı", "“API kimlik doğrulama” görevi size atandı", "task"),
            ("Yorum", "Elif Demir bir göreve yorum yaptı", "comment"),
            ("Proje güncellemesi", "Mobil Uygulama v2 ilerlemesi güncellendi", "project"),
        ] {
            conn.execute(
                "INSERT INTO notifications (user_id,title,body,kind,is_read) VALUES (?1,?2,?3,?4,0)",
                rusqlite::params![owner, t, b, k],
            )?;
        }
    }

    // --- Güncelleme logu (aktivite akışı) ---
    if count(conn, "updates_log")? == 0 && !ids.is_empty() {
        let acts = [
            (1usize, "tamamladı", "API kimlik doğrulama görevini tamamladı"),
            (2, "yorum", "Giriş ekranı tasarımı görevine yorum yaptı"),
            (3, "oluşturdu", "Profil sayfası API görevini oluşturdu"),
            (0, "güncelledi", "Mobil Uygulama v2 projesini güncelledi"),
        ];
        for (i, verb, summary) in acts {
            conn.execute(
                "INSERT INTO updates_log (actor_id,verb,target_type,target_id,summary) VALUES (?1,?2,'task',1,?3)",
                rusqlite::params![uid(i), verb, summary],
            )?;
        }
    }

    // --- Sohbet odaları + üyeler + mesajlar ---
    if count(conn, "chat_rooms")? == 0 && !ids.is_empty() {
        // Grup odası
        conn.execute("INSERT INTO chat_rooms (name,is_group) VALUES ('Mobil Uygulama v2',1)", [])?;
        let g1 = conn.last_insert_rowid();
        for i in 0..ids.len().min(4) {
            conn.execute("INSERT OR IGNORE INTO chat_members (room_id,user_id) VALUES (?1,?2)", rusqlite::params![g1, uid(i)])?;
        }
        conn.execute("INSERT INTO chat_rooms (name,is_group) VALUES ('Tasarım Ekibi',1)", [])?;
        let g2 = conn.last_insert_rowid();
        conn.execute("INSERT OR IGNORE INTO chat_members (room_id,user_id) VALUES (?1,?2)", rusqlite::params![g2, uid(0)])?;
        conn.execute("INSERT OR IGNORE INTO chat_members (room_id,user_id) VALUES (?1,?2)", rusqlite::params![g2, uid(2)])?;

        // Birebir oda (varsa ikinci kullanıcıyla)
        if ids.len() > 1 {
            let other_name: String = conn.query_row("SELECT full_name FROM users WHERE id=?1", [uid(1)], |r| r.get(0))?;
            conn.execute("INSERT INTO chat_rooms (name,is_group) VALUES (?1,0)", [other_name])?;
            let d1 = conn.last_insert_rowid();
            conn.execute("INSERT OR IGNORE INTO chat_members (room_id,user_id) VALUES (?1,?2)", rusqlite::params![d1, uid(0)])?;
            conn.execute("INSERT OR IGNORE INTO chat_members (room_id,user_id) VALUES (?1,?2)", rusqlite::params![d1, uid(1)])?;
        }

        // Örnek mesajlar
        for (sender_i, body) in [(1usize, "Günaydın ekip! Bugünkü plan ne?"), (2, "Giriş ekranını bitirdim."), (0, "Harika, ben API tarafına bakıyorum.")] {
            conn.execute(
                "INSERT INTO messages (room_id,sender_id,body) VALUES (?1,?2,?3)",
                rusqlite::params![g1, uid(sender_i), body],
            )?;
        }
    }

    Ok(())
}
