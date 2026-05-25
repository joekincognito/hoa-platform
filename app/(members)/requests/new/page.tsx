import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { NewRequestForm } from "@/components/requests/NewRequestForm";
import type { RequestTypeRow } from "@/lib/workflow/requests";

export const metadata = { title: "Submit a request" };

export default async function NewRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: types }] = await Promise.all([
    supabase
      .from("profiles")
      .select("address")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("request_types")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/my-requests" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> My requests
      </Button>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Submit a request</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit a request to the board. You&apos;ll be emailed when the
            status changes.
          </p>
        </CardHeader>
        <CardContent>
          <NewRequestForm
            defaultAddress={profile?.address ?? ""}
            types={(types ?? []) as RequestTypeRow[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
