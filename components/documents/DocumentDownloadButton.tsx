"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDocumentSignedUrl } from "@/lib/actions/documents";

export function DocumentDownloadButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [pending, start] = useTransition();

  function handleClick() {
    start(async () => {
      const { url, error } = await getDocumentSignedUrl(id);
      if (error || !url) {
        toast.error(error ?? `Couldn't open ${title}`);
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-3.5 w-3.5" />
      {pending ? "Opening..." : "Open"}
    </Button>
  );
}
