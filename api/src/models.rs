use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::schema::{cart_items, products, sessions, users};

// ------------------------------------------------------------------ tabelas

#[derive(Debug, Queryable, Selectable)]
#[diesel(table_name = users)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub password_hash: String,
}

#[derive(Insertable)]
#[diesel(table_name = users)]
pub struct NewUser<'a> {
    pub name: &'a str,
    pub email: &'a str,
    pub password_hash: &'a str,
}

#[derive(Insertable)]
#[diesel(table_name = sessions)]
pub struct NewSession<'a> {
    pub token: &'a str,
    pub user_id: i32,
}

#[derive(Debug, Clone, Queryable, Selectable, Serialize)]
#[diesel(table_name = products)]
pub struct Product {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub category: String,
    pub price_cents: i32,
    pub stock: i32,
}

#[derive(Insertable)]
#[diesel(table_name = products)]
pub struct NewProduct<'a> {
    pub name: &'a str,
    pub description: &'a str,
    pub category: &'a str,
    pub price_cents: i32,
    pub stock: i32,
}

#[derive(Insertable)]
#[diesel(table_name = cart_items)]
pub struct NewCartItem {
    pub user_id: i32,
    pub product_id: i32,
    pub quantity: i32,
}

// ------------------------------------------------------------------ DTOs (espelham frontend/src/types.ts)

#[derive(Serialize)]
pub struct UserDto {
    pub id: i32,
    pub name: String,
    pub email: String,
}

impl From<User> for UserDto {
    fn from(u: User) -> Self {
        Self { id: u.id, name: u.name, email: u.email }
    }
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserDto,
}

#[derive(Serialize)]
pub struct CartItemDto {
    pub product: Product,
    pub quantity: i32,
}

#[derive(Serialize)]
pub struct CartDto {
    pub items: Vec<CartItemDto>,
    pub total_cents: i64,
}

#[derive(Deserialize)]
pub struct AddItemRequest {
    pub product_id: i32,
    #[serde(default = "one")]
    pub quantity: i32,
}

#[derive(Deserialize)]
pub struct UpdateItemRequest {
    pub quantity: i32,
}

fn one() -> i32 {
    1
}
