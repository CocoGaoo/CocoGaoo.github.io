create table if not exists public.hanstep_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.hanstep_progress enable row level security;

drop policy if exists "Users read own Hanstep progress" on public.hanstep_progress;
create policy "Users read own Hanstep progress" on public.hanstep_progress
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users create own Hanstep progress" on public.hanstep_progress;
create policy "Users create own Hanstep progress" on public.hanstep_progress
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own Hanstep progress" on public.hanstep_progress;
create policy "Users update own Hanstep progress" on public.hanstep_progress
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.hanstep_progress to authenticated;
