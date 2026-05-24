import { Text, Section } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./_layout";
import {
  VIOLATION_CATEGORY_LABEL,
  type ViolationCategory,
} from "@/lib/workflow/violations";

export function ViolationResolvedEmail({
  homeownerName,
  address,
  category,
  comment,
}: {
  homeownerName: string | null;
  address: string;
  category: ViolationCategory;
  comment?: string;
}) {
  return (
    <EmailLayout
      preview={`Violation at ${address} marked resolved`}
      heading="Violation resolved"
    >
      <Section>
        <Text>Hello{homeownerName ? `, ${homeownerName}` : ""},</Text>
        <Text>
          The {VIOLATION_CATEGORY_LABEL[category].toLowerCase()} issue at{" "}
          <strong>{address}</strong> has been marked resolved. Thank you for
          your cooperation.
        </Text>
        {comment && (
          <Text style={{ whiteSpace: "pre-line", fontStyle: "italic" }}>
            Note from the board: {comment}
          </Text>
        )}
      </Section>
    </EmailLayout>
  );
}

export default ViolationResolvedEmail;
