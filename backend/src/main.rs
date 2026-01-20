use axum::{
    Router, extract::Json, routing::{get, post}, serve::Listener
};
use std::net::SocketAddr;
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Room{
    id:         u64,
    max_player: u32,
    now_player: u32,
    name:       String,
    owner:      String
}

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin (Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(root))
        .route("/rooms", get(get_room))
        .route("/rooms", post(create_room))
        .layer(cors);
    
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    println!("Hello, world!");
}

async fn root() -> &'static str {
    "Hello form Rust Backend!"
}

async fn get_room() -> Json<Vec<Room>> {
    let rooms = vec![
        Room {
            id: 1,
            name: "rust勉強会".to_string(),
            owner: "Rustacean".to_string(),
            max_player: 10,
            now_player: 0
        },
    ];

    return Json(rooms)
    // DBやる
}

#[derive(Deserialize)]
struct CreateRoomInput {
    name:       String,
    owner:      String,
    max_player: u32
}

async fn create_room(Json(payload): Json<CreateRoomInput>) -> Json<String> {
    println!("新しいルームの情報: {} max player: {} by {}", payload.name, payload.max_player, payload.owner);

    return Json("Room created successfully!!".to_string())
}