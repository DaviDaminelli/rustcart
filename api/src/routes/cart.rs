//! Carrinho do usuário logado. Toda mutação devolve o carrinho completo,
//! assim o frontend só substitui o estado.

use actix_web::web;
use diesel::prelude::*;

use crate::auth::AuthUser;
use crate::db::{AnyConnection, DbPool};
use crate::error::ApiError;
use crate::models::{AddItemRequest, CartDto, CartItemDto, NewCartItem, Product, UpdateItemRequest};
use crate::schema::{cart_items, products};
use crate::with_conn;

type CartResult = Result<web::Json<CartDto>, ApiError>;

/// GET /api/cart
pub async fn get(pool: web::Data<DbPool>, user: AuthUser) -> CartResult {
    let cart = with_conn(&pool, move |conn| load_cart(conn, user.id)).await?;
    Ok(web::Json(cart))
}

/// POST /api/cart/items  { product_id, quantity? }
pub async fn add_item(
    pool: web::Data<DbPool>,
    user: AuthUser,
    body: web::Json<AddItemRequest>,
) -> CartResult {
    let AddItemRequest { product_id, quantity } = body.into_inner();
    if quantity <= 0 {
        return Err(ApiError::BadRequest("quantidade deve ser maior que zero".into()));
    }

    let cart = with_conn(&pool, move |conn| {
        conn.transaction(|conn| {
            let product = find_product(conn, product_id)?;
            let current = current_quantity(conn, user.id, product_id)?;
            let wanted = current.unwrap_or(0) + quantity;
            ensure_stock(&product, wanted)?;

            // Sem ON CONFLICT: o MultiBackend só expõe o que os dois bancos têm em comum.
            match current {
                Some(_) => set_quantity(conn, user.id, product_id, wanted)?,
                None => {
                    diesel::insert_into(cart_items::table)
                        .values(NewCartItem { user_id: user.id, product_id, quantity })
                        .execute(conn)?;
                }
            }
            load_cart(conn, user.id)
        })
    })
    .await?;

    Ok(web::Json(cart))
}

/// PATCH /api/cart/items/{product_id}  { quantity }  — quantidade <= 0 remove o item.
pub async fn update_item(
    pool: web::Data<DbPool>,
    user: AuthUser,
    path: web::Path<i32>,
    body: web::Json<UpdateItemRequest>,
) -> CartResult {
    let product_id = path.into_inner();
    let quantity = body.quantity;

    let cart = with_conn(&pool, move |conn| {
        conn.transaction(|conn| {
            if quantity <= 0 {
                delete_item(conn, user.id, product_id)?;
            } else {
                ensure_stock(&find_product(conn, product_id)?, quantity)?;
                if set_quantity(conn, user.id, product_id, quantity)? == 0 {
                    return Err(ApiError::NotFound("item não está no carrinho"));
                }
            }
            load_cart(conn, user.id)
        })
    })
    .await?;

    Ok(web::Json(cart))
}

/// DELETE /api/cart/items/{product_id}
pub async fn remove_item(pool: web::Data<DbPool>, user: AuthUser, path: web::Path<i32>) -> CartResult {
    let product_id = path.into_inner();
    let cart = with_conn(&pool, move |conn| {
        delete_item(conn, user.id, product_id)?;
        load_cart(conn, user.id)
    })
    .await?;
    Ok(web::Json(cart))
}

/// DELETE /api/cart — esvazia (usado no "Finalizar compra" da demo).
pub async fn clear(pool: web::Data<DbPool>, user: AuthUser) -> CartResult {
    let cart = with_conn(&pool, move |conn| {
        diesel::delete(cart_items::table.filter(cart_items::user_id.eq(user.id))).execute(conn)?;
        load_cart(conn, user.id)
    })
    .await?;
    Ok(web::Json(cart))
}

// ------------------------------------------------------------------ helpers

fn load_cart(conn: &mut AnyConnection, user_id: i32) -> Result<CartDto, ApiError> {
    let rows: Vec<(Product, i32)> = cart_items::table
        .inner_join(products::table)
        .filter(cart_items::user_id.eq(user_id))
        .order(cart_items::id)
        .select((Product::as_select(), cart_items::quantity))
        .load(conn)?;

    let total_cents = rows
        .iter()
        .map(|(p, q)| i64::from(p.price_cents) * i64::from(*q))
        .sum();
    let items = rows
        .into_iter()
        .map(|(product, quantity)| CartItemDto { product, quantity })
        .collect();

    Ok(CartDto { items, total_cents })
}

fn find_product(conn: &mut AnyConnection, id: i32) -> Result<Product, ApiError> {
    products::table
        .find(id)
        .select(Product::as_select())
        .first(conn)
        .optional()?
        .ok_or(ApiError::NotFound("produto não encontrado"))
}

fn ensure_stock(product: &Product, wanted: i32) -> Result<(), ApiError> {
    if wanted > product.stock {
        return Err(ApiError::BadRequest(format!(
            "estoque insuficiente para {} (disponível: {})",
            product.name, product.stock
        )));
    }
    Ok(())
}

fn current_quantity(conn: &mut AnyConnection, user_id: i32, product_id: i32) -> Result<Option<i32>, ApiError> {
    Ok(item_filter(user_id, product_id)
        .select(cart_items::quantity)
        .first(conn)
        .optional()?)
}

fn set_quantity(conn: &mut AnyConnection, user_id: i32, product_id: i32, quantity: i32) -> Result<usize, ApiError> {
    Ok(diesel::update(item_filter(user_id, product_id))
        .set(cart_items::quantity.eq(quantity))
        .execute(conn)?)
}

fn delete_item(conn: &mut AnyConnection, user_id: i32, product_id: i32) -> Result<usize, ApiError> {
    Ok(diesel::delete(item_filter(user_id, product_id)).execute(conn)?)
}

#[diesel::dsl::auto_type(no_type_alias)]
fn item_filter(user_id: i32, product_id: i32) -> _ {
    cart_items::table
        .filter(cart_items::user_id.eq(user_id))
        .filter(cart_items::product_id.eq(product_id))
}
