"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const PropertySchema = z.object({
  address: z.string().trim().min(1, "Address required").max(300),
  homeowner_name: z.string().trim().max(160).optional().or(z.literal("")),
  homeowner_email: z.string().trim().email("Valid email required").max(200).optional().or(z.literal("")),
  homeowner_phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type PropertyState = {
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
  return supabase;
}

function parsePayload(formData: FormData) {
  return PropertySchema.safeParse({
    address: formData.get("address"),
    homeowner_name: formData.get("homeowner_name") ?? "",
    homeowner_email: formData.get("homeowner_email") ?? "",
    homeowner_phone: formData.get("homeowner_phone") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

function toRow(d: z.infer<typeof PropertySchema>) {
  return {
    address: d.address,
    homeowner_name: d.homeowner_name || null,
    homeowner_email: d.homeowner_email || null,
    homeowner_phone: d.homeowner_phone || null,
    notes: d.notes || null,
  };
}

export async function createPropertyAction(
  _prev: PropertyState | undefined,
  formData: FormData
): Promise<PropertyState> {
  const parsed = parsePayload(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0]), i.message])
      ),
    };
  }
  const supabase = await requireAdmin();
  const { error } = await supabase.from("properties").insert(toRow(parsed.data));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/properties");
  return { ok: true };
}

export async function updatePropertyAction(
  id: string,
  _prev: PropertyState | undefined,
  formData: FormData
): Promise<PropertyState> {
  const parsed = parsePayload(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0]), i.message])
      ),
    };
  }
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("properties")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/properties");
  return { ok: true };
}

export async function deletePropertyAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await requireAdmin();
  await supabase.from("properties").delete().eq("id", id);
  revalidatePath("/admin/properties");
}

// ----------------------- CSV import ----------------------------------------

const CSVSchema = z.object({
  csv: z.string().trim().min(1, "Paste your CSV first."),
});

export type CsvImportState = {
  preview?: {
    rows: Array<{
      address: string;
      homeowner_name?: string;
      homeowner_email?: string;
      homeowner_phone?: string;
      notes?: string;
    }>;
    errors: string[];
  };
  imported?: number;
  error?: string;
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(input: string) {
  const lines = input.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] as string[][] };
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map(splitCsvLine);
  return { headers, rows };
}

const FIELD_ALIASES: Record<string, keyof z.infer<typeof PropertySchema>> = {
  address: "address",
  street: "address",
  "street address": "address",
  name: "homeowner_name",
  homeowner: "homeowner_name",
  "homeowner name": "homeowner_name",
  owner: "homeowner_name",
  email: "homeowner_email",
  "homeowner email": "homeowner_email",
  phone: "homeowner_phone",
  "homeowner phone": "homeowner_phone",
  notes: "notes",
};

export async function previewCsvAction(
  _prev: CsvImportState | undefined,
  formData: FormData
): Promise<CsvImportState> {
  const parsed = CSVSchema.safeParse({ csv: formData.get("csv") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { headers, rows } = parseCsv(parsed.data.csv);
  if (!headers.includes("address") && !headers.includes("street") && !headers.includes("street address")) {
    return { error: "CSV must include an 'address' column (first row of headers)." };
  }

  const errors: string[] = [];
  const preview: NonNullable<CsvImportState["preview"]>["rows"] = [];

  for (const [i, row] of rows.entries()) {
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const target = FIELD_ALIASES[headers[j]];
      if (target) obj[target] = row[j] ?? "";
    }
    const v = PropertySchema.safeParse({
      address: obj.address ?? "",
      homeowner_name: obj.homeowner_name ?? "",
      homeowner_email: obj.homeowner_email ?? "",
      homeowner_phone: obj.homeowner_phone ?? "",
      notes: obj.notes ?? "",
    });
    if (!v.success) {
      errors.push(`Row ${i + 2}: ${v.error.issues.map((x) => x.message).join("; ")}`);
      continue;
    }
    preview.push({
      address: v.data.address,
      homeowner_name: v.data.homeowner_name || undefined,
      homeowner_email: v.data.homeowner_email || undefined,
      homeowner_phone: v.data.homeowner_phone || undefined,
      notes: v.data.notes || undefined,
    });
  }

  return { preview: { rows: preview, errors } };
}

export async function importCsvAction(rowsJson: string): Promise<CsvImportState> {
  let rows: NonNullable<CsvImportState["preview"]>["rows"];
  try {
    rows = JSON.parse(rowsJson);
  } catch {
    return { error: "Couldn't parse preview payload." };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "Nothing to import." };
  }
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("properties")
    .upsert(
      rows.map((r) => ({
        address: r.address,
        homeowner_name: r.homeowner_name ?? null,
        homeowner_email: r.homeowner_email ?? null,
        homeowner_phone: r.homeowner_phone ?? null,
        notes: r.notes ?? null,
      })),
      { onConflict: "address" }
    );

  if (error) return { error: error.message };
  revalidatePath("/admin/properties");
  return { imported: rows.length };
}
