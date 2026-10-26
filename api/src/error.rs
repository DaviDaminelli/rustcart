use actix_web::{HttpResponse, ResponseError, http::StatusCode};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("{0}")]
    BadRequest(String),
    #[error("{0}")]
    Unauthorized(&'static str),
    #[error("{0}")]
    NotFound(&'static str),
    #[error("erro interno")]
    Internal(String),
}

impl ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        match self {
            Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        if let Self::Internal(detail) = self {
            log::error!("{detail}");
        }
        HttpResponse::build(self.status_code()).json(json!({ "error": self.to_string() }))
    }
}

impl From<diesel::result::Error> for ApiError {
    fn from(e: diesel::result::Error) -> Self {
        match e {
            diesel::result::Error::NotFound => Self::NotFound("registro não encontrado"),
            other => Self::Internal(other.to_string()),
        }
    }
}

impl From<diesel::r2d2::PoolError> for ApiError {
    fn from(e: diesel::r2d2::PoolError) -> Self {
        Self::Internal(format!("pool: {e}"))
    }
}

impl From<actix_web::error::BlockingError> for ApiError {
    fn from(e: actix_web::error::BlockingError) -> Self {
        Self::Internal(e.to_string())
    }
}
