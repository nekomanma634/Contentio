use axum::{
    Router,
    extract::{Json, State},
    routing::{get, post},
};
use std::net::SocketAddr;
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};
use sqlx::{FromRow, SqlitePool};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Room{
    id:         i64,
    max_player: i64,
    now_player: i64,
    name:       String,
    owner:      String
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateRoomInput {
    name:       String,
    owner:      String,
    max_player: i64
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = SqlitePool::connect(&database_url)
        .await
        .expect("Failed to connect to DB");

    let cors = CorsLayer::new()
        .allow_origin (Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(root))
        .route("/rooms", get(get_room))
        .route("/rooms", post(create_room))
        .layer(cors)
        .with_state(pool);
    
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    println!("Hello, world!");
}

async fn root() -> &'static str {
    "Hello form Rust Backend!!"
}

async fn get_room(State(pool): State<SqlitePool>) -> Json<Vec<Room>> {
    let rooms = sqlx::query_as!(
        Room,
        "SELECT id, name, owner, now_player, max_player FROM rooms"
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    Json(rooms)
}

async fn create_room(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateRoomInput>) -> Json<Room> {

    let name = payload.name.clone();
    let owner = payload.owner.clone();

    let id = sqlx::query!(
        "INSERT INTO rooms (name, owner, max_player) VALUES (?, ?, ?)",
        name,
        owner,
        payload.max_player
    )
    .execute(&pool)
    .await
    .unwrap()
    .last_insert_rowid();

    let new_room = Room {
        id,
        name: payload.name,
        owner:payload.owner,
        now_player: 0,
        max_player: payload.max_player,
    };

    println!("新しいルームの情報: {} max player: {} by {}", name, payload.max_player, owner);

    return Json(new_room)
}