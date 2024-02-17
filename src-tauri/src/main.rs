#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use chrono::Local;
use serde::Serialize;
use sqlx::MySqlPool;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            add_item,
            get_items,
            update_item,
            delete_item
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Debug)]
#[derive(Serialize)]
#[derive(sqlx::FromRow)]
struct Item {
    id: i32,
    name: String,
    category: String,
    description: String,
    price: f32,
    user: String,
    is_split: bool,
}

async fn get_db_connection() -> MySqlPool {
    MySqlPool::connect("mysql://root:arickinda@192.168.2.178/ariculation_dev").await.unwrap()
}

#[tauri::command]
async fn add_item(name: String, description: String, price: String, user: String, category: String, split: bool) {
    println!("Name: {}, Desc: {}, Price: {}, User: {}, Cat: {}, IsSplit: {}", &name, &description, &price, &user, &category, &split);
    let conn = get_db_connection().await;
    sqlx::query("INSERT INTO tbl_items (name, category, description, price, user, is_split, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(name)
        .bind(category)
        .bind(description)
        .bind(price.parse::<f32>().unwrap())
        .bind(user)
        .bind(split)
        .bind(Local::now().to_string())
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn get_items() -> Vec<Item> {
    let conn = get_db_connection().await;
    let items = sqlx::query_as::<_, Item>("SELECT * FROM tbl_items")
        .fetch_all(&conn)
        .await
        .unwrap();
    return items;
}

#[tauri::command]
async fn update_item(id: i32, name: String, description: String, price: String, user: String, category: String, split: bool) {
    let conn = get_db_connection().await;
    sqlx::query("UPDATE tbl_items SET name = ?, category = ?, description = ?, price = ?, user = ?, is_split = ?, last_modified = ? WHERE id = ?")
        .bind(name)
        .bind(category)
        .bind(description)
        .bind(price.parse::<f32>().unwrap())
        .bind(user)
        .bind(split)
        .bind(Local::now().to_string())
        .bind(id)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn delete_item(id: i32) {
    let conn = get_db_connection().await;
    sqlx::query("DELETE FROM tbl_items WHERE id = ?")
        .bind(id)
        .execute(&conn)
        .await
        .unwrap();
}
