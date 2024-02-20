#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Local;
use serde::Serialize;
use sqlx::MySqlPool;

const DB_NAME: &str = "ariculation_prd";
const DATABASE_URL: &str = "mysql://root:arickinda@192.168.2.178";

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            add_item,
            get_items,
            update_item,
            delete_item,
            get_users,
            add_user,
            get_all_items,
            get_user_items,
            update_user,
            get_user,
            remove_joint_entries,
            get_list_types,
            add_list_type,
            check_or_create_db,
            delete_list_type,
            update_list_money,
            get_list_type
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
    is_split: bool,
    is_visible_on_user: bool,
    user_id: i32
}
#[derive(Debug)]
#[derive(Serialize)]
#[derive(sqlx::FromRow)]
struct User {
    id: i32,
    name: String,
    start_money: f32,
    ref_id: String,
    last_modified: String,
}
#[derive(Debug)]
#[derive(Serialize)]
#[derive(sqlx::FromRow)]
struct List {
    id: i32,
    name: String,
    user_id: i32,
    is_joint: bool,
    list_money: f32,
    list_password: String,
    last_modified: String
}

#[tauri::command]
async fn check_or_create_db() {
    let conn = MySqlPool::connect(DATABASE_URL).await.unwrap();
    // create db if not exists
    sqlx::query("CREATE DATABASE IF NOT EXISTS ariculation_prd")
        .execute(&conn)
        .await
        .unwrap_or_default();
    let conn = MySqlPool::connect(format!("{}/{}", DATABASE_URL, DB_NAME).as_str())
        .await
        .unwrap();
    // create tabes if not exists
    sqlx::query("CREATE TABLE tbl_items (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), category VARCHAR(255), description TEXT, price FLOAT, is_split BOOLEAN, is_joint BOOLEAN, user_id INT, last_modified VARCHAR(255), is_visible_on_user BOOLEAN, list_type INT, PRIMARY KEY (id))")
        .execute(&conn)
        .await
        .unwrap_or_default();
    sqlx::query("CREATE TABLE tbl_user (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), start_money FLOAT, ref_id varchar(255), last_modified VARCHAR(255), PRIMARY KEY (id))")
        .execute(&conn)
        .await
        .unwrap_or_default();
    sqlx::query("CREATE TABLE tbl_list (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), user_id INT, is_joint BOOLEAN, list_money FLOAT, list_password TEXT, last_modified VARCHAR(255), PRIMARY KEY (id))")
        .execute(&conn)
        .await
        .unwrap_or_default();
}

async fn get_db_connection() -> MySqlPool {
    MySqlPool::connect(format!("{}/{}", DATABASE_URL, DB_NAME).as_str()).await.unwrap()
}

#[tauri::command]
async fn add_item(name: String, description: String, price: String, category: String, is_split: bool, is_joint: bool, user_id: i32, is_visible_on_user: bool, list_type: i32) {
    let conn = get_db_connection().await;
    sqlx::query("INSERT INTO tbl_items (name, category, description, price, is_split, is_joint, user_id, last_modified, is_visible_on_user, list_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(name)
        .bind(category)
        .bind(description)
        .bind(price.parse::<f32>().unwrap())
        .bind(is_split)
        .bind(is_joint)
        .bind(user_id)
        .bind(Local::now().to_string())
        .bind(is_visible_on_user)
        .bind(list_type)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn get_items(is_split: bool, is_joint: bool, list_type: i32) -> Vec<Item> {
    let conn = get_db_connection().await;
    let items = sqlx::query_as::<_, Item>("SELECT * FROM tbl_items WHERE list_type = ? AND (is_joint = ? OR is_split = ?)")
        .bind(list_type)
        .bind(is_joint)
        .bind(is_split)
        .fetch_all(&conn)
        .await
        .unwrap();
    return items;
}

#[tauri::command]
async fn get_all_items() -> Vec<Item> {
    let conn = get_db_connection().await;
    let items = sqlx::query_as::<_, Item>("SELECT * FROM tbl_items")
        .fetch_all(&conn)
        .await
        .unwrap();
    return items;
}

#[tauri::command]
async fn update_item(id: i32, name: String, description: String, price: String, category: String, is_split: bool, user_id: i32, is_visible_on_user: bool, list_type: i32) {
    let conn = get_db_connection().await;
    sqlx::query("UPDATE tbl_items SET name = ?, category = ?, description = ?, price = ?, is_split = ?, last_modified = ?, is_visible_on_user = ?, user_id = ?, list_type = ? WHERE id = ?")
        .bind(name)
        .bind(category)
        .bind(description)
        .bind(price.parse::<f32>().unwrap())
        .bind(is_split)
        .bind(Local::now().to_string())
        .bind(is_visible_on_user)
        .bind(user_id)
        .bind(list_type)
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

#[tauri::command]
async fn get_users() -> Vec<User> {
    let conn = get_db_connection().await;
    let users = sqlx::query_as::<_, User>("SELECT * FROM tbl_user")
        .fetch_all(&conn)
        .await
        .unwrap();
    return users;
}

#[tauri::command]
async fn add_user(name: String, start_money: String, ref_id: String) {
    let conn = get_db_connection().await;
    sqlx::query("INSERT INTO tbl_user (name, start_money, last_modified, ref_id) VALUES (?, ?, ?, ?)")
        .bind(name)
        .bind(start_money.parse::<f32>().unwrap())
        .bind(Local::now().to_string())
        .bind(ref_id)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn get_user_items(user_id: i32, list_type: i32) -> Vec<Item> {
    let conn = get_db_connection().await;
    let items = sqlx::query_as::<_, Item>("SELECT * FROM tbl_items WHERE list_type = ? AND ((user_id = ? AND is_visible_on_user = true) OR (user_id = ? OR is_split = true))")
        .bind(list_type)
        .bind(user_id)
        .bind(user_id)
        .fetch_all(&conn)
        .await
        .unwrap();
    return items;
}

#[tauri::command]
async fn update_user(user_id: i32, name: String, start_money: String) {
    println!("Name: {}, Start Money: {}", &name, &start_money);
    let conn = get_db_connection().await;
    sqlx::query("UPDATE tbl_user SET name = ?, start_money = ?, last_modified = ? WHERE id = ?")
        .bind(name)
        .bind(start_money.parse::<f32>().unwrap())
        .bind(Local::now().to_string())
        .bind(user_id)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn get_user(user_id: i32) -> User {
    let conn = get_db_connection().await;
    let user = sqlx::query_as::<_, User>("SELECT * FROM tbl_user WHERE id = ?")
        .bind(user_id)
        .fetch_one(&conn)
        .await
        .unwrap();
    return user;
}

#[tauri::command]
async fn remove_joint_entries() {
    let conn = get_db_connection().await;
    sqlx::query("DELETE FROM tbl_items WHERE is_joint = true")
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn get_list_types() -> Vec<List> {
    let conn = get_db_connection().await;
    let list_types = sqlx::query_as::<_, List>("SELECT * FROM tbl_list")
        .fetch_all(&conn)
        .await
        .unwrap();
    return list_types;
}

#[tauri::command]
async fn get_list_type(id: i32) -> List {
    let conn = get_db_connection().await;
    let list_type = sqlx::query_as::<_, List>("SELECT * FROM tbl_list WHERE id = ?")
        .bind(id)
        .fetch_one(&conn)
        .await
        .unwrap();
    return list_type;
}

#[tauri::command]
async fn add_list_type(name: String, user_id: i32, is_joint: bool, list_money: String, list_password: String) {
    let conn = get_db_connection().await;
    sqlx::query("INSERT INTO tbl_list (name, user_id, is_joint, last_modified, list_money, list_password) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(name)
        .bind(user_id)
        .bind(is_joint)
        .bind(Local::now().to_string())
        .bind(list_money.parse::<f32>().unwrap())
        .bind(list_password)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn update_list_money(id: i32, list_money: String) {
    println!("List Money: {}", &list_money);
    let conn = get_db_connection().await;
    sqlx::query("UPDATE tbl_list SET list_money = ? WHERE id = ?")
        .bind(list_money.parse::<f32>().unwrap())
        .bind(id)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn delete_list_type(id: i32) {
    let conn = get_db_connection().await;
    sqlx::query("DELETE FROM tbl_list WHERE id = ?")
        .bind(id)
        .execute(&conn)
        .await
        .unwrap();
}
