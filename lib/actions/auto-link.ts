"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Best-effort link a user's profile to a property in the registry by address.
 * Case-insensitive exact match. Silent no-op if there's no matching property
 * — users can have an address without being in the registry.
 *
 * If the user is already linked to a different property, this WILL overwrite
 * the link (assumption: the user moved).
 */
export async function autoLinkProfileToProperty(
  userId: string,
  address: string | null
): Promise<{ linked: boolean; propertyId?: string }> {
  if (!address || !address.trim()) return { linked: false };

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Find a property with a case-insensitive exact match
  const { data: match } = await admin
    .from("properties")
    .select("id")
    .ilike("address", address.trim())
    .maybeSingle();

  if (!match) return { linked: false };

  // Clear any other profile previously linked to this property
  await admin
    .from("profiles")
    .update({ property_id: null })
    .eq("property_id", match.id)
    .neq("id", userId);

  // Clear the user's prior property linkage if it pointed somewhere else
  const { data: prior } = await admin
    .from("profiles")
    .select("property_id")
    .eq("id", userId)
    .maybeSingle();
  if (prior?.property_id && prior.property_id !== match.id) {
    await admin
      .from("properties")
      .update({ linked_user_id: null })
      .eq("id", prior.property_id);
  }

  // Set both sides
  await admin
    .from("profiles")
    .update({ property_id: match.id })
    .eq("id", userId);
  await admin
    .from("properties")
    .update({ linked_user_id: userId })
    .eq("id", match.id);

  return { linked: true, propertyId: match.id };
}
