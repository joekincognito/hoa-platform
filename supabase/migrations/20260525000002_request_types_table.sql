-- Move request types from a hardcoded enum (CHECK constraint) to a table
-- so admins can add their own categories without a code deploy.

------------------------------------------------------------------------------
-- 1. New table
------------------------------------------------------------------------------

create table request_types (
  key text primary key,
  label text not null,
  category text not null check (category in ('tree', 'arc', 'other')),
  description text,
  allows_inspection boolean default false,  -- whether this type supports inspection_scheduled status
  is_active boolean default true,
  display_order int default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger request_types_updated_at before update on request_types
  for each row execute function set_updated_at();

------------------------------------------------------------------------------
-- 2. Seed with the current hardcoded set
------------------------------------------------------------------------------

insert into request_types (key, label, category, allows_inspection, display_order) values
  ('tree_hoa_removal',          'Request removal of an HOA tree',           'tree', true,  10),
  ('tree_homeowner_permission', 'Request permission to remove my own tree', 'tree', false, 20),
  ('arc_fence',                 'Architectural: Fence',                      'arc',  false, 30),
  ('arc_paint',                 'Architectural: Exterior paint',             'arc',  false, 40),
  ('arc_addition',              'Architectural: Addition / new structure',   'arc',  false, 50),
  ('arc_shed',                  'Architectural: Shed',                       'arc',  false, 60),
  ('arc_other',                 'Architectural: Other',                      'arc',  false, 70);

------------------------------------------------------------------------------
-- 3. Drop the CHECK constraint on requests.type and replace with FK
------------------------------------------------------------------------------

alter table requests drop constraint requests_type_check;

alter table requests
  add constraint requests_type_fkey
  foreign key (type) references request_types(key);

------------------------------------------------------------------------------
-- 4. RLS: anyone (incl. anon) can read active types so the public can see
-- which kinds of requests exist; admins can write.
------------------------------------------------------------------------------

alter table request_types enable row level security;

create policy "request_types public read"
  on request_types for select
  using (is_active = true);

create policy "request_types admin read all"
  on request_types for select
  using (public.is_admin(auth.uid()));

create policy "request_types admin write"
  on request_types for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
