use actix_web::{HttpResponse, web};
use diesel::prelude::*;

use crate::auth::{AuthUser, verify_password};
use crate::db::DbPool;
use crate::error::ApiError;
use crate::models::{LoginRequest, LoginResponse, NewSession, User};
use crate::schema::{sessions, users};
use crate::with_conn;

/// POST /api/auth/login
pub async fn login(
    pool: web::Data<DbPool>,
    body: web::Json<LoginRequest>,
) -> Result<web::Json<LoginResponse>, ApiError> {
    let LoginRequest { email, password } = body.into_inner();

    let res = with_conn(&pool, move |conn| {
        let user = users::table
            .filter(users::email.eq(email.trim().to_lowercase()))
            .select(User::as_select())
            .first(conn)
            .optional()?;

        // Mesma mensagem para e-mail inexistente e senha errada.
        let user = user
            .filter(|u| verify_password(&password, &u.password_hash))
            .ok_or(ApiError::Unauthorized("E-mail ou senha inválidos"))?;

        let token = uuid::Uuid::new_v4().to_string();
        diesel::insert_into(sessions::table)
            .values(NewSession { token: &token, user_id: user.id })
            .execute(conn)?;

        Ok(LoginResponse { token, user: user.into() })
    })
    .await?;

    Ok(web::Json(res))
}

/// POST /api/auth/logout
pub async fn logout(pool: web::Data<DbPool>, user: AuthUser) -> Result<HttpResponse, ApiError> {
    with_conn(&pool, move |conn| {
        diesel::delete(sessions::table.find(user.token)).execute(conn)?;
        Ok(())
    })
    .await?;
    Ok(HttpResponse::NoContent().finish())
}
