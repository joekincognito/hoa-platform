import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import { createAnnouncementAction } from "@/lib/actions/admin-announcements";

export const metadata = { title: "New announcement | Admin" };

export default function NewAnnouncementPage() {
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
          <CardTitle>New announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm
            action={createAnnouncementAction}
            submitLabel="Publish"
          />
        </CardContent>
      </Card>
    </div>
  );
}
