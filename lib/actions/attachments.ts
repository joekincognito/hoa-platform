"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Signed URL for a polymorphic attachment. RLS on the attachments table
 * gates which rows the viewer can see; Storage then gets a 60s signed URL.
 */
export async function getAttachmentSignedUrl(
  attachmentId: string
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in." };

  const { data: att, error } = await supabase
    .from("attachments")
    .select("file_path")
    .eq("id", attachmentId)
    .maybeSingle();
  if (error || !att) return { error: "Attachment not found." };

  const { data: signed, error: sErr } = await supabase.storage
    .from("attachments")
    .createSignedUrl(att.file_path, 60);
  if (sErr || !signed?.signedUrl) return { error: "Couldn't generate URL." };

  return { url: signed.signedUrl };
}
