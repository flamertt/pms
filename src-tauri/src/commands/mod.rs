// Tauri komutları — frontend `api.ts` katmanının çağırdığı uç noktalar.
// Modüller Django uygulamalarıyla aynı isimde tutuldu: accounts, projects, chat.
pub mod accounts;
pub mod chat;
pub mod projects;

use serde::Serialize;

/// Komutlardan dönen tek tip hata.
#[derive(Debug, thiserror::Error)]
pub enum CmdError {
    #[error("veritabanı hatası: {0}")]
    Db(#[from] rusqlite::Error),
    #[error("{0}")]
    Msg(String),
}

// Hatanın frontend'e JSON string olarak gitmesi için.
impl Serialize for CmdError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

pub type CmdResult<T> = Result<T, CmdError>;
