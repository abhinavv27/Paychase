create table payment_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  invoice_id uuid references invoices(id),
  razorpay_payment_id text unique,
  amount numeric not null,
  currency text default 'INR',
  status text not null default 'unmatched',
  matched_at timestamptz,
  created_at timestamptz default now()
);

alter table payment_transactions enable row level security;

create policy "Users can view their own transactions"
  on payment_transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on payment_transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on payment_transactions for update
  using (auth.uid() = user_id);
