mod auth;
mod db;
mod error;
mod models;
mod routes;
mod schema;
mod seed;

use actix_cors::Cors;
use actix_web::{App, HttpServer, middleware::Logger, web};

use crate::db::{AnyConnection, DbPool};
use crate::error::ApiError;

/// Roda uma closure síncrona do Diesel numa thread de bloqueio do Actix.
pub async fn with_conn<T, F>(pool: &DbPool, f: F) -> Result<T, ApiError>
where
    F: FnOnce(&mut AnyConnection) -> Result<T, ApiError> + Send + 'static,
    T: Send + 'static,
{
    let pool = pool.clone();
    web::block(move || {
        let mut conn = pool.get()?;
        f(&mut conn)
    })
    .await?
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://rustcart.db".into());
    let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:8080".into());
    let cors_origins: Vec<String> = std::env::var("CORS_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:8000,http://localhost:5173".into())
        .split(',')
        .map(|s| s.trim().to_owned())
        .filter(|s| !s.is_empty())
        .collect();

    let pool = db::build_pool(&database_url).map_err(std::io::Error::other)?;
    {
        let mut conn = pool.get().map_err(std::io::Error::other)?;
        log::info!("banco: {}", db::backend_name(&conn));
        db::run_migrations(&mut conn).map_err(std::io::Error::other)?;
        seed::run(&mut conn).map_err(|e| std::io::Error::other(format!("seed: {e:?}")))?;
    }

    log::info!("API ouvindo em http://{bind_addr}/api");
    let pool = web::Data::new(pool);

    HttpServer::new(move || {
        let cors = cors_origins
            .iter()
            .fold(Cors::default(), |cors, origin| cors.allowed_origin(origin))
            .allowed_methods(["GET", "POST", "PATCH", "DELETE"])
            .allowed_headers(["Authorization", "Content-Type"])
            .max_age(3600);

        App::new()
            .app_data(pool.clone())
            .app_data(web::JsonConfig::default().error_handler(|err, _| {
                ApiError::BadRequest(format!("JSON inválido: {err}")).into()
            }))
            .wrap(cors)
            .wrap(Logger::default())
            .configure(routes::config)
    })
    .bind(bind_addr)?
    .run()
    .await
}
