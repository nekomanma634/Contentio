pub mod models;
pub mod handlers;

use axum::{
    http::Method,
    routing::{delete, get, post, put},
    Router,
};
use dotenvy::dotenv;
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    SqlitePool,
};
use std::{env, str::FromStr, sync::Arc};
use tower_http::cors::{Any, CorsLayer};

use crate::handlers::*;

// 共有ステートの定義
pub struct AppState {
    pub db: SqlitePool,
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    let db_url = env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:localcoder.db".to_string());

    let connection_options = SqliteConnectOptions::from_str(&db_url)
        .expect("DB URL Error")
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connection_options)
        .await
        .expect("DB Connect Error");

    let shared_state = Arc::new(AppState { db: pool });

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5173".parse::<axum::http::HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PUT])
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/login", post(login_handler))
        .route("/api/register", post(register_handler))
        .route("/api/user/avatar", put(update_avatar_handler))
        .route("/api/users/:username", get(get_user_handler))
        .route("/api/contests", get(get_contests_handler))
        .route("/api/admin/contests", post(create_contest_handler))
        .route("/api/admin/tasks", post(create_task_handler))
        .route("/api/contests/:contest_id/tasks", get(get_contest_tasks_handler)) 
        .route("/api/tasks/:task_id", get(get_task_handler))
        .route("/api/admin/tasks/:task_id", put(update_task_handler))
        .route("/api/submissions", post(submit_code_handler))
        .route("/api/contests/:contest_id/submissions", get(get_submissions_handler))
        .route("/api/admin/tasks/:task_id/testcases", get(get_testcases_handler))
        .route("/api/admin/tasks/:task_id/testcases", post(create_testcase_handler))
        .route("/api/admin/testcases/:testcase_id", delete(delete_testcase_handler))
        .route("/api/ranking", get(get_ranking_handler))
        .route("/api/contests/:contest_id/standings", get(get_standings_handler))
        .route("/api/contests/:contest_id", get(get_contest_handler))
        .route("/api/admin/contests/:contest_id/rate", post(update_ratings_handler))
        .route("/api/admin/logs", get(get_system_logs_handler))
        .route("/api/admin/contests/:contest_id/description", put(update_contest_description_handler))
        .layer(cors)
        .with_state(shared_state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("🚀 サーバー起動: http://127.0.0.1:3000");
    axum::serve(listener, app).await.unwrap();
}