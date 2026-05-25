import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestTypeForm } from "@/components/admin/RequestTypeForm";
import { createRequestTypeAction } from "@/lib/actions/admin-request-types";

export const metadata = { title: "New request type | Admin" };

export default function NewRequestTypePage() {
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
          <CardTitle>New request type</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestTypeForm
            action={createRequestTypeAction}
            submitLabel="Create type"
          />
        </CardContent>
      </Card>
    </div>
  );
}
