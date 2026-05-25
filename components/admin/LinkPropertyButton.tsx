"use client";

import { useState, useTransition } from "react";
import { Building2, Search, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { linkMemberPropertyAction } from "@/lib/actions/admin-members";

type Property = {
  id: string;
  address: string;
  isLinkedElsewhere: boolean;
};

export function LinkPropertyButton({
  userId,
  currentPropertyId,
  currentPropertyAddress,
  properties,
}: {
  userId: string;
  currentPropertyId: string | null;
  currentPropertyAddress: string | null;
  properties: Property[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  function setProperty(propertyId: string | null) {
    start(async () => {
      const fd = new FormData();
      fd.set("user_id", userId);
      if (propertyId) fd.set("property_id", propertyId);
      await linkMemberPropertyAction(fd);
      toast.success(
        propertyId ? "Linked to property." : "Property link removed."
      );
      setOpen(false);
    });
  }

  const filtered = properties.filter((p) =>
    p.address.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Building2 className="mr-1 h-3.5 w-3.5" />
            {currentPropertyAddress
              ? "Re-link property"
              : "Link to property"}
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link member to a property</DialogTitle>
        </DialogHeader>

        {currentPropertyAddress && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Currently linked to</p>
            <p className="mt-1 font-medium">{currentPropertyAddress}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setProperty(null)}
              disabled={pending}
            >
              <Unlink className="mr-2 h-3.5 w-3.5" /> Unlink
            </Button>
          </div>
        )}

        <div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted-foreground">
                {properties.length === 0
                  ? "No properties in the registry yet. Add some at /admin/properties."
                  : "No properties match your search."}
              </li>
            ) : (
              filtered.map((p) => {
                const isCurrent = p.id === currentPropertyId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setProperty(p.id)}
                      disabled={pending || isCurrent}
                      className="flex w-full items-center justify-between rounded-md border bg-card p-3 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      <span className="font-medium">{p.address}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {isCurrent
                          ? "(current)"
                          : p.isLinkedElsewhere
                            ? "(linked to another member — will move)"
                            : ""}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
