// Escrito à mão (equivalente ao que o `diesel print-schema` geraria).
// Só usa tipos suportados pelo MultiBackend: Integer e Text.

diesel::table! {
    users (id) {
        id -> Integer,
        name -> Text,
        email -> Text,
        password_hash -> Text,
    }
}

diesel::table! {
    sessions (token) {
        token -> Text,
        user_id -> Integer,
    }
}

diesel::table! {
    products (id) {
        id -> Integer,
        name -> Text,
        description -> Text,
        category -> Text,
        price_cents -> Integer,
        stock -> Integer,
    }
}

diesel::table! {
    cart_items (id) {
        id -> Integer,
        user_id -> Integer,
        product_id -> Integer,
        quantity -> Integer,
    }
}

diesel::joinable!(sessions -> users (user_id));
diesel::joinable!(cart_items -> users (user_id));
diesel::joinable!(cart_items -> products (product_id));

diesel::allow_tables_to_appear_in_same_query!(users, sessions, products, cart_items);
