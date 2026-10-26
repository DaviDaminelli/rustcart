//! Dados iniciais (usuário demo + catálogo), inseridos só se o banco estiver vazio.
//! Fica em Rust e não em SQL para valer igual nos dois bancos e para gerar o hash argon2.

use diesel::prelude::*;

use crate::auth::hash_password;
use crate::db::AnyConnection;
use crate::error::ApiError;
use crate::models::{NewProduct, NewUser};
use crate::schema::{products, users};

pub const DEMO_EMAIL: &str = "demo@rustcart.dev";
pub const DEMO_PASSWORD: &str = "demo1234";

/// (nome, descrição, categoria, preço em centavos, estoque) — o mesmo do mock do frontend.
const PRODUCTS: &[(&str, &str, &str, i32, i32)] = &[
    ("Café Especial 250g", "Grãos torra média, notas de chocolate e caramelo.", "cafe", 4290, 32),
    ("Prensa Francesa 600ml", "Vidro borossilicato com filtro de aço inox.", "cafe", 12900, 12),
    ("The Rust Programming Language", "O livro oficial, edição impressa.", "livros", 18990, 8),
    ("Zero To Production", "Backend em Rust do zero ao deploy.", "livros", 21500, 5),
    ("Fone Bluetooth ANC", "Cancelamento de ruído e 30h de bateria.", "audio", 49900, 14),
    ("Caixa de Som Portátil", "À prova d’água IPX7, som 360°.", "audio", 32990, 0),
    ("Luminária de Mesa LED", "Três temperaturas de cor e carregador USB-C.", "casa", 15900, 21),
    ("Planta Jiboia em Vaso", "Fácil de cuidar, ideal para meia-sombra.", "casa", 6990, 40),
    ("Teclado Mecânico 75%", "Switches tácteis, hot-swap, layout ABNT2.", "escritorio", 58900, 9),
    ("Mousepad XL", "Base emborrachada, 90 × 40 cm.", "escritorio", 8990, 27),
    ("Caderno Pontilhado A5", "160 páginas, papel 120 g/m².", "escritorio", 5490, 50),
    ("Caneca Ferris 350ml", "Cerâmica com o mascote do Rust.", "cafe", 4990, 18),
];

pub fn run(conn: &mut AnyConnection) -> Result<(), ApiError> {
    conn.transaction(|conn| {
        let user_count: i64 = users::table.count().get_result(conn)?;
        if user_count == 0 {
            let hash = hash_password(DEMO_PASSWORD)?;
            diesel::insert_into(users::table)
                .values(NewUser { name: "Cliente Demo", email: DEMO_EMAIL, password_hash: &hash })
                .execute(conn)?;
            log::info!("usuário demo criado: {DEMO_EMAIL} / {DEMO_PASSWORD}");
        }

        let product_count: i64 = products::table.count().get_result(conn)?;
        if product_count == 0 {
            // Um insert por linha: batch insert não é suportado pelo MultiBackend.
            for &(name, description, category, price_cents, stock) in PRODUCTS {
                diesel::insert_into(products::table)
                    .values(NewProduct { name, description, category, price_cents, stock })
                    .execute(conn)?;
            }
            log::info!("{} produtos inseridos", PRODUCTS.len());
        }
        Ok(())
    })
}
