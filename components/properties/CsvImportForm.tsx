"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  previewCsvAction,
  importCsvAction,
  type CsvImportState,
} from "@/lib/actions/properties";

function PreviewBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Parsing..." : "Preview"}
    </Button>
  );
}

export function CsvImportForm() {
  const router = useRouter();
  const [state, run] = useActionState<CsvImportState | undefined, FormData>(
    previewCsvAction,
    undefined
  );
  const [importing, startImport] = useTransition();
  const [csv, setCsv] = useState("");

  function handleConfirm() {
    if (!state?.preview?.rows) return;
    startImport(async () => {
      const res = await importCsvAction(JSON.stringify(state.preview!.rows));
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Imported ${res.imported ?? 0} properties.`);
        router.push("/admin/properties");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form action={run} className="space-y-3">
        <Textarea
          name="csv"
          rows={8}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="Paste CSV here..."
          className="font-mono text-xs"
        />
        {state?.error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {state.error}
          </p>
        )}
        <PreviewBtn />
      </form>

      {state?.preview && (
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-sm font-semibold">
                Preview ({state.preview.rows.length} rows)
              </h3>
              {state.preview.errors.length > 0 && (
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  {state.preview.errors.length} row(s) skipped.
                </p>
              )}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={importing || state.preview.rows.length === 0}
            >
              {importing
                ? "Importing..."
                : `Confirm import (${state.preview.rows.length})`}
            </Button>
          </div>

          {state.preview.errors.length > 0 && (
            <details className="rounded-md border bg-yellow-500/5 p-3 text-xs">
              <summary className="cursor-pointer font-medium">
                Skipped rows
              </summary>
              <ul className="mt-2 list-disc pl-4">
                {state.preview.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}

          {state.preview.rows.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Phone
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.preview.rows.slice(0, 50).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.address}</TableCell>
                      <TableCell>{r.homeowner_name ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {r.homeowner_email ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {r.homeowner_phone ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {state.preview.rows.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs italic text-muted-foreground">
                        ...and {state.preview.rows.length - 50} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
