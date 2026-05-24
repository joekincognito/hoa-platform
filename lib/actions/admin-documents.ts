"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().trim().min(1, "Title required").max(300),
  folder: z.string().trim().min(1, "Folder required").max(80),
});

export type UploadState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) throw new Error("Not an admin");
  return { supabase, userId: user.id };
}

export async function uploadDocumentAction(
  _prev: UploadState | undefined,
  formData: FormData
): Promise<UploadState> {
  const parsed = Schema.safeParse({
    title: formData.get("title"),
    folder: formData.get("folder"),
  });
  if (!parsed.success) {
    const out: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "");
      if (k && !out[k]) out[k] = i.message;
    }
    return { ok: false, fieldErrors: out };
  }

  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "Pick a file to upload." };
  }
  if (file.size > 50 * 1024 * 1024) {
    return { ok: false, error: "File too large (50 MB max)." };
  }

  const { supabase, userId } = await requireAdmin();

  const safeFolder = parsed.data.folder
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const ts = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const path = `${safeFolder}/${ts}-${random}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: insErr } = await supabase.from("documents").insert({
    folder: safeFolder,
    title: parsed.data.title,
    file_path: path,
    file_type: ext.toUpperCase(),
    uploaded_by: userId,
  });
  if (insErr) {
    // Clean up the orphaned file if the row insert fails
    await supabase.storage.from("documents").remove([path]);
    return { ok: false, error: insErr.message };
  }

  revalidatePath("/admin/documents");
  revalidatePath("/documents");
  return { ok: true };
}

export async function deleteDocumentAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const { supabase } = await requireAdmin();

  // Look up the file path first so we can delete from storage too
  const { data: doc } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();

  if (doc?.file_path) {
    await supabase.storage.from("documents").remove([doc.file_path]);
  }
  await supabase.from("documents").delete().eq("id", id);

  revalidatePath("/admin/documents");
  revalidatePath("/documents");
}
