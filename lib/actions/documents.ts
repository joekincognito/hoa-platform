"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Issue a short-lived signed URL for a document.
 * RLS on documents enforces who can read which rows; once the row is
 * accessible the user gets a 60-second download URL for the underlying file.
 */
export async function getDocumentSignedUrl(
  documentId: string
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in." };

  const { data: doc, error } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !doc) return { error: "Document not found or not accessible." };

  const { data: signed, error: sErr } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 60);

  if (sErr || !signed?.signedUrl) {
    return { error: "Couldn't generate download URL." };
  }

  return { url: signed.signedUrl };
}
