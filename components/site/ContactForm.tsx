"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm, type ContactActionState } from "@/lib/actions/contact";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Sending..." : "Send message"}
    </Button>
  );
}

export function ContactForm() {
  const [state, action] = useActionState<ContactActionState | undefined, FormData>(
    submitContactForm,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Thanks — your message was sent.");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="first_name" className="text-neutral-200">
            First name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="first_name"
            name="first_name"
            required
            maxLength={80}
            className="mt-1 bg-neutral-800/60 border-neutral-700 text-white placeholder:text-neutral-500"
          />
          {state?.fieldErrors?.first_name && (
            <p className="mt-1 text-xs text-red-400">
              {state.fieldErrors.first_name}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="last_name" className="text-neutral-200">
            Last name
          </Label>
          <Input
            id="last_name"
            name="last_name"
            maxLength={80}
            className="mt-1 bg-neutral-800/60 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email" className="text-neutral-200">
          Email <span className="text-red-400">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          className="mt-1 bg-neutral-800/60 border-neutral-700 text-white placeholder:text-neutral-500"
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.email}</p>
        )}
      </div>
      <div>
        <Label htmlFor="message" className="text-neutral-200">
          Message <span className="text-red-400">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={5}
          maxLength={5000}
          rows={4}
          className="mt-1 bg-neutral-800/60 border-neutral-700 text-white placeholder:text-neutral-500"
        />
        {state?.fieldErrors?.message && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.message}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
