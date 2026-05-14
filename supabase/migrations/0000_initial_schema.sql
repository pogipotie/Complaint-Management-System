-- Enums
create type public.user_role as enum ('citizen', 'staff', 'admin');
create type public.complaint_status as enum (
  'pending',
  'assigned',
  'in_progress',
  'resolved',
  'rejected',
  'closed'
);
create type public.complaint_priority as enum ('low', 'medium', 'high', 'emergency');
create type public.notification_type as enum (
  'complaint_created',
  'complaint_assigned',
  'status_changed',
  'comment_added',
  'resolution_added',
  'system'
);

-- Tables
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.departments (is_active);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'citizen',
  full_name text not null,
  phone text,
  barangay text,
  city_municipality text,
  province text,
  department_id uuid references public.departments(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.users (role);
create index on public.users (department_id);
create index on public.users (barangay);

create table public.complaint_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  default_department_id uuid references public.departments(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.complaint_categories (is_active);
create index on public.complaint_categories (default_department_id);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete restrict,
  category_id uuid not null references public.complaint_categories(id) on delete restrict,
  assigned_department_id uuid references public.departments(id) on delete set null,
  assigned_staff_user_id uuid references public.users(id) on delete set null,
  status public.complaint_status not null default 'pending',
  priority public.complaint_priority not null default 'medium',
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 10 and 5000),
  latitude double precision,
  longitude double precision,
  location_text text,
  barangay text,
  evidence_paths text[] not null default '{}',
  resolution_notes text,
  resolved_at timestamptz,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index complaints_created_by_idx on public.complaints (created_by, created_at desc);
create index complaints_status_idx on public.complaints (status, updated_at desc);
create index complaints_assigned_dept_idx on public.complaints (assigned_department_id, status, updated_at desc);
create index complaints_category_idx on public.complaints (category_id, created_at desc);
create index complaints_barangay_idx on public.complaints (barangay, created_at desc);
create index complaints_priority_idx on public.complaints (priority, updated_at desc);

create table public.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  from_status public.complaint_status,
  to_status public.complaint_status not null,
  changed_by uuid references public.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index complaint_status_history_complaint_idx on public.complaint_status_history (complaint_id, created_at desc);
create index complaint_status_history_to_status_idx on public.complaint_status_history (to_status, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  complaint_id uuid references public.complaints(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  read_at timestamptz,
  should_email boolean not null default false,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, is_read, created_at desc);
create index notifications_complaint_idx on public.notifications (complaint_id, created_at desc);
create index notifications_should_email_idx on public.notifications (should_email, emailed_at) where should_email = true;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_actor_idx on public.audit_logs (actor_user_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);

-- Triggers for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger trg_complaints_updated_at before update on public.complaints for each row execute function public.set_updated_at();

-- Status history trigger
create or replace function public.on_complaint_status_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.complaint_status_history(complaint_id, from_status, to_status, changed_by, note)
    values (new.id, null, new.status, new.created_by, 'Complaint created');
    insert into public.notifications(user_id, complaint_id, type, title, body, should_email)
    values (new.created_by, new.id, 'complaint_created', 'Complaint submitted', 'Your complaint was submitted and is now pending review.', true);
    return new;
  end if;
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.complaint_status_history(complaint_id, from_status, to_status, changed_by, note)
    values (new.id, old.status, new.status, auth.uid(), null);
    insert into public.notifications(user_id, complaint_id, type, title, body, should_email)
    values (new.created_by, new.id, 'status_changed', 'Complaint status updated', concat('New status: ', new.status::text), true);
    return new;
  end if;
  return new;
end;
$$;
create trigger trg_complaints_status_history after insert or update on public.complaints for each row execute function public.on_complaint_status_change();

-- Audit trigger
create or replace function public.audit_complaints_update()
returns trigger language plpgsql as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  insert into public.audit_logs(actor_user_id, entity_type, entity_id, action, meta)
  values (
    auth.uid(),
    'complaints',
    new.id,
    'UPDATE',
    jsonb_build_object('changed_fields', (select jsonb_object_agg(k, v) from jsonb_each(to_jsonb(new)) as t(k,v) where to_jsonb(old)->k is distinct from v))
  );
  return new;
end;
$$;
create trigger trg_audit_complaints after update on public.complaints for each row execute function public.audit_complaints_update();

-- RLS Policies
alter table public.users enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.departments enable row level security;
alter table public.complaint_categories enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_role()
returns public.user_role language sql stable as $$
  select role from public.users where id = auth.uid()
$$;

create policy "Users can read own profile" on public.users for select using (id = auth.uid() or public.current_role() in ('admin','staff'));
create policy "Users can update own profile" on public.users for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Citizen can create complaint" on public.complaints for insert with check (created_by = auth.uid());
create policy "Citizen can read own complaints" on public.complaints for select using (
  created_by = auth.uid()
  or public.current_role() in ('admin')
  or (public.current_role() = 'staff' and assigned_department_id = (select department_id from public.users where id = auth.uid()))
);
create policy "Admin can update any complaint" on public.complaints for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "Staff can update assigned complaints" on public.complaints for update using (
  public.current_role() = 'staff' and assigned_department_id = (select department_id from public.users where id = auth.uid())
) with check (
  public.current_role() = 'staff' and assigned_department_id = (select department_id from public.users where id = auth.uid())
);

create policy "Read status history with complaint access" on public.complaint_status_history for select using (
  exists (
    select 1 from public.complaints c
    where c.id = complaint_id
    and (
      c.created_by = auth.uid()
      or public.current_role() = 'admin'
      or (public.current_role() = 'staff' and c.assigned_department_id = (select department_id from public.users where id = auth.uid()))
    )
  )
);

create policy "Users read own notifications" on public.notifications for select using (user_id = auth.uid() or public.current_role() = 'admin');
create policy "Users mark own notifications read" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Public read active departments" on public.departments for select using (is_active = true);
create policy "Admin manage departments" on public.departments for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "Public read active categories" on public.complaint_categories for select using (is_active = true);
create policy "Admin manage categories" on public.complaint_categories for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "Admin read audit logs" on public.audit_logs for select using (public.current_role() = 'admin');
