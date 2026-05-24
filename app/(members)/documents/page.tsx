import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { FileText, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentDownloadButton } from "@/components/documents/DocumentDownloadButton";

export const metadata = { title: "Documents" };

const FOLDER_LABELS: Record<string, string> = {
  "meeting-minutes": "Meeting Minutes",
  newsletters: "Newsletters",
  "governing-docs": "Governing Documents & Policies",
};

export default async function DocumentsPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .order("uploaded_at", { ascending: false });

  const byFolder: Record<string, typeof documents> = {};
  for (const d of documents ?? []) {
    (byFolder[d.folder] ??= []).push(d);
  }

  const folderOrder = [
    "meeting-minutes",
    "newsletters",
    "governing-docs",
    ...Object.keys(byFolder).filter(
      (k) => !["meeting-minutes", "newsletters", "governing-docs"].includes(k)
    ),
  ].filter((k) => byFolder[k]?.length);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Document library
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Meeting minutes, newsletters, and governing documents. Downloads use
        short-lived signed links.
      </p>

      {folderOrder.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed bg-muted/30 p-16 text-center text-sm text-muted-foreground">
          <FolderOpen className="mx-auto h-8 w-8" />
          <p className="mt-3">No documents yet.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {folderOrder.map((folder) => (
            <Card key={folder}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  {FOLDER_LABELS[folder] ?? folder}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Uploaded
                      </TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byFolder[folder]!.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {d.title}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {d.file_type ?? "—"}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {format(new Date(d.uploaded_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DocumentDownloadButton id={d.id} title={d.title} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
