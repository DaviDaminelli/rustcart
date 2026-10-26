use std::future::Future;
use std::pin::Pin;

use actix_web::{FromRequest, HttpRequest, dev::Payload, web};
use argon2::Argon2;
use argon2::password_hash::{PasswordHasher, PasswordVerifier, phc::PasswordHash};
use diesel::prelude::*;

use crate::db::DbPool;
use crate::error::ApiError;
use crate::schema::sessions;
use crate::with_conn;

pub fn hash_password(password: &str) -> Result<String, ApiError> {
    Argon2::default()
        .hash_password(password.as_bytes())
        .map(|h| h.to_string())
        .map_err(|e| ApiError::Internal(format!("argon2: {e}")))
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    PasswordHash::new(hash)
        .and_then(|parsed| Argon2::default().verify_password(password.as_bytes(), &parsed))
        .is_ok()
}

/// Extractor: resolve `Authorization: Bearer <token>` para o id do usuário.
/// Use como parâmetro do handler para exigir login.
pub struct AuthUser {
    pub id: i32,
    pub token: String,
}

impl FromRequest for AuthUser {
    type Error = ApiError;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let token = req
            .headers()
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .map(str::to_owned);
        let pool = req.app_data::<web::Data<DbPool>>().cloned();

        Box::pin(async move {
            let token = token.ok_or(ApiError::Unauthorized("token ausente"))?;
            let pool = pool.ok_or_else(|| ApiError::Internal("pool não configurado".into()))?;

            let lookup = token.clone();
            let user_id = with_conn(&pool, move |conn| {
                sessions::table
                    .find(&lookup)
                    .select(sessions::user_id)
                    .first::<i32>(conn)
                    .optional()
                    .map_err(ApiError::from)
            })
            .await?
            .ok_or(ApiError::Unauthorized("sessão inválida"))?;

            Ok(AuthUser { id: user_id, token })
        })
    }
}
