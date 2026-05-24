import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvImportForm } from "@/components/properties/CsvImportForm";

export const metadata = { title: "Import CSV | Admin" };

export default function ImportPropertiesPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin/properties" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Properties
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Bulk import properties from CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Paste a CSV below. The first row must be column headers. Required
            column: <code>address</code>. Optional columns:{" "}
            <code>homeowner_name</code>, <code>homeowner_email</code>,{" "}
            <code>homeowner_phone</code>, <code>notes</code>. Rows are upserted
            by <code>address</code> — re-importing updates existing rows
            instead of duplicating them.
          </p>
          <pre className="rounded-md bg-muted p-3 text-xs">
{`address,homeowner_name,homeowner_email,homeowner_phone
"123 Maple Ln","Jane Smith","jane@example.com","555-555-0101"
"125 Maple Ln","John Doe","john@example.com",`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <CsvImportForm />
        </CardContent>
      </Card>
    </div>
  );
}
