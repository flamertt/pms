// Windows'ta release derlemede konsol penceresini gizle.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    proteus_pms_lib::run()
}
