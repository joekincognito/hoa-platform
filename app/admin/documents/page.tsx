import { format } from "date-fns";
import { FolderOpen, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UploadDocumentForm } from "@/components/documents/UploadDocumentForm";
import { deleteDocumentAction } from "@/lib/actions/admin-documents";

export const metadata = { title: "Documents | Admin" };

const FOLDER_LABELS: Record<string, string> = {
  "meeting-minutes": "Meeting Minutes",
  newsletters: "Newsletters",
  "governing-docs": "Governing Documents & Policies",
};

export default async function DocumentsAdminPage() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .order("uploaded_at", { ascending: false });

  const byFolder: Record<string, typeof documents> = {};
  for (const d of documents ?? []) (byFolder[d.folder] ??= []).push(d);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Documents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload meeting minutes, newsletters, governing documents. Files are
          stored privately; members get short-lived signed URLs on the
          /documents page.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadDocumentForm />
        </CardContent>
      </Card>

      {Object.keys(byFolder).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(byFolder).map(([folder, files]) => (
            <Card key={folder}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  {FOLDER_LABELS[folder] ?? folder}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {files!.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Uploaded
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files!.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {d.title}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {d.file_path}
                          </p>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                          {d.file_type ?? "—"}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                          {format(new Date(d.uploaded_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <form action={deleteDocumentAction}>
                            <input type="hidden" name="id" value={d.id} />
                            <Button
                              size="sm"
                              variant="destructive"
                              type="submit"
                            >
                              Delete
                            </Button>
                          </form>
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
