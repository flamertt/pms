// Proteus — Tauri uygulama kütüphanesi.
mod commands;
mod db;
mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Veritabanını aç/seed et ve uygulama durumuna ekle.
            let database = db::init(app.handle())?;
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // accounts
            commands::accounts::login,
            commands::accounts::current_user,
            commands::accounts::logout,
            commands::accounts::list_users,
            commands::accounts::save_user,
            commands::accounts::delete_user,
            commands::accounts::set_user_avatar,
            commands::accounts::list_online_users,
            commands::accounts::set_user_permissions,
            commands::accounts::list_roles,
            commands::accounts::save_role,
            commands::accounts::delete_role,
            commands::accounts::list_notes,
            commands::accounts::save_note,
            commands::accounts::delete_note,
            commands::accounts::list_notifications,
            commands::accounts::mark_notification_read,
            // projects
            commands::projects::list_projects,
            commands::projects::save_project,
            commands::projects::delete_project,
            commands::projects::list_boards,
            commands::projects::list_statuses,
            commands::projects::list_tasks,
            commands::projects::list_updates,
            commands::projects::save_task,
            commands::projects::delete_task,
            commands::projects::update_task_board,
            // chat
            commands::chat::list_rooms,
            commands::chat::list_messages,
            commands::chat::send_message,
            commands::chat::create_room,
            commands::chat::start_conversation,
        ])
        .run(tauri::generate_context!())
        .expect("Tauri uygulaması başlatılamadı");
}
