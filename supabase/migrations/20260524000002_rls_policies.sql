-- HOA Platform — Row Level Security policies
-- Helper-first approach: a single is_admin() function + an is_approved() function
-- keep policy bodies short and consistent.

------------------------------------------------------------------------------
-- Helper functions
------------------------------------------------------------------------------

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = uid), false);
$$;

create or replace function public.is_approved_member(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_approved from profiles where id = uid), false);
$$;

------------------------------------------------------------------------------
-- Enable RLS on all tables
------------------------------------------------------------------------------

alter table events enable row level security;
alter table announcements enable row level security;
alter table board_members enable row level security;
alter table contact_submissions enable row level security;
alter table profiles enable row level security;
alter table properties enable row level security;
alter table documents enable row level security;
alter table requests enable row level security;
alter table violations enable row level security;
alter table attachments enable row level security;
alter table status_events enable row level security;
alter table notifications enable row level security;
alter table broadcasts enable row level security;
alter table broadcast_deliveries enable row level security;
alter table audit_log enable row level security;

------------------------------------------------------------------------------
-- Public-read content
------------------------------------------------------------------------------

create policy "events public read" on events
  for select using (is_published = true);
create policy "events admin write" on events
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "announcements public read" on announcements
  for select using (is_active = true);
create policy "announcements admin write" on announcements
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "board_members public read" on board_members
  for select using (is_active = true);
create policy "board_members admin write" on board_members
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

------------------------------------------------------------------------------
-- Contact submissions: anyone inserts; only admins read
------------------------------------------------------------------------------

create policy "contact public insert" on contact_submissions
  for insert with check (true);
create policy "contact admin read" on contact_submissions
  for select using (is_admin(auth.uid()));
create policy "contact admin update" on contact_submissions
  for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

------------------------------------------------------------------------------
-- Profiles
--  - Users read/update their own row
--  - Approved members can read directory-opted-in profiles (per-field visibility
--    enforced via a view in a later migration)
--  - Admins read/write all
------------------------------------------------------------------------------

create policy "profiles self read" on profiles
  for select using (auth.uid() = id);
create policy "profiles self update" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles self insert" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles admin read" on profiles
  for select using (is_admin(auth.uid()));
create policy "profiles admin write" on profiles
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "profiles directory read" on profiles
  for select using (
    show_in_directory = true and is_approved_member(auth.uid())
  );

------------------------------------------------------------------------------
-- Properties: admins write; approved members read
------------------------------------------------------------------------------

create policy "properties members read" on properties
  for select using (is_approved_member(auth.uid()));
create policy "properties admin write" on properties
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

------------------------------------------------------------------------------
-- Documents: approved members read; admins write
------------------------------------------------------------------------------

create policy "documents members read" on documents
  for select using (is_approved_member(auth.uid()) or is_public = true);
create policy "documents admin write" on documents
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

------------------------------------------------------------------------------
-- Requests: submitters read own; admins read/write all
------------------------------------------------------------------------------

create policy "requests submitter read" on requests
  for select using (auth.uid() = submitted_by);
create policy "requests submitter insert" on requests
  for insert with check (auth.uid() = submitted_by and is_approved_member(auth.uid()));
create policy "requests admin read" on requests
  for select using (is_admin(auth.uid()));
create policy "requests admin write" on requests
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

------------------------------------------------------------------------------
-- Violations: reporter reads own; affected homeowner reads via property link;
-- admins full access
------------------------------------------------------------------------------

create policy "violations reporter read" on violations
  for select using (auth.uid() = reported_by);
create policy "violations homeowner read" on violations
  for select using (
    property_id in (
      select id from properties where linked_user_id = auth.uid()
    )
  );
create policy "violations member insert" on violations
  for insert with check (
    auth.uid() = reported_by and is_approved_member(auth.uid())
  );
create policy "violations admin read" on violations
  for select using (is_admin(auth.uid()));
create policy "violations admin write" on violations
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

------------------------------------------------------------------------------
-- Attachments: tied to parent's access. Lookup helpers below.
------------------------------------------------------------------------------

create or replace function public.can_read_entity(p_entity_type text, p_entity_id uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare allowed boolean := false;
begin
  if is_admin(auth.uid()) then return true; end if;

  if p_entity_type = 'request' then
    select true into allowed from requests
      where id = p_entity_id and submitted_by = auth.uid();
  elsif p_entity_type = 'violation' then
    select true into allowed from violations
      where id = p_entity_id
        and (reported_by = auth.uid()
             or property_id in (select id from properties where linked_user_id = auth.uid()));
  end if;

  return coalesce(allowed, false);
end;
$$;

create policy "attachments read" on attachments
  for select using (can_read_entity(entity_type, entity_id));
create policy "attachments insert" on attachments
  for insert with check (can_read_entity(entity_type, entity_id) or is_admin(auth.uid()));
create policy "attachments admin write" on attachments
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

------------------------------------------------------------------------------
-- Status events
------------------------------------------------------------------------------

create policy "status_events read" on status_events
  for select using (
    can_read_entity(entity_type, entity_id)
    and (is_public = true or is_admin(auth.uid()))
  );
create policy "status_events admin write" on status_events
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

------------------------------------------------------------------------------
-- Notifications + audit log: admins only
------------------------------------------------------------------------------

create policy "notifications admin" on notifications
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "audit_log admin" on audit_log
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

------------------------------------------------------------------------------
-- Broadcasts: admins write; recipients read their own
------------------------------------------------------------------------------

create policy "broadcasts admin" on broadcasts
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "broadcasts recipient read" on broadcasts
  for select using (
    id in (
      select broadcast_id from broadcast_deliveries
      where recipient_user_id = auth.uid()
    )
  );

create policy "broadcast_deliveries admin" on broadcast_deliveries
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "broadcast_deliveries self read" on broadcast_deliveries
  for select using (recipient_user_id = auth.uid());
