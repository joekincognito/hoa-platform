"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadDocumentAction,
  type UploadState,
} from "@/lib/actions/admin-documents";

const FOLDERS = [
  { id: "meeting-minutes", label: "Meeting Minutes" },
  { id: "newsletters", label: "Newsletters" },
  { id: "governing-docs", label: "Governing Documents & Policies" },
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Uploading..." : "Upload"}
    </Button>
  );
}

export function UploadDocumentForm() {
  const [state, run] = useActionState<UploadState | undefined, FormData>(
    uploadDocumentAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [folder, setFolder] = useState(FOLDERS[0].id);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Uploaded.");
      formRef.current?.reset();
      setFolder(FOLDERS[0].id);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={run} className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={300}
          className="mt-1"
          placeholder="January 2026 minutes"
        />
        {state?.fieldErrors?.title && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.title}
          </p>
        )}
      </div>
      <div>
        <Label>Folder</Label>
        <input type="hidden" name="folder" value={folder} />
        <Select
          value={folder}
          onValueChange={(v) => v && setFolder(v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOLDERS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="file">
          File <span className="text-destructive">*</span>
        </Label>
        <Input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">50 MB max.</p>
      </div>
      <div className="sm:col-span-3 flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
