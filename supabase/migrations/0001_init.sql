-- Afetivo — schema inicial (Fase 2: backend Supabase)
--
-- Modelo local-first: o cliente (IndexedDB) é a fonte de verdade offline;
-- o servidor espelha cada coleção com `data` (JSONB já validado pelo Zod no
-- cliente), `updated_at` (relógio do cliente, p/ merge LWW) e `deleted_at`
-- (tombstone — exclusões precisam propagar para os outros dispositivos).
-- `data` é anulável porque tombstone de registro já apagado não tem payload.
--
-- Aplicar via Dashboard > SQL Editor ou `supabase db push`.
-- RLS obrigatória: sem sessão autenticada nenhuma linha é visível.

begin;

create table public.profiles (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create table public.entries (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create table public.medications (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create table public.medication_events (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create table public.warning_signs (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create table public.assessments (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

-- Pull incremental: `where user_id = auth.uid() and updated_at > cursor`.
create index entries_user_updated_at_idx on public.entries (user_id, updated_at);
create index medications_user_updated_at_idx on public.medications (user_id, updated_at);
create index medication_events_user_updated_at_idx on public.medication_events (user_id, updated_at);
create index warning_signs_user_updated_at_idx on public.warning_signs (user_id, updated_at);
create index assessments_user_updated_at_idx on public.assessments (user_id, updated_at);
create index profiles_user_updated_at_idx on public.profiles (user_id, updated_at);

alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.medications enable row level security;
alter table public.medication_events enable row level security;
alter table public.warning_signs enable row level security;
alter table public.assessments enable row level security;

create policy "profiles own rows" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "entries own rows" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "medications own rows" on public.medications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "medication_events own rows" on public.medication_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "warning_signs own rows" on public.warning_signs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "assessments own rows" on public.assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Guarda LWW no servidor: upsert mais antigo que a linha atual é descartado
-- (evita que um dispositivo com push atrasado reescreva dado mais novo).
create or replace function public.afetivo_reject_stale() returns trigger
language plpgsql as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end;
$$;

create trigger entries_lww before update on public.entries
  for each row execute function public.afetivo_reject_stale();
create trigger medications_lww before update on public.medications
  for each row execute function public.afetivo_reject_stale();
create trigger medication_events_lww before update on public.medication_events
  for each row execute function public.afetivo_reject_stale();
create trigger warning_signs_lww before update on public.warning_signs
  for each row execute function public.afetivo_reject_stale();
create trigger assessments_lww before update on public.assessments
  for each row execute function public.afetivo_reject_stale();
create trigger profiles_lww before update on public.profiles
  for each row execute function public.afetivo_reject_stale();

commit;
