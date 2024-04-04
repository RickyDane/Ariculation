#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Local;
use serde::{Deserialize, Serialize};
use sqlx::{Error, MySqlPool};
use std::{
    fs::{self, create_dir, File},
    io::BufReader,
};
use tauri::api::path::config_dir;

static mut DATABASE_URL: String = String::new();
// const DB_NAME: &str = "ariculation_prd";

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
            get_list_type,
            get_userfiltered_items,
            update_app_config,
            get_app_config,
            update_user_last_list_type,
            add_shopping_list_item,
            get_shopping_list_items,
            delete_shopping_list_item
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Debug, Serialize, sqlx::FromRow)]
struct Item {
    id: i32,
    name: String,
    category: String,
    description: String,
    price: f32,
    is_split: bool,
    is_visible_on_user: bool,
    user_id: i32,
    list_type: i32,
}
#[derive(Debug, Serialize, sqlx::FromRow)]
struct User {
    id: i32,
    name: String,
    start_money: f32,
    last_list_id: i32,
    ref_id: String,
    last_modified: String,
}
#[derive(Debug, Serialize, sqlx::FromRow)]
struct List {
    id: i32,
    name: String,
    user_id: i32,
    is_joint: bool,
    list_money: f32,
    list_password: String,
    last_modified: String,
}

#[tauri::command]
async fn check_or_create_db() {
    unsafe {
        let _ = create_dir(
            config_dir()
                .unwrap()
                .join("ariculation")
                .to_str()
                .unwrap()
                .to_string(),
        );
        if fs::metadata(config_dir().unwrap().join("ariculation/app_config.json")).is_err() {
            let _ = File::create(config_dir().unwrap().join("ariculation/app_config.json"));
            let app_config_json = AppConfig {
                db_name: "ariculation_prd".to_string(),
                db_url: "dbuser:dbpassword@dbserver:dbport".to_string(),
            };
            let _ = serde_json::to_writer_pretty(
                File::create(
                    config_dir()
                        .unwrap()
                        .join("ariculation/app_config.json")
                        .to_str()
                        .unwrap()
                        .to_string(),
                )
                .unwrap(),
                &app_config_json,
            );
        }
        DATABASE_URL = get_app_config().await.db_url;
        if DATABASE_URL != "dbuser:dbpassword@dbserver:dbport" && !DATABASE_URL.is_empty() {
            let conn = MySqlPool::connect(
                format!("mysql://{}", &DATABASE_URL.split("/").nth(0).unwrap()).as_str(),
            )
            .await
            .expect("could not connect to db");
            println!(
                "\nSearching for database: {}",
                &DATABASE_URL.split("/").last().unwrap()
            );
            println!("Database URL: {}", DATABASE_URL.split("/").nth(0).unwrap());
            println!(
                "Database name: {}\n",
                DATABASE_URL.split("/").last().unwrap()
            );
            // create db if not exists
            sqlx::query(
                format!(
                    "{} {}",
                    "CREATE DATABASE IF NOT EXISTS",
                    DATABASE_URL.split("/").last().unwrap()
                )
                .as_str(),
            )
            .execute(&conn)
            .await
            .unwrap_or_default();
            let conn = MySqlPool::connect(format!("mysql://{}", &DATABASE_URL).as_str())
                .await
                .unwrap();
            // create tables if not exists
            sqlx::query("CREATE TABLE tbl_items (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), category VARCHAR(255), description TEXT, price FLOAT, is_split BOOLEAN, is_joint BOOLEAN, user_id INT, last_modified VARCHAR(255), is_visible_on_user BOOLEAN, visible_on_user_list BOOLEAN, list_type INT, PRIMARY KEY (id))")
                .execute(&conn)
                .await
                .unwrap_or_default();
            sqlx::query("CREATE TABLE tbl_user (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), start_money FLOAT, ref_id varchar(255), last_list_id INT, last_modified VARCHAR(255), PRIMARY KEY (id))")
                .execute(&conn)
                .await
                .unwrap_or_default();
            sqlx::query("CREATE TABLE tbl_list (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), user_id INT, is_joint BOOLEAN, list_money FLOAT, list_password TEXT, last_modified VARCHAR(255), PRIMARY KEY (id))")
                .execute(&conn)
                .await
                .unwrap_or_default();
            sqlx::query("CREATE TABLE tbl_shopping_list (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), price FLOAT, is_keep_item BOOLEAN, is_active BOOLEAN, PRIMARY KEY (id))")
                .execute(&conn)
                .await
                .unwrap_or_default();
            println!("Database created successfully");
        }
    }
}

async fn get_db_connection() -> Result<MySqlPool, Error> {
    unsafe {
        Ok(
            MySqlPool::connect(format!("mysql://{}", DATABASE_URL).as_str())
                .await
                .expect("Could not connect to database"),
        )
    }
}

#[tauri::command]
async fn add_item(
    name: String,
    description: String,
    price: String,
    category: String,
    is_split: bool,
    is_joint: bool,
    user_id: i32,
    is_visible_on_user: bool,
    list_type: i32,
    visible_on_user_list: i32,
) {
    let conn = get_db_connection().await.unwrap();
    sqlx::query("INSERT INTO tbl_items (name, category, description, price, is_split, is_joint, user_id, last_modified, is_visible_on_user, list_type, visible_on_user_list) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
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
        .bind(visible_on_user_list)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn get_items(is_split: bool, is_joint: bool, list_type: i32) -> Vec<Item> {
    let conn = get_db_connection().await.unwrap();
    let items = sqlx::query_as::<_, Item>(
        "SELECT * FROM tbl_items WHERE list_type = ? AND (is_joint = ? OR is_split = ?)",
    )
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
    let conn = get_db_connection().await.unwrap();
    let items = sqlx::query_as::<_, Item>("SELECT * FROM tbl_items")
        .fetch_all(&conn)
        .await
        .unwrap();
    return items;
}

#[tauri::command]
async fn update_item(
    id: i32,
    name: String,
    description: String,
    price: String,
    category: String,
    is_split: bool,
    user_id: i32,
    is_visible_on_user: bool,
    visible_on_user_list: i32,
    list_type: i32,
) {
    let conn = get_db_connection().await.unwrap();
    sqlx::query("UPDATE tbl_items SET name = ?, category = ?, description = ?, price = ?, is_split = ?, last_modified = ?, is_visible_on_user = ?, visible_on_user_list = ?, user_id = ?, list_type = ? WHERE id = ?")
        .bind(name)
        .bind(category)
        .bind(description)
        .bind(price.parse::<f32>().unwrap())
        .bind(is_split)
        .bind(Local::now().to_string())
        .bind(is_visible_on_user)
        .bind(visible_on_user_list)
        .bind(user_id)
        .bind(list_type)
        .bind(id)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn delete_item(id: i32) {
    let conn = get_db_connection().await.unwrap();
    sqlx::query("DELETE FROM tbl_items WHERE id = ?")
        .bind(id)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn get_users() -> Vec<User> {
    let conn = get_db_connection().await.unwrap();
    let users = sqlx::query_as::<_, User>("SELECT * FROM tbl_user")
        .fetch_all(&conn)
        .await
        .unwrap();
    return users;
}

#[tauri::command]
async fn add_user(name: String, start_money: String, ref_id: String, last_list_id: i32) {
    let conn = get_db_connection().await.unwrap();
    sqlx::query(
        "INSERT INTO tbl_user (name, start_money, last_modified, ref_id, last_list_id) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(name)
    .bind(start_money.parse::<f32>().unwrap())
    .bind(Local::now().to_string())
    .bind(ref_id)
    .bind(last_list_id)
    .execute(&conn)
    .await
    .unwrap();
}

#[tauri::command]
async fn get_user_items(user_id: i32, list_type: i32) -> Vec<Item> {
    let conn = get_db_connection().await.unwrap();
    let items = sqlx::query_as::<_, Item>("SELECT * FROM tbl_items WHERE list_type = ? OR visible_on_user_list = ? AND (is_visible_on_user = true OR is_split = true) AND user_id = ?")
        .bind(list_type)
        .bind(list_type)
        .bind(user_id)
        .fetch_all(&conn)
        .await
        .unwrap();
    return items;
}

#[tauri::command]
async fn update_user(user_id: i32, name: String, start_money: String) {
    println!("Name: {}, Start Money: {}", &name, &start_money);
    let conn = get_db_connection().await.unwrap();
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
async fn update_user_last_list_type(user_id: i32, list_type: i32) {
    let conn = get_db_connection().await.unwrap();
    sqlx::query("UPDATE tbl_user SET last_list_id = ? WHERE id = ?")
        .bind(list_type)
        .bind(user_id)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn get_user(user_id: i32) -> User {
    let conn = get_db_connection().await.unwrap();
    let user = sqlx::query_as::<_, User>("SELECT * FROM tbl_user WHERE id = ?")
        .bind(user_id)
        .fetch_one(&conn)
        .await
        .unwrap();
    return user;
}

#[tauri::command]
async fn remove_joint_entries() {
    let conn = get_db_connection().await.unwrap();
    sqlx::query("DELETE FROM tbl_items WHERE is_joint = true")
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn get_list_types() -> Vec<List> {
    let conn = get_db_connection().await.unwrap();
    let list_types = sqlx::query_as::<_, List>("SELECT * FROM tbl_list")
        .fetch_all(&conn)
        .await
        .unwrap();
    return list_types;
}

#[tauri::command]
async fn get_list_type(id: i32) -> List {
    let conn = get_db_connection().await.unwrap();
    let list_type = sqlx::query_as::<_, List>("SELECT * FROM tbl_list WHERE id = ?")
        .bind(id)
        .fetch_one(&conn)
        .await
        .unwrap();
    return list_type;
}

#[tauri::command]
async fn add_list_type(
    name: String,
    user_id: i32,
    is_joint: bool,
    list_money: String,
    list_password: String,
) {
    let conn = get_db_connection().await.unwrap();
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
    let conn = get_db_connection().await.unwrap();
    sqlx::query("UPDATE tbl_list SET list_money = ? WHERE id = ?")
        .bind(list_money.parse::<f32>().unwrap())
        .bind(id)
        .execute(&conn)
        .await
        .unwrap();
}

#[tauri::command]
async fn delete_list_type(id: i32) {
    let conn = get_db_connection().await.unwrap();
    sqlx::query("DELETE FROM tbl_list WHERE id = ?")
        .bind(id)
        .execute(&conn)
        .await
        .unwrap();
    sqlx::query("DELETE FROM tbl_items WHERE list_type = ?")
        .bind(id)
        .execute(&conn)
        .await
        .unwrap();
    println!("List Type {} Deleted", id);
}

#[tauri::command]
async fn get_userfiltered_items(user_id: i32, list_type: i32, is_all_items: bool) -> Vec<Item> {
    let conn = get_db_connection().await.unwrap();
    if is_all_items && user_id != 0 {
        let items = sqlx::query_as::<_, Item>("SELECT * FROM tbl_items WHERE user_id = ?")
            .bind(user_id)
            .fetch_all(&conn)
            .await
            .unwrap();
        return items;
    } else if is_all_items && user_id == 0 {
        let items = sqlx::query_as::<_, Item>("SELECT * FROM tbl_items")
            .fetch_all(&conn)
            .await
            .unwrap();
        return items;
    } else if user_id == 0 {
        let items = sqlx::query_as::<_, Item>("SELECT * FROM tbl_items WHERE list_type = ?")
            .bind(list_type)
            .fetch_all(&conn)
            .await
            .unwrap();
        return items;
    } else {
        let items = sqlx::query_as::<_, Item>(
            "SELECT * FROM tbl_items WHERE list_type = ? AND user_id = ?",
        )
        .bind(list_type)
        .bind(user_id)
        .fetch_all(&conn)
        .await
        .unwrap();
        return items;
    }
}

#[tauri::command]
async fn add_shopping_list_item(name: String, price: f32) {
    let conn = get_db_connection().await.unwrap();
    sqlx::query("INSERT INTO tbl_shopping_list (name, price) VALUES (?, ?)")
        .bind(&name)
        .bind(price)
        .execute(&conn)
        .await
        .unwrap();
    println!("Added Shopping List Item: {}", name);
}

#[derive(sqlx::FromRow, serde::Serialize, serde::Deserialize, Debug)]
struct ShoppingListItem {
    id: Option<i32>,
    name: Option<String>,
    price: Option<f32>,
    is_keep_item: Option<bool>,
    is_active: Option<bool>,
}

#[tauri::command]
async fn get_shopping_list_items() -> Vec<ShoppingListItem> {
    let conn = get_db_connection().await.unwrap();
    let items = sqlx::query_as::<_, ShoppingListItem>("SELECT * FROM tbl_shopping_list")
        .fetch_all(&conn)
        .await
        .unwrap();
    return items;
}

#[tauri::command]
async fn delete_shopping_list_item(id: i32) {
    let conn = get_db_connection().await.unwrap();
    sqlx::query("DELETE FROM tbl_shopping_list WHERE id = ?")
        .bind(id)
        .execute(&conn)
        .await
        .unwrap();
}

#[derive(Debug, Deserialize, Serialize)]
struct AppConfig {
    db_name: String,
    db_url: String,
}

#[tauri::command]
async fn update_app_config(db_url: String) {
    let app_config = AppConfig {
        db_url: db_url.clone(),
        db_name: "".into(),
    };
    let app_config_json = serde_json::to_value(&app_config).unwrap();
    let file = File::create(
        config_dir()
            .expect("could not get config dir")
            .join("ariculation/app_config.json"),
    )
    .unwrap();
    let _ = serde_json::to_writer_pretty(file, &app_config_json);
    println!("appconfig: {:?}", app_config);
    println!(
        "appconfig location: {}",
        config_dir()
            .expect("could not get config dir")
            .join("ariculation/app_config.json")
            .to_str()
            .unwrap()
    );
    check_or_create_db().await;
}

#[tauri::command]
async fn get_app_config() -> AppConfig {
    let file = File::open(
        config_dir()
            .expect("could not get config dir")
            .join("ariculation/app_config.json"),
    )
    .unwrap();
    let reader = BufReader::new(file);
    let app_config = serde_json::from_reader(reader).unwrap();
    return app_config;
}
