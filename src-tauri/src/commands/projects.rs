use super::CmdResult;
use crate::db::Db;
use crate::models::{ActivityItem, Board, Project, Task, TaskStatus};
use rusqlite::{params, Connection};
use tauri::State;

/// Güncelleme logu (UpdatesLog) — son aktiviteler, aktör adıyla.
#[tauri::command]
pub fn list_updates(db: State<Db>) -> CmdResult<Vec<ActivityItem>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT u.id, u.actor_id, COALESCE(usr.full_name,'—'), u.verb, u.summary, u.created_at \
         FROM updates_log u LEFT JOIN users usr ON usr.id = u.actor_id \
         ORDER BY u.created_at DESC, u.id DESC LIMIT 12",
    )?;
    let rows = stmt.query_map([], |r| {
        Ok(ActivityItem {
            id: r.get(0)?,
            actor_id: r.get(1)?,
            actor_name: r.get(2)?,
            verb: r.get(3)?,
            summary: r.get(4)?,
            created_at: r.get(5)?,
        })
    })?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

fn member_ids(conn: &Connection, project_id: i64) -> rusqlite::Result<Vec<i64>> {
    let mut stmt = conn.prepare("SELECT user_id FROM project_members WHERE project_id=?1")?;
    let rows = stmt.query_map([project_id], |r| r.get::<_, i64>(0))?;
    rows.collect()
}

/// Basit ilerleme: tamamlanan görev / toplam görev (yüzde).
fn progress(conn: &Connection, project_id: i64) -> rusqlite::Result<i64> {
    let total: i64 =
        conn.query_row("SELECT COUNT(*) FROM tasks WHERE project_id=?1", [project_id], |r| r.get(0))?;
    if total == 0 {
        return Ok(0);
    }
    // 'Tamamlandı' durumundaki panolar position=3 kabul edilir.
    let done: i64 = conn.query_row(
        "SELECT COUNT(*) FROM tasks t JOIN boards b ON b.id=t.board_id \
         WHERE t.project_id=?1 AND b.position=3",
        [project_id],
        |r| r.get(0),
    )?;
    Ok(done * 100 / total)
}

#[tauri::command]
pub fn list_projects(db: State<Db>) -> CmdResult<Vec<Project>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id,name,description,created_by,is_active,color,created_at FROM projects ORDER BY id")?;
    let base: Vec<(i64, String, Option<String>, i64, i64, Option<String>, String)> = stmt
        .query_map([], |r| {
            Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?, r.get(6)?))
        })?
        .collect::<rusqlite::Result<_>>()?;

    let mut out = Vec::new();
    for (id, name, description, created_by, is_active, color, created_at) in base {
        out.push(Project {
            id,
            name,
            description,
            created_by,
            is_active: is_active != 0,
            color,
            member_ids: member_ids(&conn, id)?,
            progress: progress(&conn, id)?,
            created_at,
        });
    }
    Ok(out)
}

#[tauri::command]
pub fn list_boards(db: State<Db>, project_id: i64) -> CmdResult<Vec<Board>> {
    let conn = db.0.lock().unwrap();
    let mut stmt =
        conn.prepare("SELECT id,project_id,name,position FROM boards WHERE project_id=?1 ORDER BY position")?;
    let rows = stmt.query_map([project_id], |r| {
        Ok(Board { id: r.get(0)?, project_id: r.get(1)?, name: r.get(2)?, position: r.get(3)? })
    })?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

#[tauri::command]
pub fn list_statuses(db: State<Db>) -> CmdResult<Vec<TaskStatus>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id,name,color,position FROM task_statuses ORDER BY position")?;
    let rows = stmt.query_map([], |r| {
        Ok(TaskStatus { id: r.get(0)?, name: r.get(1)?, color: r.get(2)?, position: r.get(3)? })
    })?;
    Ok(rows.collect::<rusqlite::Result<_>>()?)
}

/// Bir görevin atanan kişileri (tam liste).
fn task_assignees(conn: &Connection, task_id: i64) -> rusqlite::Result<Vec<i64>> {
    let mut stmt =
        conn.prepare("SELECT user_id FROM task_assignees WHERE task_id=?1 ORDER BY user_id")?;
    let rows = stmt.query_map([task_id], |r| r.get::<_, i64>(0))?;
    rows.collect()
}

fn row_to_task(r: &rusqlite::Row) -> rusqlite::Result<Task> {
    Ok(Task {
        id: r.get(0)?,
        project_id: r.get(1)?,
        board_id: r.get(2)?,
        title: r.get(3)?,
        description: r.get(4)?,
        assignee_id: r.get(5)?,
        assignee_ids: Vec::new(), // list_tasks içinde doldurulur
        assigner_id: r.get(6)?,
        start_at: r.get(7)?,
        due_at: r.get(8)?,
        credit: r.get(9)?,
        position: r.get(10)?,
        priority: r.get(11)?,
    })
}

#[tauri::command]
pub fn list_tasks(db: State<Db>, project_id: Option<i64>) -> CmdResult<Vec<Task>> {
    let conn = db.0.lock().unwrap();
    let sql = "SELECT id,project_id,board_id,title,description,assignee_id,assigner_id,\
        start_at,due_at,credit,position,priority FROM tasks";
    let mut tasks = match project_id {
        Some(pid) => {
            let mut stmt = conn.prepare(&format!("{sql} WHERE project_id=?1 ORDER BY position"))?;
            let rows = stmt.query_map([pid], row_to_task)?;
            rows.collect::<rusqlite::Result<Vec<_>>>()?
        }
        None => {
            let mut stmt = conn.prepare(&format!("{sql} ORDER BY position"))?;
            let rows = stmt.query_map([], row_to_task)?;
            rows.collect::<rusqlite::Result<Vec<_>>>()?
        }
    };
    // Her görevin atanan listesini doldur. Liste boşsa (eski kayıt) birincil
    // assignee_id'ye düşeriz, böylece veri göçü gerekmez.
    for t in tasks.iter_mut() {
        let mut ids = task_assignees(&conn, t.id)?;
        if ids.is_empty() {
            if let Some(a) = t.assignee_id {
                ids.push(a);
            }
        }
        t.assignee_ids = ids;
    }
    Ok(tasks)
}

/// Sürükle-bırak ile görev pano değiştirme.
#[tauri::command]
pub fn update_task_board(db: State<Db>, task_id: i64, board_id: i64, position: i64) -> CmdResult<()> {
    db.0.lock().unwrap().execute(
        "UPDATE tasks SET board_id=?1, position=?2 WHERE id=?3",
        params![board_id, position, task_id],
    )?;
    Ok(())
}

/// Proje oluştur/güncelle. Yeni proje için varsayılan panolar (durumlar) açılır.
#[tauri::command]
pub fn save_project(
    db: State<Db>,
    id: Option<i64>,
    name: String,
    description: Option<String>,
    color: Option<String>,
    member_ids: Vec<i64>,
) -> CmdResult<i64> {
    let conn = db.0.lock().unwrap();
    let pid = match id {
        Some(pid) => {
            conn.execute(
                "UPDATE projects SET name=?1, description=?2, color=?3 WHERE id=?4",
                params![name, description, color, pid],
            )?;
            pid
        }
        None => {
            let owner: i64 = conn
                .query_row("SELECT id FROM users WHERE is_active=1 ORDER BY id LIMIT 1", [], |r| r.get(0))?;
            conn.execute(
                "INSERT INTO projects (name,description,created_by,color,is_active) VALUES (?1,?2,?3,?4,1)",
                params![name, description, owner, color],
            )?;
            let pid = conn.last_insert_rowid();
            // Durumlardan panoları üret.
            let mut stmt = conn.prepare("SELECT name, position FROM task_statuses ORDER BY position")?;
            let statuses: Vec<(String, i64)> = stmt
                .query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?
                .collect::<rusqlite::Result<_>>()?;
            for (sname, pos) in statuses {
                conn.execute(
                    "INSERT INTO boards (project_id, name, position) VALUES (?1, ?2, ?3)",
                    params![pid, sname, pos],
                )?;
            }
            pid
        }
    };
    // Üyeleri eşitle.
    conn.execute("DELETE FROM project_members WHERE project_id=?1", [pid])?;
    for uid in member_ids {
        conn.execute(
            "INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?1, ?2)",
            params![pid, uid],
        )?;
    }
    Ok(pid)
}

#[tauri::command]
pub fn delete_project(db: State<Db>, id: i64) -> CmdResult<()> {
    db.0.lock().unwrap().execute("DELETE FROM projects WHERE id=?1", [id])?;
    Ok(())
}

/// Görev oluştur/güncelle.
#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn save_task(
    db: State<Db>,
    id: Option<i64>,
    project_id: i64,
    board_id: i64,
    title: String,
    description: Option<String>,
    assignee_ids: Vec<i64>,
    due_at: Option<String>,
    credit: i64,
    priority: String,
) -> CmdResult<i64> {
    let conn = db.0.lock().unwrap();
    let assigner: i64 =
        conn.query_row("SELECT id FROM users WHERE is_active=1 ORDER BY id LIMIT 1", [], |r| r.get(0))?;
    // Birincil atanan = listenin ilki (geri uyumluluk: ilerleme, bildirim vb.).
    let primary: Option<i64> = assignee_ids.first().copied();
    let tid = match id {
        Some(tid) => {
            conn.execute(
                "UPDATE tasks SET board_id=?1,title=?2,description=?3,assignee_id=?4,due_at=?5,credit=?6,priority=?7 WHERE id=?8",
                params![board_id, title, description, primary, due_at, credit, priority, tid],
            )?;
            tid
        }
        None => {
            conn.execute(
                "INSERT INTO tasks (project_id,board_id,title,description,assignee_id,assigner_id,due_at,credit,priority) \
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
                params![project_id, board_id, title, description, primary, assigner, due_at, credit, priority],
            )?;
            conn.last_insert_rowid()
        }
    };
    // Atanan listesini eşitle.
    conn.execute("DELETE FROM task_assignees WHERE task_id=?1", [tid])?;
    for uid in &assignee_ids {
        conn.execute(
            "INSERT OR IGNORE INTO task_assignees (task_id, user_id) VALUES (?1, ?2)",
            params![tid, uid],
        )?;
    }
    Ok(tid)
}

#[tauri::command]
pub fn delete_task(db: State<Db>, id: i64) -> CmdResult<()> {
    db.0.lock().unwrap().execute("DELETE FROM tasks WHERE id=?1", [id])?;
    Ok(())
}
