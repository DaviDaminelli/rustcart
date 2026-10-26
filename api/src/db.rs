//! Conexão com Postgres **ou** SQLite usando um único tipo (`AnyConnection`).
//!
//! O esquema da `DATABASE_URL` decide o driver:
//! - `postgres://...` / `postgresql://...` → PgConnection
//! - `sqlite://arquivo.db`, `sqlite:arquivo.db` ou um caminho → SqliteConnection

use diesel::connection::SimpleConnection;
use diesel::prelude::*;
use diesel::r2d2::{self, ManageConnection, Pool, R2D2Connection};
use diesel::{PgConnection, SqliteConnection};
use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};

/// Gera `AnyConnection` + `MultiBackend`: as queries do Diesel funcionam nos dois bancos.
#[derive(diesel::MultiConnection)]
pub enum AnyConnection {
    Postgresql(PgConnection),
    Sqlite(SqliteConnection),
}

pub type DbPool = Pool<AnyConnectionManager>;

const PG_MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations/postgres");
const SQLITE_MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations/sqlite");

/// Gerenciador de pool próprio: escolhe o driver pelo esquema da URL.
///
/// (O `establish` gerado pelo `MultiConnection` tenta cada driver em sequência e o
/// SQLite aceita qualquer string como caminho — com o Postgres fora do ar ele criaria
/// um arquivo chamado `postgres://...`. Aqui isso não acontece.)
pub struct AnyConnectionManager {
    url: String,
}

impl ManageConnection for AnyConnectionManager {
    type Connection = AnyConnection;
    type Error = r2d2::Error;

    fn connect(&self) -> Result<AnyConnection, r2d2::Error> {
        establish(&self.url).map_err(r2d2::Error::ConnectionError)
    }

    fn is_valid(&self, conn: &mut AnyConnection) -> Result<(), r2d2::Error> {
        conn.ping().map_err(r2d2::Error::QueryError)
    }

    fn has_broken(&self, conn: &mut AnyConnection) -> bool {
        conn.is_broken()
    }
}

fn establish(url: &str) -> ConnectionResult<AnyConnection> {
    if url.starts_with("postgres://") || url.starts_with("postgresql://") {
        return PgConnection::establish(url).map(AnyConnection::Postgresql);
    }

    let path = url
        .strip_prefix("sqlite://")
        .or_else(|| url.strip_prefix("sqlite:"))
        .unwrap_or(url);
    let mut conn = SqliteConnection::establish(path)?;
    conn.batch_execute(
        "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
    )
    .map_err(|e| ConnectionError::BadConnection(e.to_string()))?;
    Ok(AnyConnection::Sqlite(conn))
}

pub fn build_pool(url: &str) -> Result<DbPool, r2d2::PoolError> {
    let is_sqlite = !(url.starts_with("postgres://") || url.starts_with("postgresql://"));
    Pool::builder()
        // SQLite tem um único escritor; pool pequeno evita "database is locked".
        .max_size(if is_sqlite { 4 } else { 10 })
        .build(AnyConnectionManager { url: url.to_owned() })
}

pub fn backend_name(conn: &AnyConnection) -> &'static str {
    match conn {
        AnyConnection::Postgresql(_) => "postgres",
        AnyConnection::Sqlite(_) => "sqlite",
    }
}

/// O SQL das migrations difere entre os bancos (SERIAL × AUTOINCREMENT),
/// então cada driver roda o seu diretório.
pub fn run_migrations(
    conn: &mut AnyConnection,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    match conn {
        AnyConnection::Postgresql(c) => c.run_pending_migrations(PG_MIGRATIONS).map(drop),
        AnyConnection::Sqlite(c) => c.run_pending_migrations(SQLITE_MIGRATIONS).map(drop),
    }
}
