// Frontend (src/lib/types.ts) ile birebir eşleşen serileştirilebilir modeller.
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub full_name: String,
    pub identity_no: Option<String>,
    pub phone: Option<String>,
    pub radio_no: Option<String>,
    pub team: Option<String>,
    pub avatar_url: Option<String>,
    pub title: Option<String>,
    pub is_active: bool,
    pub enable_2fa: bool,
    pub two_factor_method: Option<String>,
    pub role_id: Option<i64>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Role {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub permissions: Vec<String>,
    pub user_count: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub created_by: i64,
    pub is_active: bool,
    pub color: Option<String>,
    pub member_ids: Vec<i64>,
    pub progress: i64,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Board {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub position: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TaskStatus {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub position: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: i64,
    pub project_id: i64,
    pub board_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub assignee_id: Option<i64>,
    pub assigner_id: Option<i64>,
    pub start_at: Option<String>,
    pub due_at: Option<String>,
    pub credit: i64,
    pub position: i64,
    pub priority: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ChatRoom {
    pub id: i64,
    pub name: String,
    pub is_group: bool,
    pub member_ids: Vec<i64>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Message {
    pub id: i64,
    pub room_id: i64,
    pub sender_id: i64,
    pub body: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: i64,
    pub user_id: i64,
    pub title: String,
    pub body: String,
    pub pinned: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ActivityItem {
    pub id: i64,
    pub actor_id: i64,
    pub actor_name: String,
    pub verb: String,
    pub summary: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NotificationItem {
    pub id: i64,
    pub user_id: i64,
    pub title: String,
    pub body: String,
    pub kind: String,
    pub is_read: bool,
    pub target_type: Option<String>,
    pub target_id: Option<i64>,
    pub created_at: String,
}
