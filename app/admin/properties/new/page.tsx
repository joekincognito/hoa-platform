import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { createPropertyAction } from "@/lib/actions/properties";

export const metadata = { title: "Add property | Admin" };

export default function NewPropertyPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin/properties" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Properties
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Add a property</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm action={createPropertyAction} submitLabel="Add property" />
        </CardContent>
      </Card>
    </div>
  );
}
