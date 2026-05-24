import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportViolationForm } from "@/components/violations/ReportViolationForm";

export const metadata = { title: "Report a violation" };

export default function ReportViolationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/my-violations" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> My violations
      </Button>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Report a violation</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit a possible HOA violation to the board. Reports are
            reviewed before any warning is issued. Provide enough context that
            the board can verify the issue.
          </p>
        </CardHeader>
        <CardContent>
          <ReportViolationForm />
        </CardContent>
      </Card>
    </div>
  );
}
