-- HOA Platform — initial schema
-- Mirrors the data model in PLAN.md §5.
-- Tables: events, documents, announcements, board_members, contact_submissions, profiles,
--         properties, requests, violations, attachments, status_events, notifications,
--         audit_log, broadcasts, broadcast_deliveries.

------------------------------------------------------------------------------
-- Core CMS / public content (from original Walden spec)
------------------------------------------------------------------------------

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  location text,
  cover_image_url text,
  rsvp_url text,
  is_published boolean default true,
  created_at timestamptz default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_active boolean default true,
  display_order int default 0,
  created_at timestamptz default now()
);

create table board_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  committee text,
  display_order int default 0,
  is_active boolean default true
);

create table contact_submissions (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text not null,
  message text not null,
  submitted_at timestamptz default now(),
  is_read boolean default false
);

------------------------------------------------------------------------------
-- Properties registry (must exist before profiles.property_id FK)
------------------------------------------------------------------------------

create table properties (
  id uuid primary key default gen_random_uuid(),
  address text not null unique,
  homeowner_name text,
  homeowner_email text,
  homeowner_phone text,
  linked_user_id uuid references auth.users(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on properties (linked_user_id);

------------------------------------------------------------------------------
-- Member profiles (extends auth.users)
------------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  address text,
  phone text,
  is_approved boolean default false,
  is_admin boolean default false,
  property_id uuid references properties(id),
  -- Resident directory opt-ins
  show_in_directory boolean default false,
  directory_show_phone boolean default false,
  directory_show_email boolean default false,
  directory_show_address boolean default true,
  -- Broadcast opt-ins
  email_broadcast_opt_in boolean default true,
  email_emergency_opt_in boolean default true,
  sms_phone text,
  sms_phone_verified boolean default false,
  sms_broadcast_opt_in boolean default false,
  sms_emergency_opt_in boolean default false,
  created_at timestamptz default now()
);

------------------------------------------------------------------------------
-- Documents library
------------------------------------------------------------------------------

create table documents (
  id uuid primary key default gen_random_uuid(),
  folder text not null,
  title text not null,
  file_path text not null,
  file_type text,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz default now(),
  is_public boolean default false
);

create index on documents (folder);

------------------------------------------------------------------------------
-- Workflow: requests (trees, ARC, future)
------------------------------------------------------------------------------

create table requests (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'tree_hoa_removal',
    'tree_homeowner_permission',
    'arc_fence', 'arc_paint', 'arc_addition', 'arc_shed', 'arc_other'
  )),
  status text not null default 'submitted' check (status in (
    'submitted', 'under_review', 'inspection_scheduled',
    'needs_more_info', 'approved', 'denied', 'withdrawn'
  )),
  property_id uuid references properties(id),
  submitted_by uuid references auth.users(id),
  submitter_name text,
  submitter_email text,
  title text not null,
  description text not null,
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on requests (status);
create index on requests (property_id);
create index on requests (submitted_by);

------------------------------------------------------------------------------
-- Workflow: violations
------------------------------------------------------------------------------

create table violations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) not null,
  category text not null check (category in (
    'parking', 'landscaping', 'noise', 'trash',
    'architectural', 'pets', 'signs', 'other'
  )),
  description text not null,
  reported_by uuid references auth.users(id),
  reporter_name text,
  status text not null default 'pending_review' check (status in (
    'pending_review', 'dismissed',
    'warning_1', 'warning_2', 'final_notice',
    'fined', 'resolved'
  )),
  appeal_token text unique,
  appeal_response text,
  fine_amount numeric(10,2),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on violations (property_id);
create index on violations (status);

------------------------------------------------------------------------------
-- Shared: attachments (polymorphic), status events (timeline)
------------------------------------------------------------------------------

create table attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('request', 'violation')),
  entity_id uuid not null,
  file_path text not null,
  file_type text,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz default now()
);

create index on attachments (entity_type, entity_id);

create table status_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('request', 'violation')),
  entity_id uuid not null,
  actor_id uuid references auth.users(id),
  from_status text,
  to_status text,
  comment text,
  is_public boolean default true,
  created_at timestamptz default now()
);

create index on status_events (entity_type, entity_id);

------------------------------------------------------------------------------
-- Transactional notifications log
------------------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  to_email text not null,
  related_entity_type text,
  related_entity_id uuid,
  subject text,
  body_text text,
  resend_message_id text,
  status text default 'queued' check (status in ('queued', 'sent', 'failed', 'bounced')),
  error text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index on notifications (status);
create index on notifications (related_entity_type, related_entity_id);

------------------------------------------------------------------------------
-- HOA-wide broadcasts (email + SMS)
------------------------------------------------------------------------------

create table broadcasts (
  id uuid primary key default gen_random_uuid(),
  sent_by uuid references auth.users(id) not null,
  channels text[] not null,
  audience text not null default 'all_members',
  subject text,
  body text not null,
  is_emergency boolean default false,
  also_archive_as_announcement boolean default false,
  announcement_id uuid references announcements(id),
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create table broadcast_deliveries (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid references broadcasts(id) on delete cascade not null,
  recipient_user_id uuid references auth.users(id),
  recipient_email text,
  recipient_phone text,
  channel text not null check (channel in ('email', 'sms')),
  status text not null default 'queued' check (status in (
    'queued', 'sent', 'delivered', 'failed', 'bounced', 'opted_out'
  )),
  provider_message_id text,
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

create index on broadcast_deliveries (broadcast_id);
create index on broadcast_deliveries (recipient_user_id);
create index on broadcast_deliveries (status);

------------------------------------------------------------------------------
-- Audit log
------------------------------------------------------------------------------

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz default now()
);

create index on audit_log (entity_type, entity_id);
create index on audit_log (actor_id);
create index on audit_log (created_at desc);

------------------------------------------------------------------------------
-- updated_at triggers
------------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_updated_at before update on properties
  for each row execute function set_updated_at();
create trigger requests_updated_at before update on requests
  for each row execute function set_updated_at();
create trigger violations_updated_at before update on violations
  for each row execute function set_updated_at();
