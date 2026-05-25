-- Storage RLS for documents + attachments buckets.
--
-- Without these, only the service_role can manage storage objects;
-- the anon/authenticated client used by Server Actions gets RLS denials.

-- ===========================================================================
-- documents bucket
-- ===========================================================================
-- Admin: full CRUD
-- Approved members: SELECT (so client-side signed-URL minting works)
-- Public/anon: no access

create policy "documents: admins insert"
  on storage.objects for insert
  with check (bucket_id = 'documents' and public.is_admin(auth.uid()));

create policy "documents: admins update"
  on storage.objects for update
  using (bucket_id = 'documents' and public.is_admin(auth.uid()))
  with check (bucket_id = 'documents' and public.is_admin(auth.uid()));

create policy "documents: admins delete"
  on storage.objects for delete
  using (bucket_id = 'documents' and public.is_admin(auth.uid()));

create policy "documents: approved members read"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (public.is_approved_member(auth.uid()) or public.is_admin(auth.uid()))
  );

-- ===========================================================================
-- attachments bucket
-- ===========================================================================
-- Authenticated users: INSERT (for their own request/violation photos).
-- Authenticated users: SELECT (signed URLs are unguessable + the
--   attachments table row RLS controls who knows the path).
-- Admins: full management.

create policy "attachments: authenticated insert"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments' and auth.uid() is not null
  );

create policy "attachments: authenticated read"
  on storage.objects for select
  using (
    bucket_id = 'attachments' and auth.uid() is not null
  );

create policy "attachments: admins manage"
  on storage.objects for all
  using (bucket_id = 'attachments' and public.is_admin(auth.uid()))
  with check (bucket_id = 'attachments' and public.is_admin(auth.uid()));
