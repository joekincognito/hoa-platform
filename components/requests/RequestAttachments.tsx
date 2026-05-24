import { Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AttachmentLink } from "./AttachmentLink";

export async function RequestAttachments({
  requestId,
}: {
  requestId: string;
}) {
  const supabase = await createClient();
  const { data: attachments } = await supabase
    .from("attachments")
    .select("id, file_path, file_type, uploaded_at")
    .eq("entity_type", "request")
    .eq("entity_id", requestId)
    .order("uploaded_at", { ascending: true });

  if (!attachments || attachments.length === 0) {
    return (
      <div>
        <p className="font-medium">Attachments</p>
        <p className="mt-1 text-muted-foreground">No attachments.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-medium">Attachments</p>
      <ul className="mt-2 space-y-1">
        {attachments.map((a) => {
          const name = a.file_path.split("/").pop() ?? a.file_path;
          return (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              <AttachmentLink id={a.id} label={name} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
