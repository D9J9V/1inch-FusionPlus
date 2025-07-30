  create table orders (
    id uuid primary key default gen_random_uuid(),
    base_network text not null,
    destination_network text not null,
    maker_address text not null,
    maker_asset text not null,
    making_amount text not null,
    taker_asset text not null,
    taking_amount text not null,
    order_hash text unique not null,
    signature text not null,
    status text default 'pending',
    lightning_invoice text, -- for Bitcoin orders
    xcm_message jsonb, -- for Polkadot orders
    created_at timestamptz default now(),
    expires_at timestamptz not null
  );
