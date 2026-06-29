use super::CmdResult;
use crate::db::Db;
use crate::models::{ChatRoom, Message};
use rusqlite::{params, Connection};
use tauri::State;

fn room_members(conn: &Connection, room_id: i64) -> rusqlite::Result<Vec<i64>> {
    let mut stmt = conn.prepare("SELECT user_id FROM chat_members WHERE room_id=?1")?;
    let rows = stmt.query_map([room_id], |r| r.get::<_, i64>(0))?;
    rows.collect()
}

#[tauri::command]
pub fn list_rooms(db: State<Db>) -> CmdResult<Vec<ChatRoom>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id,name,is_group FROM chat_rooms ORDER BY id")?;
    let base: Vec<(i64, String, i64)> = stmt
        .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))?
        .collect::<rusqlite::Result<_>>()?;
    let mut out = Vec::new();
    for (id, name, is_group) in base {
        out.push(ChatRoom {
            id,
            name,
            is_group: is_group != 0,
            member_ids: room_members(&conn, id)?,
        });
    }
    Ok(out)
}

#[tauri::command]
pub fn list_messages(db: State<Db>, room_id: i64) -> CmdResult<Vec<Message>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id,room_id,sender_id,body,created_at FROM messages WHERE room_id=?1 ORDER BY id",
    )?;
    let rows = stmt.query_map([room_id], |r| {
        Ok(Message {
            id: r.get(0)?,
            room_id: r.get(1)?,
            sender_id: r.get(2)?,
            body: r.get(3)?,
            created_at: r.get(4)?,
        })
    })?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

#[tauri::command]
pub fn send_message(db: State<Db>, room_id: i64, body: String) -> CmdResult<Message> {
    let conn = db.0.lock().unwrap();
    // Gönderen: tek kullanıcılı yerel uygulamada aktif kullanıcı.
    let sender_id: i64 =
        conn.query_row("SELECT id FROM users WHERE is_active=1 ORDER BY id LIMIT 1", [], |r| r.get(0))?;
    conn.execute(
        "INSERT INTO messages (room_id, sender_id, body) VALUES (?1, ?2, ?3)",
        params![room_id, sender_id, body],
    )?;
    let id = conn.last_insert_rowid();
    let created_at: String =
        conn.query_row("SELECT created_at FROM messages WHERE id=?1", [id], |r| r.get(0))?;
    Ok(Message { id, room_id, sender_id, body, created_at })
}

/// Yeni sohbet odası oluştur (grup veya birebir). Oluşturan otomatik üye olur.
#[tauri::command]
pub fn create_room(db: State<Db>, name: String, is_group: bool, member_ids: Vec<i64>) -> CmdResult<i64> {
    let conn = db.0.lock().unwrap();
    let me: i64 =
        conn.query_row("SELECT id FROM users WHERE is_active=1 ORDER BY id LIMIT 1", [], |r| r.get(0))?;
    conn.execute(
        "INSERT INTO chat_rooms (name, is_group) VALUES (?1, ?2)",
        params![name, is_group as i64],
    )?;
    let room_id = conn.last_insert_rowid();
    conn.execute("INSERT OR IGNORE INTO chat_members (room_id, user_id) VALUES (?1, ?2)", params![room_id, me])?;
    for uid in member_ids {
        conn.execute(
            "INSERT OR IGNORE INTO chat_members (room_id, user_id) VALUES (?1, ?2)",
            params![room_id, uid],
        )?;
    }
    Ok(room_id)
}

/// Birebir sohbet başlatma (start_conversation) — yoksa oluşturur.
#[tauri::command]
pub fn start_conversation(db: State<Db>, other_user_id: i64) -> CmdResult<i64> {
    let conn = db.0.lock().unwrap();
    let me: i64 =
        conn.query_row("SELECT id FROM users WHERE is_active=1 ORDER BY id LIMIT 1", [], |r| r.get(0))?;
    let name: String =
        conn.query_row("SELECT full_name FROM users WHERE id=?1", [other_user_id], |r| r.get(0))?;
    conn.execute("INSERT INTO chat_rooms (name, is_group) VALUES (?1, 0)", params![name])?;
    let room_id = conn.last_insert_rowid();
    conn.execute(
        "INSERT OR IGNORE INTO chat_members (room_id, user_id) VALUES (?1, ?2), (?1, ?3)",
        params![room_id, me, other_user_id],
    )?;
    Ok(room_id)
}
