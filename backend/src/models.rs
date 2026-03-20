use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::collections::HashMap;

#[derive(Serialize, FromRow)]
pub struct ContestInfo {
    pub id: String,
    pub title: String,
    pub start_time: String,
    pub duration_minutes: i64,
    pub is_rated: bool,
    pub description: String,
}

#[derive(Serialize, FromRow)]
pub struct StandingsTask {
    pub id: i64,
    pub label: String,
}

#[derive(Serialize, Clone, Default)]
pub struct TaskResult {
    pub is_ac: bool,
    pub penalty: i32,
}

#[derive(Serialize)]
pub struct UserStandings {
    pub rank: i32,
    pub username: String,
    pub total_ac: i32,
    pub total_penalty: i32,
    pub task_results: HashMap<String, TaskResult>,
}

#[derive(Serialize)]
pub struct StandingsResponse {
    pub tasks: Vec<StandingsTask>,
    pub rows: Vec<UserStandings>,
}

#[derive(FromRow)]
pub struct SubRow {
    pub task_id: i64,
    pub username: String,
    pub status: String,
}

#[derive(Serialize, FromRow)]
pub struct UserRanking {
    pub username: String,
    pub rating: i64,
    pub avatar_url: Option<String>,
}

#[derive(Serialize, FromRow)]
pub struct TestCaseResponse {
    pub id: i64,
    pub input_data: String,
    pub expected_output: String,
}

#[derive(Deserialize)]
pub struct CreateTestCaseRequest {
    pub input_data: String,
    pub expected_output: String,
}

#[derive(Serialize, FromRow)]
pub struct SubmissionSummary {
    pub id: i64,
    pub created_at: String,
    pub task_label: String,
    pub task_title: String,
    pub username: String,
    pub language: String,
    pub status: String,
}

#[derive(Deserialize)]
pub struct SubmitRequest {
    pub username: String,
    pub task_id: i64,
    pub language: String,
    pub code: String,
}

#[derive(Serialize)]
pub struct SubmitResponse {
    pub status: String,
    pub message: String,
}

#[derive(FromRow)]
pub struct TestCase {
    pub input_data: String,
    pub expected_output: String,
}

#[derive(Serialize, FromRow)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub rating: i64,
    pub avatar_url: Option<String>,
    pub is_admin: bool,
}

#[derive(Deserialize)]
pub struct CreateTaskRequest {
    pub contest_id: String,
    pub task_label: String,
    pub title: String,
    pub time_limit: String,
    pub memory_limit: String,
    pub markdown: String,
}

#[derive(Serialize, FromRow)]
pub struct ContestTaskSummary {
    pub id: i64,
    pub label: String,
    pub title: String,
    pub time_limit: f64,
    pub memory_limit: i64,
}

#[derive(Serialize, FromRow)]
pub struct Contest {
    pub id: String,
    pub title: String,
    pub start_time: String,
    pub duration_minutes: i64,
}

#[derive(FromRow)]
pub struct UserRow {
    pub id: i64,
    pub username: String,
    pub rating: i64,
    pub password_hash: String,
    pub avatar_url: Option<String>,
    pub is_admin: bool,
}

#[derive(Serialize, FromRow)]
pub struct TaskDetail {
    pub id: i64,
    pub title: String,
    pub time_limit: f64,
    pub memory_limit: i64,
    pub markdown_content: String,
}

#[derive(Deserialize)]
pub struct AuthRequest {
    pub username: String,
    pub password: Option<String>, 
}

#[derive(Deserialize)]
pub struct AvatarUpdateRequest {
    pub username: String,
    pub avatar_base64: String,
}

#[derive(Deserialize)]
pub struct CreateContestRequest {
    pub id: String,
    pub title: String,
    pub start_time: String,
    pub duration_minutes: i64,
}

#[derive(Deserialize)]
pub struct UpdateTaskRequest {
    pub title: String,
    pub time_limit: String,
    pub memory_limit: String,
    pub markdown: String,
}

#[derive(Serialize, FromRow)]
pub struct SystemLog {
    pub id: i64,
    pub username: String,
    pub action: String,
    pub details: String,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct UpdateContestDescriptionRequest {
    pub description: String,
}