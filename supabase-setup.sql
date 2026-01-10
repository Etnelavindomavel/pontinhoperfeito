-- ============================================================================
-- SUPABASE SETUP SCRIPT - PONTO PERFEITO
-- ============================================================================
-- Execute este script no SQL Editor do Supabase após criar o projeto
-- ============================================================================

-- Habilitar extensões
create extension if not exists "uuid-ossp";

-- Tabela de usuários (extende auth.users do Supabase)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text not null,
  whatsapp text,
  store_name text,
  cnpj text,
  city text,
  state text,
  logo text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'essencial', 'pro', 'consultoria')),
  subscription_status text default 'active' check (subscription_status in ('active', 'canceled', 'expired')),
  subscription_start_date timestamp with time zone,
  subscription_end_date timestamp with time zone,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de uploads de dados
create table public.uploads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  filename text not null,
  file_size integer,
  row_count integer,
  columns jsonb,
  date_range jsonb,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de dados brutos (transações)
create table public.raw_data (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  upload_id uuid references public.uploads(id) on delete cascade not null,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de relatórios gerados
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  report_name text not null,
  analysis_types text[] not null,
  date_range jsonb,
  filters jsonb,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de preferências do usuário
create table public.user_preferences (
  user_id uuid references public.users(id) on delete cascade primary key,
  section_order jsonb,
  theme text default 'light',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para performance
create index users_email_idx on public.users(email);
create index users_subscription_tier_idx on public.users(subscription_tier);
create index uploads_user_id_idx on public.uploads(user_id);
create index raw_data_user_id_idx on public.raw_data(user_id);
create index raw_data_upload_id_idx on public.raw_data(upload_id);
create index reports_user_id_idx on public.reports(user_id);

-- Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.uploads enable row level security;
alter table public.raw_data enable row level security;
alter table public.reports enable row level security;
alter table public.user_preferences enable row level security;

-- Políticas RLS - Users
create policy "Users can view own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own data"
  on public.users for update
  using (auth.uid() = id);

-- Políticas RLS - Uploads
create policy "Users can view own uploads"
  on public.uploads for select
  using (auth.uid() = user_id);

create policy "Users can insert own uploads"
  on public.uploads for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own uploads"
  on public.uploads for delete
  using (auth.uid() = user_id);

-- Políticas RLS - Raw Data
create policy "Users can view own raw_data"
  on public.raw_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own raw_data"
  on public.raw_data for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own raw_data"
  on public.raw_data for delete
  using (auth.uid() = user_id);

-- Políticas RLS - Reports
create policy "Users can view own reports"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own reports"
  on public.reports for delete
  using (auth.uid() = user_id);

-- Políticas RLS - User Preferences
create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Função para criar perfil de usuário automaticamente após signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para criar perfil automaticamente
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Função para atualizar updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para users
drop trigger if exists set_updated_at on public.users;
create trigger set_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

-- Trigger para user_preferences
drop trigger if exists set_updated_at on public.user_preferences;
create trigger set_updated_at
  before update on public.user_preferences
  for each row execute procedure public.handle_updated_at();
