-- ألواح هب | AlwahHub
-- Architecture: profiles, workspaces, boards, columns, tasks
-- Team isolation via workspace_members + Row Level Security
-- Realtime enabled on columns and tasks

create extension if not exists pgcrypto;

--------------------------------------------------------------------------------
-- Enums
--------------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_tier') then
    create type public.plan_tier as enum ('free', 'solo', 'team', 'agency');
  end if;

  if not exists (select 1 from pg_type where typname = 'template_type') then
    create type public.template_type as enum ('custom', 'wedding', 'sales', 'dev', 'edu');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;

  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type public.workspace_role as enum ('owner', 'admin', 'member');
  end if;
end
$$;

--------------------------------------------------------------------------------
-- Tables
--------------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  plan public.plan_tier not null default 'free',
  onboarded_at timestamptz,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists onboarded_at timestamptz;

alter table public.profiles
  add column if not exists email text;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Required for team/agency isolation (not a public UI table).
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  template_type public.template_type not null default 'custom',
  created_at timestamptz not null default now()
);

create table if not exists public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns (id) on delete cascade,
  title text not null,
  description text,
  priority public.task_priority not null default 'medium',
  due_date date,
  position integer not null default 0,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint tasks_custom_fields_object check (jsonb_typeof(custom_fields) = 'object')
);

--------------------------------------------------------------------------------
-- Indexes
--------------------------------------------------------------------------------

create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists boards_workspace_id_idx on public.boards (workspace_id);
create index if not exists columns_board_id_position_idx on public.columns (board_id, position);
create index if not exists tasks_column_id_position_idx on public.tasks (column_id, position);
create index if not exists tasks_due_date_idx on public.tasks (due_date);
create index if not exists tasks_custom_fields_gin_idx on public.tasks using gin (custom_fields);
create index if not exists profiles_email_lower_idx
  on public.profiles (lower(btrim(email)));

--------------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER to avoid RLS recursion)
--------------------------------------------------------------------------------

create or replace function public.is_workspace_member(_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = _workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = _workspace_id
      and w.owner_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(
  _workspace_id uuid,
  _roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = _workspace_id
      and wm.user_id = auth.uid()
      and wm.role = any (_roles)
  );
$$;

create or replace function public.workspace_id_for_board(_board_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.workspace_id
  from public.boards b
  where b.id = _board_id;
$$;

create or replace function public.workspace_id_for_column(_column_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.workspace_id
  from public.columns c
  join public.boards b on b.id = c.board_id
  where c.id = _column_id;
$$;

--------------------------------------------------------------------------------
-- Triggers
--------------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text := coalesce(new.raw_user_meta_data ->> 'full_name', '');
begin
  insert into public.profiles (id, full_name, plan, email)
  values (new.id, v_full_name, 'free', new.email)
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email);

  insert into public.workspaces (name, owner_id)
  select
    'مساحة العمل' || case when v_full_name <> '' then ' — ' || v_full_name else '' end,
    new.id
  where not exists (
    select 1 from public.workspaces w where w.owner_id = new.id
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do update
    set role = 'owner';
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

--------------------------------------------------------------------------------
-- Row Level Security
--------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.tasks enable row level security;

-- profiles
drop policy if exists "profiles_select_self_or_teammates" on public.profiles;
create policy "profiles_select_self_or_teammates"
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.workspace_members mine
      join public.workspace_members theirs
        on theirs.workspace_id = mine.workspace_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- workspaces
drop policy if exists "workspaces_select_members" on public.workspaces;
create policy "workspaces_select_members"
  on public.workspaces
  for select
  to authenticated
  using (public.is_workspace_member(id));

drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner"
  on public.workspaces
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner"
  on public.workspaces
  for update
  to authenticated
  using (public.is_workspace_owner(id))
  with check (owner_id = auth.uid());

drop policy if exists "workspaces_delete_owner" on public.workspaces;
create policy "workspaces_delete_owner"
  on public.workspaces
  for delete
  to authenticated
  using (public.is_workspace_owner(id));

-- workspace_members
drop policy if exists "workspace_members_select_team" on public.workspace_members;
create policy "workspace_members_select_team"
  on public.workspace_members
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_members_insert_admins" on public.workspace_members;
create policy "workspace_members_insert_admins"
  on public.workspace_members
  for insert
  to authenticated
  with check (
    public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  );

drop policy if exists "workspace_members_update_owner" on public.workspace_members;
create policy "workspace_members_update_owner"
  on public.workspace_members
  for update
  to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists "workspace_members_delete_admins_or_self" on public.workspace_members;
create policy "workspace_members_delete_admins_or_self"
  on public.workspace_members
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  );

-- boards
drop policy if exists "boards_select_members" on public.boards;
create policy "boards_select_members"
  on public.boards
  for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "boards_insert_members" on public.boards;
create policy "boards_insert_members"
  on public.boards
  for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "boards_update_members" on public.boards;
create policy "boards_update_members"
  on public.boards
  for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "boards_delete_admins" on public.boards;
create policy "boards_delete_admins"
  on public.boards
  for delete
  to authenticated
  using (
    public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  );

-- columns
drop policy if exists "columns_select_members" on public.columns;
create policy "columns_select_members"
  on public.columns
  for select
  to authenticated
  using (public.is_workspace_member(public.workspace_id_for_board(board_id)));

drop policy if exists "columns_insert_members" on public.columns;
create policy "columns_insert_members"
  on public.columns
  for insert
  to authenticated
  with check (public.is_workspace_member(public.workspace_id_for_board(board_id)));

drop policy if exists "columns_update_members" on public.columns;
create policy "columns_update_members"
  on public.columns
  for update
  to authenticated
  using (public.is_workspace_member(public.workspace_id_for_board(board_id)))
  with check (public.is_workspace_member(public.workspace_id_for_board(board_id)));

drop policy if exists "columns_delete_members" on public.columns;
create policy "columns_delete_members"
  on public.columns
  for delete
  to authenticated
  using (public.is_workspace_member(public.workspace_id_for_board(board_id)));

-- tasks
drop policy if exists "tasks_select_members" on public.tasks;
create policy "tasks_select_members"
  on public.tasks
  for select
  to authenticated
  using (public.is_workspace_member(public.workspace_id_for_column(column_id)));

drop policy if exists "tasks_insert_members" on public.tasks;
create policy "tasks_insert_members"
  on public.tasks
  for insert
  to authenticated
  with check (public.is_workspace_member(public.workspace_id_for_column(column_id)));

drop policy if exists "tasks_update_members" on public.tasks;
create policy "tasks_update_members"
  on public.tasks
  for update
  to authenticated
  using (public.is_workspace_member(public.workspace_id_for_column(column_id)))
  with check (public.is_workspace_member(public.workspace_id_for_column(column_id)));

drop policy if exists "tasks_delete_members" on public.tasks;
create policy "tasks_delete_members"
  on public.tasks
  for delete
  to authenticated
  using (public.is_workspace_member(public.workspace_id_for_column(column_id)));

--------------------------------------------------------------------------------
-- Realtime
--------------------------------------------------------------------------------

alter table public.columns replica identity full;
alter table public.tasks replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'columns'
  ) then
    alter publication supabase_realtime add table public.columns;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end
$$;

--------------------------------------------------------------------------------
-- Grants
--------------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.boards to authenticated;
grant select, insert, update, delete on public.columns to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;

--------------------------------------------------------------------------------
-- Billing: webhook audit + protect plan from client updates
--------------------------------------------------------------------------------

create table if not exists public.billing_events (
  id text primary key,
  provider text not null,
  user_id uuid references public.profiles (id) on delete set null,
  plan public.plan_tier,
  payment_id text,
  amount_halalas integer,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

alter table public.billing_events enable row level security;

create or replace function public.guard_profile_plan()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.plan is distinct from old.plan
     and coalesce(auth.jwt() ->> 'role', current_user)
       not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception 'تحديث الباقة يتم عبر بوابة الدفع فقط';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_plan on public.profiles;
create trigger profiles_guard_plan
  before update on public.profiles
  for each row execute function public.guard_profile_plan();

create or replace function public.apply_billing_plan(
  p_user uuid,
  p_plan public.plan_tier
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set plan = p_plan
  where id = p_user;
end;
$$;

revoke all on function public.apply_billing_plan(uuid, public.plan_tier) from public;
grant execute on function public.apply_billing_plan(uuid, public.plan_tier) to service_role;

--------------------------------------------------------------------------------
-- Onboarding: workspace (via signup trigger) + first board from a template
--------------------------------------------------------------------------------

create or replace function public.complete_onboarding(
  p_template public.template_type default 'sales'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_full_name text;
  v_workspace uuid;
  v_board uuid;
  v_column uuid;
  v_title text;
  v_columns text[];
  v_task_title text;
  v_task_description text;
  v_fields jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select full_name into v_full_name from public.profiles where id = v_user;

  case p_template
    when 'sales' then
      v_title := 'مسار المبيعات';
      v_columns := array['عميل محتمل', 'جاري التفاوض', 'فواتير معلقة', 'مغلقة بنجاح'];
      v_task_title := 'عرض سعر لشركة النور';
      v_task_description := 'مهمة تجريبية لحقول قالب العمل والمبيعات.';
      v_fields := jsonb_build_object(
        'template', 'sales',
        'template_title', v_title,
        'fields', jsonb_build_array(
          jsonb_build_object('key', 'client_name', 'label', 'اسم العميل', 'type', 'text', 'value', 'شركة النور'),
          jsonb_build_object('key', 'deal_value', 'label', 'قيمة الصفقة', 'type', 'number', 'value', 12000),
          jsonb_build_object('key', 'channel', 'label', 'قناة التواصل', 'type', 'select', 'value', 'بريد', 'options', jsonb_build_array('بريد', 'هاتف', 'واتساب')),
          jsonb_build_object('key', 'expected_close', 'label', 'تاريخ الإغلاق المتوقع', 'type', 'date', 'value', null)
        ),
        'values', jsonb_build_object(
          'client_name', 'شركة النور',
          'deal_value', 12000,
          'channel', 'بريد',
          'expected_close', null
        )
      );
    when 'dev' then
      v_title := 'لوحة البرمجة';
      v_columns := array['قائمة المهام', 'Sprint الحالي', 'قيد الاختبار', 'مكتمل'];
      v_task_title := 'إعداد بيئة التطوير';
      v_task_description := 'مهمة تجريبية لحقول قالب البرمجة.';
      v_fields := jsonb_build_object(
        'template', 'dev',
        'template_title', v_title,
        'fields', jsonb_build_array(
          jsonb_build_object('key', 'story_points', 'label', 'نقاط القصة', 'type', 'number', 'value', 3),
          jsonb_build_object('key', 'repo', 'label', 'المستودع', 'type', 'text', 'value', 'alwah-hub'),
          jsonb_build_object('key', 'priority_label', 'label', 'أولوية تقنية', 'type', 'select', 'value', 'P2', 'options', jsonb_build_array('P1', 'P2', 'P3')),
          jsonb_build_object('key', 'assignee', 'label', 'المسؤول', 'type', 'text', 'value', '')
        ),
        'values', jsonb_build_object(
          'story_points', 3,
          'repo', 'alwah-hub',
          'priority_label', 'P2',
          'assignee', ''
        )
      );
    when 'edu' then
      v_title := 'لوحة التدريس';
      v_columns := array['تجهيز الدرس', 'بانتظار الشرح', 'تم الاختبار'];
      v_task_title := 'درس الكسور الاعتيادية';
      v_task_description := 'مهمة تجريبية لحقول قالب التدريس والتعليم.';
      v_fields := jsonb_build_object(
        'template', 'edu',
        'template_title', v_title,
        'fields', jsonb_build_array(
          jsonb_build_object('key', 'subject', 'label', 'المادة', 'type', 'text', 'value', 'الرياضيات'),
          jsonb_build_object('key', 'grade', 'label', 'الصف', 'type', 'text', 'value', 'الثالث متوسط'),
          jsonb_build_object('key', 'duration_minutes', 'label', 'المدة بالدقائق', 'type', 'number', 'value', 45),
          jsonb_build_object('key', 'exam_date', 'label', 'موعد الاختبار', 'type', 'date', 'value', null)
        ),
        'values', jsonb_build_object(
          'subject', 'الرياضيات',
          'grade', 'الثالث متوسط',
          'duration_minutes', 45,
          'exam_date', null
        )
      );
    else
      v_title := 'لوحة المنزل والمناسبات';
      v_columns := array['أفكار', 'قيد التجهيز', 'تم الشراء'];
      v_task_title := 'قائمة مستلزمات المناسبة';
      v_task_description := 'مهمة تجريبية لحقول قالب المنزل والمناسبات.';
      v_fields := jsonb_build_object(
        'template', 'wedding',
        'template_title', v_title,
        'fields', jsonb_build_array(
          jsonb_build_object('key', 'budget', 'label', 'الميزانية', 'type', 'number', 'value', 500),
          jsonb_build_object('key', 'vendor', 'label', 'المورّد', 'type', 'text', 'value', ''),
          jsonb_build_object('key', 'event_date', 'label', 'تاريخ المناسبة', 'type', 'date', 'value', null),
          jsonb_build_object('key', 'guest_count', 'label', 'عدد الضيوف', 'type', 'number', 'value', 0)
        ),
        'values', jsonb_build_object(
          'budget', 500,
          'vendor', '',
          'event_date', null,
          'guest_count', 0
        )
      );
  end case;

  select id into v_workspace
  from public.workspaces
  where owner_id = v_user
  order by created_at
  limit 1;

  if v_workspace is null then
    insert into public.workspaces (name, owner_id)
    values (
      'مساحة العمل' || case when coalesce(v_full_name, '') <> '' then ' — ' || v_full_name else '' end,
      v_user
    )
    returning id into v_workspace;
  end if;

  select id into v_board
  from public.boards
  where workspace_id = v_workspace
  order by created_at
  limit 1;

  if v_board is null then
    insert into public.boards (workspace_id, title, template_type)
    values (v_workspace, v_title, p_template)
    returning id into v_board;

    for i in 1 .. coalesce(array_length(v_columns, 1), 0) loop
      insert into public.columns (board_id, title, position)
      values (v_board, v_columns[i], i - 1)
      returning id into v_column;

      if i = 1 then
        insert into public.tasks (
          column_id, title, description, priority, position, custom_fields
        ) values (
          v_column, v_task_title, v_task_description, 'medium', 0, v_fields
        );
      end if;
    end loop;
  end if;

  update public.profiles
  set onboarded_at = coalesce(onboarded_at, now())
  where id = v_user;

  return json_build_object(
    'workspace_id', v_workspace,
    'board_id', v_board
  );
end;
$$;

revoke all on function public.complete_onboarding(public.template_type) from public;
grant execute on function public.complete_onboarding(public.template_type) to authenticated;

--------------------------------------------------------------------------------
-- Invite: lookup a user by email without exposing other profiles via RLS
--------------------------------------------------------------------------------

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or btrim(p.email) = '');

create or replace function public.lookup_profile_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.id
      from public.profiles p
      where p.email is not null
        and lower(btrim(p.email)) = lower(btrim(p_email))
      limit 1
    ),
    (
      select u.id
      from auth.users u
      where u.email is not null
        and lower(btrim(u.email)) = lower(btrim(p_email))
      limit 1
    )
  );
$$;

revoke all on function public.lookup_profile_id_by_email(text) from public;
grant execute on function public.lookup_profile_id_by_email(text) to authenticated, service_role;
