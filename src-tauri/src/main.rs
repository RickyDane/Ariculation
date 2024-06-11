#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Local;
use serde::{Deserialize, Serialize};
use sqlx::{Error, MySqlPool};
use std::{
    fs::{self, create_dir, File},
    io::BufReader,
};
use tauri::api::path::config_dir;

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
    time_added: String,
    last_modified: String
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
                db_host: "localhost".to_string(),
                db_user: "root".to_string(),
                db_name: "ariculation_prd".to_string(),
                db_password: "dbpassword".to_string(),
                db_port: "3306".to_string(),
                is_use_ssl: false,
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
        let app_config = get_app_config().await;
        if app_config.db_name != String::from("dbname") && !app_config.db_name.is_empty() {
            let conn = get_db_connection()
                .await
                .expect("Could not connect to database");
            // create db if not exists
            sqlx::query(
                format!("{} {}", "CREATE DATABASE IF NOT EXISTS", app_config.db_name).as_str(),
            )
            .execute(&conn)
            .await
            .unwrap_or_default();
            let conn = get_db_connection().await.unwrap();
            // create tables if not exists
            sqlx::query("CREATE TABLE tbl_items (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), category VARCHAR(255), description TEXT, price FLOAT, is_split BOOLEAN, is_joint BOOLEAN, user_id INT, last_modified VARCHAR(255), time_added VARCHAR(255), is_visible_on_user BOOLEAN, visible_on_user_list BOOLEAN, list_type INT, PRIMARY KEY (id))")
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

fn cert_file() -> String {
    fs::read_to_string(config_dir().unwrap().join("ariculation/user1-cert.pem")).unwrap()
}
fn key_file() -> String {
    fs::read_to_string(config_dir().unwrap().join("ariculation/user1-key.pem")).unwrap()
}

async fn get_db_connection() -> Result<MySqlPool, Error> {
    let app_config = get_app_config().await;
    let user = app_config.db_user;
    let password = app_config.db_password;
    let host = app_config.db_host;
    let port = app_config.db_port;
    let db_name = app_config.db_name;
    let is_use_ssl = app_config.is_use_ssl;

    let options = sqlx::mysql::MySqlConnectOptions::new()
        .username(&user)
        .password(&password)
        .host(&host)
        .port(port.parse::<u16>().unwrap())
        .database(&db_name);

    if is_use_ssl {
        let options = options
            .ssl_mode(sqlx::mysql::MySqlSslMode::Required)
            .ssl_ca_from_pem(vec![])
            .ssl_client_cert_from_pem(cert_file().as_bytes())
            .ssl_client_key_from_pem(key_file().as_bytes());
        Ok(MySqlPool::connect_with(options)
            .await
            .expect("Could not connect to database with ssl"))
    } else {
        Ok(MySqlPool::connect_with(options)
            .await
            .expect("Could not connect to database"))
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
    sqlx::query("INSERT INTO tbl_items (name, category, description, price, is_split, is_joint, user_id, last_modified, time_added, is_visible_on_user, list_type, visible_on_user_list) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(name)
        .bind(category)
        .bind(description) 
        .bind(price.parse::<f32>().unwrap())
        .bind(is_split)
        .bind(is_joint)
        .bind(user_id)
        .bind(Local::now().to_string())
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
    db_host: String,
    db_name: String,
    db_user: String,
    db_password: String,
    db_port: String,
    is_use_ssl: bool,
}

#[tauri::command]
async fn update_app_config(app_config: AppConfig) {
    // get current app_config and create new
    let mut new_app_config = get_app_config().await;
    new_app_config.db_user = app_config.db_user;
    new_app_config.db_host = app_config.db_host;
    new_app_config.db_name = app_config.db_name;
    new_app_config.db_password = app_config.db_password;
    new_app_config.db_port = app_config.db_port;
    new_app_config.is_use_ssl = app_config.is_use_ssl;

    let app_config_json = serde_json::to_string(&new_app_config).unwrap();
    let file = File::create(
        config_dir()
            .expect("could not get config dir")
            .join("ariculation/app_config.json"),
    )
    .unwrap();
    let _ = serde_json::to_writer_pretty(file, &app_config_json);
    println!("appconfig: {:?}", new_app_config);
    println!(
        "appconfig location: {}",
        config_dir()
            .expect("could not get config dir")
            .join("ariculation/app_config.json")
            .to_str()
            .unwrap()
    );
    // check_or_create_db().await;
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
