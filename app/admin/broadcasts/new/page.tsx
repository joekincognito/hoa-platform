import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BroadcastComposer } from "@/components/broadcasts/BroadcastComposer";
import { siteConfig } from "@/siteConfig";

export const metadata = { title: "New broadcast | Admin" };

export default function NewBroadcastPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin/broadcasts" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Broadcasts
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Send a broadcast</CardTitle>
          <p className="text-sm text-muted-foreground">
            Messages go to all approved members who have opted in to the
            selected channels. Emergency broadcasts use a separate opt-in.
          </p>
        </CardHeader>
        <CardContent>
          <BroadcastComposer smsEnabled={siteConfig.features.smsEnabled} />
        </CardContent>
      </Card>
    </div>
  );
}
