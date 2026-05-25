-- Extend handle_new_user trigger to pull address from auth.users.raw_user_meta_data
-- AND auto-link the profile to a matching property in the registry if one exists.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_address text;
  v_matched_property_id uuid;
begin
  v_full_name := new.raw_user_meta_data->>'full_name';
  v_address := new.raw_user_meta_data->>'address';

  -- Case-insensitive match against the property registry. Properties.address
  -- is unique so at most one row matches.
  if v_address is not null and length(trim(v_address)) > 0 then
    select id into v_matched_property_id
    from public.properties
    where lower(address) = lower(trim(v_address))
    limit 1;
  end if;

  insert into public.profiles (id, full_name, address, property_id)
  values (
    new.id,
    v_full_name,
    nullif(trim(coalesce(v_address, '')), ''),
    v_matched_property_id
  )
  on conflict (id) do nothing;

  if v_matched_property_id is not null then
    update public.properties
    set linked_user_id = new.id
    where id = v_matched_property_id;
  end if;

  return new;
end;
$$;
