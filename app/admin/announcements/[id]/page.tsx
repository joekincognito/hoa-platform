import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import {
  updateAnnouncementAction,
  type AnnouncementState,
} from "@/lib/actions/admin-announcements";

export const metadata = { title: "Edit announcement | Admin" };

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: a } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!a) notFound();

  async function action(
    state: AnnouncementState | undefined,
    fd: FormData
  ): Promise<AnnouncementState> {
    "use server";
    return updateAnnouncementAction(id, state, fd);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin/announcements" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Announcements
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Edit announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm
            action={action}
            initial={a}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
