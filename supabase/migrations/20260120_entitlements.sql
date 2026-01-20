create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free',
  credits_remaining integer,
  updated_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;

create policy "user_entitlements_read_own"
  on public.user_entitlements
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_entitlements_update_own"
  on public.user_entitlements
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.consume_generation()
returns table(allowed boolean, plan text, credits_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  current_plan text;
  current_credits integer;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_entitlements (user_id, plan, credits_remaining)
  values (uid, 'free', 2)
  on conflict (user_id) do nothing;

  select plan, credits_remaining
  into current_plan, current_credits
  from public.user_entitlements
  where user_id = uid;

  if current_plan = 'max' then
    return query select true, current_plan, null;
    return;
  end if;

  if current_credits is null then
    current_credits := 0;
  end if;

  if current_credits <= 0 then
    return query select false, current_plan, 0;
    return;
  end if;

  update public.user_entitlements
    set credits_remaining = credits_remaining - 1,
        updated_at = now()
    where user_id = uid and credits_remaining > 0
    returning plan, credits_remaining
    into current_plan, current_credits;

  return query select true, current_plan, current_credits;
end;
$$;

revoke all on function public.consume_generation() from public;
grant execute on function public.consume_generation() to authenticated;

