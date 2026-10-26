use actix_web::web;
use diesel::prelude::*;

use crate::db::DbPool;
use crate::error::ApiError;
use crate::models::Product;
use crate::schema::products;
use crate::with_conn;

/// GET /api/products — catálogo é público (não exige login).
pub async fn list(pool: web::Data<DbPool>) -> Result<web::Json<Vec<Product>>, ApiError> {
    let items = with_conn(&pool, |conn| {
        products::table
            .order(products::id)
            .select(Product::as_select())
            .load(conn)
            .map_err(ApiError::from)
    })
    .await?;

    Ok(web::Json(items))
}
