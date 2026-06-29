use super::{CmdResult, CmdError};
use crate::db::Db;
use crate::models::{NotificationItem, Note, Role, User};
use rusqlite::{params, Connection};
use tauri::State;

fn row_to_user(row: &rusqlite::Row) -> rusqlite::Result<User> {
    Ok(User {
        id: row.get("id")?,
        username: row.get("username")?,
        email: row.get("email")?,
        full_name: row.get("full_name")?,
        identity_no: row.get("identity_no")?,
        phone: row.get("phone")?,
        radio_no: row.get("radio_no")?,
        team: row.get("team")?,
        avatar_url: row.get("avatar_url")?,
        title: row.get("title")?,
        is_active: row.get::<_, i64>("is_active")? != 0,
        enable_2fa: row.get::<_, i64>("enable_2fa")? != 0,
        two_factor_method: row.get("two_factor_method")?,
        role_id: row.get("role_id")?,
    })
}

const USER_COLS: &str = "id,username,email,full_name,identity_no,phone,radio_no,team,\
    avatar_url,title,is_active,enable_2fa,two_factor_method,role_id";

#[tauri::command]
pub fn login(db: State<Db>, username: String, password: String) -> CmdResult<User> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(&format!(
        "SELECT {USER_COLS} FROM users WHERE (username=?1 OR email=?1) AND password_hash=?2 AND is_active=1"
    ))?;
    let user = stmt
        .query_row(params![username, password], row_to_user)
        .map_err(|_| CmdError::Msg("Kullanıcı adı veya şifre hatalı".into()))?;
    Ok(user)
}

#[tauri::command]
pub fn current_user(db: State<Db>) -> CmdResult<Option<User>> {
    // Yerel uygulamada ilk aktif kullanıcı oturum sahibidir (tek kullanıcı).
    let conn = db.0.lock().unwrap();
    let mut stmt =
        conn.prepare(&format!("SELECT {USER_COLS} FROM users WHERE is_active=1 ORDER BY id LIMIT 1"))?;
    let user = stmt.query_row([], row_to_user).ok();
    Ok(user)
}

#[tauri::command]
pub fn logout() -> CmdResult<()> {
    Ok(())
}

#[tauri::command]
pub fn list_users(db: State<Db>) -> CmdResult<Vec<User>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(&format!("SELECT {USER_COLS} FROM users ORDER BY full_name"))?;
    let rows = stmt.query_map([], row_to_user)?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

fn role_permissions(conn: &Connection, role_id: i64) -> rusqlite::Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT permission FROM role_permissions WHERE role_id=?1")?;
    let rows = stmt.query_map([role_id], |r| r.get::<_, String>(0))?;
    rows.collect()
}

#[tauri::command]
pub fn list_roles(db: State<Db>) -> CmdResult<Vec<Role>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id,name,description FROM roles ORDER BY id")?;
    let base: Vec<(i64, String, Option<String>)> = stmt
        .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))?
        .collect::<rusqlite::Result<_>>()?;

    let mut out = Vec::new();
    for (id, name, description) in base {
        let permissions = role_permissions(&conn, id)?;
        let user_count: i64 =
            conn.query_row("SELECT COUNT(*) FROM users WHERE role_id=?1", [id], |r| r.get(0))?;
        out.push(Role { id, name, description, permissions, user_count });
    }
    Ok(out)
}

#[tauri::command]
pub fn save_role(
    db: State<Db>,
    id: Option<i64>,
    name: String,
    description: Option<String>,
    permissions: Vec<String>,
) -> CmdResult<i64> {
    let conn = db.0.lock().unwrap();
    let role_id = match id {
        Some(rid) => {
            conn.execute(
                "UPDATE roles SET name=?1, description=?2 WHERE id=?3",
                params![name, description, rid],
            )?;
            rid
        }
        None => {
            conn.execute(
                "INSERT INTO roles (name, description) VALUES (?1, ?2)",
                params![name, description],
            )?;
            conn.last_insert_rowid()
        }
    };
    conn.execute("DELETE FROM role_permissions WHERE role_id=?1", [role_id])?;
    for p in permissions {
        conn.execute(
            "INSERT INTO role_permissions (role_id, permission) VALUES (?1, ?2)",
            params![role_id, p],
        )?;
    }
    Ok(role_id)
}

#[tauri::command]
pub fn delete_role(db: State<Db>, id: i64) -> CmdResult<()> {
    db.0.lock().unwrap().execute("DELETE FROM roles WHERE id=?1", [id])?;
    Ok(())
}

/// Kullanıcı ekle/düzenle (manage_users). id verilmezse yeni kayıt.
#[tauri::command]
pub fn save_user(
    db: State<Db>,
    id: Option<i64>,
    username: String,
    email: String,
    full_name: String,
    title: Option<String>,
    team: Option<String>,
    phone: Option<String>,
    radio_no: Option<String>,
    role_id: Option<i64>,
    enable_2fa: bool,
) -> CmdResult<i64> {
    let conn = db.0.lock().unwrap();
    match id {
        Some(uid) => {
            conn.execute(
                "UPDATE users SET username=?1,email=?2,full_name=?3,title=?4,team=?5,\
                 phone=?6,radio_no=?7,role_id=?8,enable_2fa=?9 WHERE id=?10",
                params![username, email, full_name, title, team, phone, radio_no, role_id, enable_2fa as i64, uid],
            )?;
            Ok(uid)
        }
        None => {
            conn.execute(
                "INSERT INTO users (username,email,password_hash,full_name,title,team,phone,radio_no,role_id,enable_2fa,is_active) \
                 VALUES (?1,?2,'changeme',?3,?4,?5,?6,?7,?8,?9,1)",
                params![username, email, full_name, title, team, phone, radio_no, role_id, enable_2fa as i64],
            )?;
            Ok(conn.last_insert_rowid())
        }
    }
}

#[tauri::command]
pub fn delete_user(db: State<Db>, id: i64) -> CmdResult<()> {
    db.0.lock().unwrap().execute("DELETE FROM users WHERE id=?1", [id])?;
    Ok(())
}

/// Profil fotoğrafını DB'ye yazar (data-url veya dosya yolu). null ise kaldırır.
#[tauri::command]
pub fn set_user_avatar(db: State<Db>, user_id: i64, avatar_url: Option<String>) -> CmdResult<()> {
    db.0.lock().unwrap().execute(
        "UPDATE users SET avatar_url=?1 WHERE id=?2",
        params![avatar_url, user_id],
    )?;
    Ok(())
}

/// Çevrimiçi kullanıcı listesi (get_online_user_list).
/// Yerel uygulamada deterministik bir alt küme döndürülür.
#[tauri::command]
pub fn list_online_users(db: State<Db>) -> CmdResult<Vec<i64>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id FROM users WHERE is_active=1 AND (id % 3 != 0) ORDER BY id")?;
    let rows = stmt.query_map([], |r| r.get::<_, i64>(0))?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

/// Kullanıcıya özel izinler (special_permissions) — edit_user_permissions.
#[tauri::command]
pub fn set_user_permissions(db: State<Db>, user_id: i64, permissions: Vec<String>) -> CmdResult<()> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM user_permissions WHERE user_id=?1", [user_id])?;
    for p in permissions {
        conn.execute(
            "INSERT INTO user_permissions (user_id, permission) VALUES (?1, ?2)",
            params![user_id, p],
        )?;
    }
    Ok(())
}

/// Not oluştur/güncelle (Note CRUD).
#[tauri::command]
pub fn save_note(
    db: State<Db>,
    id: Option<i64>,
    title: String,
    body: String,
    pinned: bool,
) -> CmdResult<i64> {
    let conn = db.0.lock().unwrap();
    match id {
        Some(nid) => {
            conn.execute(
                "UPDATE notes SET title=?1, body=?2, pinned=?3, updated_at=datetime('now') WHERE id=?4",
                params![title, body, pinned as i64, nid],
            )?;
            Ok(nid)
        }
        None => {
            let uid: i64 = conn
                .query_row("SELECT id FROM users WHERE is_active=1 ORDER BY id LIMIT 1", [], |r| r.get(0))?;
            conn.execute(
                "INSERT INTO notes (user_id,title,body,pinned) VALUES (?1,?2,?3,?4)",
                params![uid, title, body, pinned as i64],
            )?;
            Ok(conn.last_insert_rowid())
        }
    }
}

#[tauri::command]
pub fn delete_note(db: State<Db>, id: i64) -> CmdResult<()> {
    db.0.lock().unwrap().execute("DELETE FROM notes WHERE id=?1", [id])?;
    Ok(())
}

#[tauri::command]
pub fn list_notes(db: State<Db>) -> CmdResult<Vec<Note>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id,user_id,title,body,pinned,created_at,updated_at FROM notes ORDER BY pinned DESC, updated_at DESC",
    )?;
    let rows = stmt.query_map([], |r| {
        Ok(Note {
            id: r.get(0)?,
            user_id: r.get(1)?,
            title: r.get(2)?,
            body: r.get(3)?,
            pinned: r.get::<_, i64>(4)? != 0,
            created_at: r.get(5)?,
            updated_at: r.get(6)?,
        })
    })?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

#[tauri::command]
pub fn list_notifications(db: State<Db>) -> CmdResult<Vec<NotificationItem>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id,user_id,title,body,kind,is_read,target_type,target_id,created_at \
         FROM notifications ORDER BY created_at DESC",
    )?;
    let rows = stmt.query_map([], |r| {
        Ok(NotificationItem {
            id: r.get(0)?,
            user_id: r.get(1)?,
            title: r.get(2)?,
            body: r.get(3)?,
            kind: r.get(4)?,
            is_read: r.get::<_, i64>(5)? != 0,
            target_type: r.get(6)?,
            target_id: r.get(7)?,
            created_at: r.get(8)?,
        })
    })?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

#[tauri::command]
pub fn mark_notification_read(db: State<Db>, id: i64) -> CmdResult<()> {
    db.0.lock()
        .unwrap()
        .execute("UPDATE notifications SET is_read=1 WHERE id=?1", [id])?;
    Ok(())
}
