//! Servidor web (Rocket): entrega o build do React (`frontend/dist`).
//!
//! - Arquivos estáticos via `FileServer`.
//! - Fallback de SPA: qualquer outra rota GET devolve `index.html`, assim
//!   `/catalogo` e `/carrinho` funcionam ao recarregar a página.
//!
//! A API fica no Actix (porta 8080). Gere o frontend apontando para ela:
//! `VITE_USE_MOCK=false VITE_API_URL=http://127.0.0.1:8080/api pnpm build`

use std::path::{Path, PathBuf};

use rocket::fs::{FileServer, NamedFile};
use rocket::{State, get, launch, routes};

struct StaticDir(PathBuf);

#[get("/healthz")]
fn healthz() -> &'static str {
    "ok"
}

/// rank 20 > rank padrão do FileServer (10): só responde se nenhum arquivo casar.
#[get("/<_..>", rank = 20)]
async fn spa_fallback(dir: &State<StaticDir>) -> Option<NamedFile> {
    NamedFile::open(dir.0.join("index.html")).await.ok()
}

#[launch]
fn rocket() -> _ {
    let dir = std::env::var("STATIC_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| Path::new(env!("CARGO_MANIFEST_DIR")).join("../frontend/dist"));

    if !dir.join("index.html").exists() {
        eprintln!(
            "aviso: {} não tem index.html — rode `pnpm build` em frontend/ primeiro",
            dir.display()
        );
    }

    rocket::build()
        .manage(StaticDir(dir.clone()))
        .mount("/", routes![healthz, spa_fallback])
        .mount("/", FileServer::from(dir))
}
