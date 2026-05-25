import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { RequestTypeForm } from "@/components/admin/RequestTypeForm";
import {
  updateRequestTypeAction,
  type RequestTypeState,
} from "@/lib/actions/admin-request-types";

export const metadata = { title: "Edit request type | Admin" };

export default async function EditRequestTypePage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("request_types")
    .select("*")
    .eq("key", key)
    .maybeSingle();
  if (!t) notFound();

  async function action(
    state: RequestTypeState | undefined,
    fd: FormData
  ): Promise<RequestTypeState> {
    "use server";
    return updateRequestTypeAction(key, state, fd);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin/request-types" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Request types
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Edit request type</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestTypeForm
            action={action}
            initial={t}
            submitLabel="Save changes"
            lockKey
          />
        </CardContent>
      </Card>
    </div>
  );
}
