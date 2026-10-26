use actix_web::web;

mod auth;
mod cart;
mod products;

/// Todas as rotas ficam sob `/api`.
pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .route("/health", web::get().to(health))
            .route("/auth/login", web::post().to(auth::login))
            .route("/auth/logout", web::post().to(auth::logout))
            .route("/products", web::get().to(products::list))
            .route("/cart", web::get().to(cart::get))
            .route("/cart", web::delete().to(cart::clear))
            .route("/cart/items", web::post().to(cart::add_item))
            .route("/cart/items/{product_id}", web::patch().to(cart::update_item))
            .route("/cart/items/{product_id}", web::delete().to(cart::remove_item)),
    );
}

async fn health() -> &'static str {
    "ok"
}
