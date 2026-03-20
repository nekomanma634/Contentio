use axum::{extract::{Path, State}, http::StatusCode, Json};
use bcrypt::{hash, verify, DEFAULT_COST};
use std::{collections::HashMap, process::Stdio, sync::Arc};
use tokio::{fs, io::AsyncWriteExt, process::Command, time::{timeout, Duration}};

use crate::{AppState, models::*};

pub async fn login_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AuthRequest>,
) -> Result<Json<User>, StatusCode> {
    let password_input = payload.password.unwrap_or_default();

    let user_row = sqlx::query_as::<_, UserRow>(
        "SELECT id, username, rating, password_hash, avatar_url, is_admin FROM users WHERE username = ?"
    )
    .bind(&payload.username)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("🚨 ログイン時のDBエラー: {:?}", e); 
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match user_row {
        Some(row) => {
            if verify(&password_input, &row.password_hash).unwrap_or(false) {

                log_action(&state.db, &row.username, "LOGIN", "Logged into the system").await;
                
                Ok(Json(User {
                    id: row.id,
                    username: row.username,
                    rating: row.rating,
                    avatar_url: row.avatar_url,
                    is_admin: row.is_admin,
                }))
            } else {
                Err(StatusCode::UNAUTHORIZED)
            }
        }
        None => Err(StatusCode::UNAUTHORIZED),
    }
}

pub async fn register_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AuthRequest>,
) -> Result<Json<User>, StatusCode> {
    if payload.username.trim().is_empty() { return Err(StatusCode::BAD_REQUEST); }
    let password_input = payload.password.unwrap_or_default();
    if password_input.is_empty() { return Err(StatusCode::BAD_REQUEST); }

    let hashed_password = hash(&password_input, DEFAULT_COST).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let is_admin_flag = if payload.username == "admin" { 1 } else { 0 };

    let result = sqlx::query_as::<_, User>(
        "INSERT INTO users (username, password_hash, rating, is_admin) VALUES (?, ?, 0, ?) RETURNING id, username, rating, avatar_url, is_admin"
    )
    .bind(&payload.username).bind(&hashed_password).bind(is_admin_flag)
    .fetch_one(&state.db).await;

    match result {
        Ok(user) => Ok(Json(user)),
        Err(sqlx::Error::Database(db_err)) if db_err.is_unique_violation() => Err(StatusCode::CONFLICT),
        Err(e) => {
            eprintln!("🚨 登録時のDBエラー: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn update_avatar_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AvatarUpdateRequest>,
) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query("UPDATE users SET avatar_url = ? WHERE username = ?")
        .bind(&payload.avatar_base64).bind(&payload.username)
        .execute(&state.db).await;
    match result {
        Ok(_) => Ok(StatusCode::OK),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn get_user_handler(
    State(state): State<Arc<AppState>>,
    Path(target_username): Path<String>,
) -> Result<Json<User>, StatusCode> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, rating, avatar_url, is_admin FROM users WHERE username = ?"
    )
    .bind(&target_username).fetch_optional(&state.db).await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match user {
        Some(user_data) => Ok(Json(user_data)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn get_contests_handler(State(state): State<Arc<AppState>>) -> Result<Json<Vec<Contest>>, StatusCode> {
    let contests = sqlx::query_as::<_, Contest>("SELECT id, title, start_time, duration_minutes FROM contests ORDER BY start_time DESC")
        .fetch_all(&state.db).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(contests))
}

pub async fn create_task_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateTaskRequest>,
) -> Result<StatusCode, StatusCode> {
    if payload.title.trim().is_empty() || payload.markdown.trim().is_empty() || payload.task_label.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    let time_limit: f64 = payload.time_limit.parse().map_err(|_| StatusCode::BAD_REQUEST)?;
    let memory_limit: i64 = payload.memory_limit.parse().map_err(|_| StatusCode::BAD_REQUEST)?;

    let mut tx = state.db.begin().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let insert_task_result = sqlx::query("INSERT INTO tasks (title, time_limit, memory_limit, markdown_content) VALUES (?, ?, ?, ?)")
        .bind(&payload.title).bind(time_limit).bind(memory_limit).bind(&payload.markdown)
        .execute(&mut *tx).await;

    let task_id = match insert_task_result {
        Ok(res) => res.last_insert_rowid(),
        Err(_) => { let _ = tx.rollback().await; return Err(StatusCode::INTERNAL_SERVER_ERROR); }
    };

    let insert_link_result = sqlx::query("INSERT INTO contest_tasks (contest_id, task_id, task_label) VALUES (?, ?, ?)")
        .bind(&payload.contest_id).bind(task_id).bind(&payload.task_label)
        .execute(&mut *tx).await;

    if insert_link_result.is_err() {
        let _ = tx.rollback().await;
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }
    tx.commit().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::CREATED)
}

pub async fn get_contest_tasks_handler(
    State(state): State<Arc<AppState>>,
    Path(contest_id): Path<String>,
) -> Result<Json<Vec<ContestTaskSummary>>, StatusCode> {
    let tasks = sqlx::query_as::<_, ContestTaskSummary>(
        "SELECT t.id, ct.task_label as label, t.title, t.time_limit, t.memory_limit FROM contest_tasks ct JOIN tasks t ON ct.task_id = t.id WHERE ct.contest_id = ? ORDER BY ct.task_label ASC"
    ).bind(&contest_id).fetch_all(&state.db).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(tasks))
}

pub async fn get_task_handler(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<i64>,
) -> Result<Json<TaskDetail>, StatusCode> {
    let task = sqlx::query_as::<_, TaskDetail>(
        "SELECT id, title, time_limit, memory_limit, markdown_content FROM tasks WHERE id = ?"
    ).bind(task_id).fetch_optional(&state.db).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    match task {
        Some(t) => Ok(Json(t)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn create_contest_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateContestRequest>,
) -> Result<StatusCode, StatusCode> {
    if payload.id.trim().is_empty() || payload.title.trim().is_empty() { return Err(StatusCode::BAD_REQUEST); }
    let start_time = payload.start_time.replace("T", " ") + ":00";

    let result = sqlx::query("INSERT INTO contests (id, title, start_time, duration_minutes) VALUES (?, ?, ?, ?)")
        .bind(&payload.id).bind(&payload.title).bind(&start_time).bind(payload.duration_minutes)
        .execute(&state.db).await;

    match result {
        Ok(_) => Ok(StatusCode::CREATED),
        Err(sqlx::Error::Database(db_err)) if db_err.is_unique_violation() => Err(StatusCode::CONFLICT),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

pub async fn update_task_handler(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<i64>,
    Json(payload): Json<UpdateTaskRequest>,
) -> Result<StatusCode, StatusCode> {
    if payload.title.trim().is_empty() || payload.markdown.trim().is_empty() { return Err(StatusCode::BAD_REQUEST); }
    let time_limit: f64 = payload.time_limit.parse().map_err(|_| StatusCode::BAD_REQUEST)?;
    let memory_limit: i64 = payload.memory_limit.parse().map_err(|_| StatusCode::BAD_REQUEST)?;

    let result = sqlx::query("UPDATE tasks SET title = ?, time_limit = ?, memory_limit = ?, markdown_content = ? WHERE id = ?")
        .bind(&payload.title).bind(time_limit).bind(memory_limit).bind(&payload.markdown).bind(task_id)
        .execute(&state.db).await;
    match result { Ok(_) => Ok(StatusCode::OK), Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR) }
}

pub async fn submit_code_handler(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SubmitRequest>,
) -> Result<Json<SubmitResponse>, StatusCode> {
    let insert_result = sqlx::query("INSERT INTO submissions (task_id, username, language, code, status) VALUES (?, ?, ?, ?, 'WJ')")
        .bind(payload.task_id).bind(&payload.username).bind(&payload.language).bind(&payload.code)
        .execute(&state.db).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let submission_id = insert_result.last_insert_rowid();

    log_action(&state.db, &payload.username, "SUBMIT", &format!("Task ID: {}, Lang: {}", payload.task_id, payload.language)).await;

    let testcases = sqlx::query_as::<_, TestCase>("SELECT input_data, expected_output FROM testcases WHERE task_id = ?")
        .bind(payload.task_id).fetch_all(&state.db).await.unwrap_or_default();

    if testcases.is_empty() { return Ok(Json(SubmitResponse { status: "IE".to_string(), message: "No testcases".to_string() })); }
    if payload.language != "cpp" { return Ok(Json(SubmitResponse { status: "IE".to_string(), message: "Only C++ supported".to_string() })); }

    let src_file = format!("temp_{}.cpp", submission_id);
    let exe_file = format!("temp_{}.exe", submission_id);

    fs::write(&src_file, &payload.code).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let compile_status = Command::new("g++").args(&[&src_file, "-o", &exe_file, "-O2"]).status().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !compile_status.success() {
        let _ = fs::remove_file(&src_file).await;
        update_submission_status(&state.db, submission_id, "CE").await;
        return Ok(Json(SubmitResponse { status: "CE".to_string(), message: "Compilation Error".to_string() }));
    }

    let mut final_status = "AC";
    for tc in testcases {
        let mut child = Command::new(format!("./{}", exe_file)).stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped()).kill_on_drop(true).spawn().expect("Failed to spawn process");
        if let Some(mut stdin) = child.stdin.take() { let _ = stdin.write_all(tc.input_data.as_bytes()).await; }

        match timeout(Duration::from_secs(2), child.wait_with_output()).await {
            Ok(Ok(output)) => {
                let stdout_str = String::from_utf8_lossy(&output.stdout).replace("\r\n", "\n").trim().to_string();
                let expected_str = tc.expected_output.replace("\\n", "\n").replace("\r\n", "\n").trim().to_string();
                if stdout_str != expected_str { final_status = "WA"; break; }
            }
            Ok(Err(_)) => { final_status = "RE"; break; }
            Err(_) => { final_status = "TLE"; break; }
        }
    }

    let _ = fs::remove_file(&src_file).await;
    let _ = fs::remove_file(&exe_file).await;
    update_submission_status(&state.db, submission_id, final_status).await;

    Ok(Json(SubmitResponse { status: final_status.to_string(), message: format!("判定完了: {}", final_status) }))
}

async fn update_submission_status(db: &sqlx::SqlitePool, id: i64, status: &str) {
    let _ = sqlx::query("UPDATE submissions SET status = ? WHERE id = ?").bind(status).bind(id).execute(db).await;
}

pub async fn get_submissions_handler(
    State(state): State<Arc<AppState>>,
    Path(contest_id): Path<String>,
) -> Result<Json<Vec<SubmissionSummary>>, StatusCode> {
    let subs = sqlx::query_as::<_, SubmissionSummary>(
        "SELECT s.id, s.created_at, ct.task_label, t.title as task_title, s.username, s.language, s.status FROM submissions s JOIN contest_tasks ct ON s.task_id = ct.task_id JOIN tasks t ON s.task_id = t.id WHERE ct.contest_id = ? ORDER BY s.id DESC LIMIT 100"
    ).bind(&contest_id).fetch_all(&state.db).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(subs))
}

pub async fn get_testcases_handler(State(state): State<Arc<AppState>>, Path(task_id): Path<i64>) -> Result<Json<Vec<TestCaseResponse>>, StatusCode> {
    let tcs = sqlx::query_as::<_, TestCaseResponse>("SELECT id, input_data, expected_output FROM testcases WHERE task_id = ?")
        .bind(task_id).fetch_all(&state.db).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(tcs))
}

pub async fn create_testcase_handler(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<i64>,
    Json(payload): Json<CreateTestCaseRequest>,
) -> Result<StatusCode, StatusCode> {
    if payload.expected_output.trim().is_empty() { return Err(StatusCode::BAD_REQUEST); }
    let input_data = payload.input_data.replace("\r\n", "\n");
    let expected_output = payload.expected_output.replace("\r\n", "\n");

    let result = sqlx::query("INSERT INTO testcases (task_id, input_data, expected_output) VALUES (?, ?, ?)")
        .bind(task_id).bind(input_data).bind(expected_output).execute(&state.db).await;
    match result { Ok(_) => Ok(StatusCode::CREATED), Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR) }
}

pub async fn delete_testcase_handler(State(state): State<Arc<AppState>>, Path(testcase_id): Path<i64>) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query("DELETE FROM testcases WHERE id = ?").bind(testcase_id).execute(&state.db).await;
    match result { Ok(_) => Ok(StatusCode::OK), Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR) }
}

pub async fn get_ranking_handler(State(state): State<Arc<AppState>>) -> Result<Json<Vec<UserRanking>>, StatusCode> {
    let ranking = sqlx::query_as::<_, UserRanking>("SELECT username, rating, avatar_url FROM users ORDER BY rating DESC LIMIT 100")
        .fetch_all(&state.db).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(ranking))
}

pub async fn get_standings_handler(
    State(state): State<Arc<AppState>>,
    Path(contest_id): Path<String>,
) -> Result<Json<StandingsResponse>, StatusCode> {
    let tasks = sqlx::query_as::<_, StandingsTask>("SELECT t.id, ct.task_label as label FROM contest_tasks ct JOIN tasks t ON ct.task_id = t.id WHERE ct.contest_id = ? ORDER BY ct.task_label ASC")
        .bind(&contest_id).fetch_all(&state.db).await.unwrap_or_default();
    let subs = sqlx::query_as::<_, SubRow>("SELECT s.task_id, s.username, s.status FROM submissions s JOIN contest_tasks ct ON s.task_id = ct.task_id WHERE ct.contest_id = ? ORDER BY s.id ASC")
        .bind(&contest_id).fetch_all(&state.db).await.unwrap_or_default();

    let mut user_map: HashMap<String, (i32, i32, HashMap<i64, TaskResult>)> = HashMap::new();
    for sub in subs {
        let user_data = user_map.entry(sub.username.clone()).or_insert_with(|| (0, 0, HashMap::new()));
        let tr = user_data.2.entry(sub.task_id).or_insert(TaskResult::default());
        if tr.is_ac { continue; }
        if sub.status == "AC" {
            tr.is_ac = true;
            user_data.0 += 1;
            user_data.1 += tr.penalty;
        } else if sub.status != "CE" && sub.status != "WJ" {
            tr.penalty += 1;
        }
    }

    let mut rows: Vec<UserStandings> = user_map.into_iter().map(|(username, (total_ac, total_penalty, results))| {
        let mut string_results = HashMap::new();
        for (k, v) in results { string_results.insert(k.to_string(), v); }
        UserStandings { rank: 0, username, total_ac, total_penalty, task_results: string_results }
    }).collect();

    rows.sort_by(|a, b| if a.total_ac != b.total_ac { b.total_ac.cmp(&a.total_ac) } else { a.total_penalty.cmp(&b.total_penalty) });

    let mut current_rank = 1;
    for i in 0..rows.len() {
        if i > 0 && rows[i-1].total_ac == rows[i].total_ac && rows[i-1].total_penalty == rows[i].total_penalty {
            rows[i].rank = current_rank;
        } else {
            current_rank = (i + 1) as i32;
            rows[i].rank = current_rank;
        }
    }
    Ok(Json(StandingsResponse { tasks, rows }))
}

pub async fn get_contest_handler(
    State(state): State<Arc<AppState>>,
    Path(contest_id): Path<String>,
) -> Result<Json<ContestInfo>, StatusCode> {
    let contest = sqlx::query_as::<_, ContestInfo>(
        "SELECT id, title, start_time, duration_minutes, is_rated, description FROM contests WHERE id = ?"
    )
    .bind(contest_id).fetch_optional(&state.db).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    match contest { Some(c) => Ok(Json(c)), None => Err(StatusCode::NOT_FOUND) }
}

pub async fn update_ratings_handler(
    State(state): State<Arc<AppState>>,
    Path(contest_id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let is_rated: i64 = sqlx::query_scalar("SELECT is_rated FROM contests WHERE id = ?")
        .bind(&contest_id).fetch_one(&state.db).await.map_err(|_| StatusCode::NOT_FOUND)?;
    if is_rated == 1 { return Err(StatusCode::BAD_REQUEST); }

    let subs = sqlx::query_as::<_, SubRow>("SELECT s.task_id, s.username, s.status FROM submissions s JOIN contest_tasks ct ON s.task_id = ct.task_id WHERE ct.contest_id = ? ORDER BY s.id ASC")
        .bind(&contest_id).fetch_all(&state.db).await.unwrap_or_default();

    let mut user_map: HashMap<String, (i32, i32, HashMap<i64, TaskResult>)> = HashMap::new();
    for sub in subs {
        let user_data = user_map.entry(sub.username.clone()).or_insert_with(|| (0, 0, HashMap::new()));
        let tr = user_data.2.entry(sub.task_id).or_insert(TaskResult::default());
        if tr.is_ac { continue; }
        if sub.status == "AC" {
            tr.is_ac = true;
            user_data.0 += 1;
            user_data.1 += tr.penalty;
        } else if sub.status != "CE" && sub.status != "WJ" {
            tr.penalty += 1;
        }
    }

    let mut participants: Vec<(String, i32, i32)> = user_map.into_iter().map(|(u, (ac, p, _))| (u, ac, p)).collect();
    if participants.is_empty() {
        let _ = sqlx::query("UPDATE contests SET is_rated = 1 WHERE id = ?").bind(&contest_id).execute(&state.db).await;
        return Ok(StatusCode::OK);
    }

    participants.sort_by(|a, b| if a.1 != b.1 { b.1.cmp(&a.1) } else { a.2.cmp(&b.2) });
    let total_participants = participants.len() as i64;
    let mut tx = state.db.begin().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let mut current_rank = 1;

    for i in 0..participants.len() {
        if i > 0 && participants[i-1].1 == participants[i].1 && participants[i-1].2 == participants[i].2 {
        } else { current_rank = (i + 1) as i64; }

        let change = (total_participants - current_rank) * 20 - (current_rank - 1) * 20;
        let _ = sqlx::query("UPDATE users SET rating = MAX(0, rating + ?) WHERE username = ?")
            .bind(change).bind(&participants[i].0).execute(&mut *tx).await;
    }

    let _ = sqlx::query("UPDATE contests SET is_rated = 1 WHERE id = ?").bind(&contest_id).execute(&mut *tx).await;
    tx.commit().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    log_action(&state.db, "admin", "RATE_CALC", &format!("Calculated ratings for contest {}", contest_id)).await;

    Ok(StatusCode::OK)
}

async fn log_action(db: &sqlx::SqlitePool, username: &str, action: &str, details: &str) {
    let _ = sqlx::query("INSERT INTO system_logs (username, action, details) VALUES (?, ?, ?)")
        .bind(username).bind(action).bind(details)
        .execute(db).await;
}

pub async fn get_system_logs_handler(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<SystemLog>>, StatusCode> {
    // 最新のログを200件取得
    let logs = sqlx::query_as::<_, SystemLog>(
        "SELECT id, username, action, details, created_at FROM system_logs ORDER BY id DESC LIMIT 200"
    )
    .fetch_all(&state.db).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(logs))
}

// 新規追加: コンテスト説明文の更新 (Admin専用)
pub async fn update_contest_description_handler(
    State(state): State<Arc<AppState>>,
    Path(contest_id): Path<String>,
    Json(payload): Json<UpdateContestDescriptionRequest>, 
) -> Result<StatusCode, StatusCode> {
    
    sqlx::query("UPDATE contests SET description = ? WHERE id = ?")
        .bind(&payload.description).bind(&contest_id)
        .execute(&state.db).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}