import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { updatePropertyAction, type PropertyState } from "@/lib/actions/properties";

export const metadata = { title: "Edit property | Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function EditPropertyPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!property) notFound();

  async function action(
    state: PropertyState | undefined,
    fd: FormData
  ): Promise<PropertyState> {
    "use server";
    return updatePropertyAction(id, state, fd);
  }

  return (
    <div className="max-w-2xl space-y-6">
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
          <CardTitle>Edit property</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm
            action={action}
            initial={property}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
