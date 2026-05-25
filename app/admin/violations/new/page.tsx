import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { AdminCreateViolationForm } from "@/components/violations/AdminCreateViolationForm";

export const metadata = { title: "New violation | Admin" };

export default async function NewViolationPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, address, homeowner_name, homeowner_email")
    .order("address", { ascending: true });

  return (
    <div className="max-w-3xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin/violations" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> All violations
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Record a violation</CardTitle>
          <p className="text-sm text-muted-foreground">
            Direct admin entry — bypasses the member-report flow. Stays in
            pending_review until you escalate.
          </p>
        </CardHeader>
        <CardContent>
          <AdminCreateViolationForm properties={properties ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
