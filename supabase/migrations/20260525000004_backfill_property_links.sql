-- One-time backfill: for any profile that has an address but no property_id,
-- try to link it to a matching property in the registry. Mirrors the logic
-- that runs at signup-time + profile-edit-time, just retroactively.

do $$
declare
  v_profile_id uuid;
  v_property_id uuid;
  v_address text;
begin
  for v_profile_id, v_address in
    select id, address
    from public.profiles
    where address is not null
      and trim(address) <> ''
      and property_id is null
  loop
    select id into v_property_id
    from public.properties
    where lower(address) = lower(trim(v_address))
      and (linked_user_id is null or linked_user_id = v_profile_id)
    limit 1;

    if v_property_id is not null then
      update public.profiles
      set property_id = v_property_id
      where id = v_profile_id;

      update public.properties
      set linked_user_id = v_profile_id
      where id = v_property_id;
    end if;
  end loop;
end
$$;
