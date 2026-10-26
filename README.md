# Rust Cart

Projeto pequeno de carrinho de compras: login, catálogo e carrinho.

| Pasta       | Stack                                   | Porta |
| ----------- | --------------------------------------- | ----- |
| `frontend/` | React 19 + Vite + Tailwind 4 + shadcn/ui | 5173 (dev) |
| `api/`      | Actix-web + Diesel (Postgres **ou** SQLite) | 8080 |
| `web/`      | Rocket — serve o build do React          | 8000 |

## Só o frontend com mock (para print)

Não precisa de Rust nem de banco. O mock vem ligado por padrão (`frontend/.env`).

```sh
cd frontend
pnpm install
pnpm dev          # http://localhost:5173
```

Login já vem preenchido (`demo@rustcart.dev` / `demo1234`); no mock qualquer
e-mail e senha com 4+ caracteres funciona.

## Stack completa

Não é preciso instalar Postgres/SQLite para **compilar**: `libsqlite3-sys` e
`pq-sys` usam as features `bundled`, então o cargo compila as libs C junto
(precisa só do MSVC Build Tools no Windows).

```sh
# 1. API
cd api
cp .env.example .env      # escolha DATABASE_URL (sqlite:// ou postgres://)
cargo run                 # roda migrations + seed na subida

# 2. Frontend apontando para a API
cd frontend
VITE_USE_MOCK=false VITE_API_URL=http://127.0.0.1:8080/api pnpm build

# 3. Rocket servindo o build
cd web
cargo run                 # http://localhost:8000
```

Em desenvolvimento dá para pular o Rocket: `VITE_USE_MOCK=false pnpm dev` usa o
proxy do Vite (`/api` → `127.0.0.1:8080`).

### Postgres e SQLite no mesmo binário

`api/src/db.rs` usa `#[derive(diesel::MultiConnection)]`: as queries são escritas
uma vez e rodam nos dois bancos. O esquema da `DATABASE_URL` escolhe o driver.
Limitações do `MultiBackend` respeitadas no código: só tipos `Integer`/`Text`,
sem `RETURNING`, sem `ON CONFLICT` e sem batch insert. As migrations ficam em
`api/migrations/{postgres,sqlite}` porque o DDL difere (`SERIAL` × `AUTOINCREMENT`).

### Endpoints

| Método | Rota                          | Auth |
| ------ | ----------------------------- | ---- |
| POST   | `/api/auth/login`             | —    |
| POST   | `/api/auth/logout`            | ✓    |
| GET    | `/api/products`               | —    |
| GET    | `/api/cart`                   | ✓    |
| DELETE | `/api/cart`                   | ✓    |
| POST   | `/api/cart/items`             | ✓    |
| PATCH  | `/api/cart/items/{product_id}`| ✓    |
| DELETE | `/api/cart/items/{product_id}`| ✓    |

Auth: `Authorization: Bearer <token>` (token de sessão salvo na tabela `sessions`,
senha com argon2).

## Windows: Smart App Control

Com o **Smart App Control** ligado, o Windows bloqueia os build scripts do cargo
(`os error 4551 — Uma política de Controle de Aplicativo bloqueou este arquivo`)
e nenhum projeto Rust com dependências nativas compila. Alternativas: desligar o
Smart App Control (não dá para religar sem reinstalar o Windows), compilar no
WSL, ou em outra máquina/CI.
