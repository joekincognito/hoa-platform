"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { getAttachmentSignedUrl } from "@/lib/actions/attachments";

export function AttachmentLink({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const [pending, start] = useTransition();

  function open() {
    start(async () => {
      const res = await getAttachmentSignedUrl(id);
      if (res.error || !res.url) {
        toast.error(res.error ?? "Couldn't open attachment");
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <button
      onClick={open}
      disabled={pending}
      className="text-sm underline hover:text-foreground disabled:opacity-50"
    >
      {pending ? "Opening..." : label}
    </button>
  );
}
