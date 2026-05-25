"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  updateProfileAction,
  type ProfileState,
} from "@/lib/actions/profile";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

type Profile = {
  full_name: string | null;
  address: string | null;
  phone: string | null;
  sms_phone: string | null;
  sms_phone_verified: boolean | null;
  show_in_directory: boolean | null;
  directory_show_phone: boolean | null;
  directory_show_email: boolean | null;
  directory_show_address: boolean | null;
  email_broadcast_opt_in: boolean | null;
  email_emergency_opt_in: boolean | null;
  sms_broadcast_opt_in: boolean | null;
  sms_emergency_opt_in: boolean | null;
};

function Check({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border bg-card p-3 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded border-input"
      />
      <span>
        <span className="font-medium">{label}</span>
        {hint && (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        )}
      </span>
    </label>
  );
}

export function ProfileForm({ initial }: { initial: Profile | null }) {
  const [state, action] = useActionState<ProfileState | undefined, FormData>(
    updateProfileAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok) toast.success("Profile saved.");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="full_name">
              Full name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={initial?.full_name ?? ""}
              required
              maxLength={120}
              className="mt-1"
            />
            {state?.fieldErrors?.full_name && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.full_name}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">
              Home address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              name="address"
              required
              defaultValue={initial?.address ?? ""}
              maxLength={300}
              placeholder="123 Main Street"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              If your address matches our property registry, your account
              auto-links to that property.
            </p>
            {state?.fieldErrors?.address && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.address}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone (display)</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initial?.phone ?? ""}
              maxLength={40}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resident directory</CardTitle>
          <p className="text-sm text-muted-foreground">
            The directory is only visible to approved members. You control
            exactly which of your fields appear.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Check
            name="show_in_directory"
            label="List me in the resident directory"
            defaultChecked={!!initial?.show_in_directory}
          />
          <Separator />
          <p className="text-xs text-muted-foreground">
            If listed, show these fields:
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Check
              name="directory_show_address"
              label="Address"
              defaultChecked={initial?.directory_show_address ?? true}
            />
            <Check
              name="directory_show_phone"
              label="Phone"
              defaultChecked={!!initial?.directory_show_phone}
            />
            <Check
              name="directory_show_email"
              label="Email"
              defaultChecked={!!initial?.directory_show_email}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HOA notifications</CardTitle>
          <p className="text-sm text-muted-foreground">
            Email notifications about community events and emergencies. SMS
            requires a verified phone number and is opt-in only.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Email</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Check
                name="email_broadcast_opt_in"
                label="General announcements"
                defaultChecked={initial?.email_broadcast_opt_in ?? true}
              />
              <Check
                name="email_emergency_opt_in"
                label="Emergency alerts"
                hint="Recommended"
                defaultChecked={initial?.email_emergency_opt_in ?? true}
              />
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold">SMS</h3>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sms_phone">SMS phone number</Label>
                <Input
                  id="sms_phone"
                  name="sms_phone"
                  defaultValue={initial?.sms_phone ?? ""}
                  placeholder="+1 555 555 5555"
                  maxLength={40}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  US numbers in E.164 format.{" "}
                  {initial?.sms_phone_verified ? (
                    <span className="text-green-600">Verified.</span>
                  ) : (
                    <span>
                      Verification will be required before any SMS is sent
                      (coming soon).
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Check
                name="sms_broadcast_opt_in"
                label="General SMS alerts"
                hint="Off by default"
                defaultChecked={!!initial?.sms_broadcast_opt_in}
              />
              <Check
                name="sms_emergency_opt_in"
                label="Emergency SMS alerts"
                hint="Off by default; not a 911 substitute"
                defaultChecked={!!initial?.sms_emergency_opt_in}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
