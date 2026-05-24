import { Text, Section } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./_layout";

const STATUS_LABEL: Record<string, string> = {
  submitted: "submitted",
  under_review: "under review",
  inspection_scheduled: "inspection scheduled",
  needs_more_info: "awaiting more info",
  approved: "approved",
  denied: "denied",
  withdrawn: "withdrawn",
};

export function RequestStatusChangeEmail({
  submitterName,
  requestTitle,
  newStatus,
  comment,
  viewUrl,
}: {
  submitterName: string;
  requestTitle: string;
  newStatus: string;
  comment?: string;
  viewUrl: string;
}) {
  const label = STATUS_LABEL[newStatus] ?? newStatus;
  return (
    <EmailLayout
      preview={`Your request is now ${label}`}
      heading={`Status update: ${label}`}
    >
      <Section>
        <Text>Hi {submitterName},</Text>
        <Text>
          Your request <strong>&ldquo;{requestTitle}&rdquo;</strong> is now{" "}
          <strong>{label}</strong>.
        </Text>
        {comment && (
          <Text style={{ whiteSpace: "pre-line", fontStyle: "italic" }}>
            Note from the board: {comment}
          </Text>
        )}
        <Text>
          View the full timeline:
          <br />
          <a href={viewUrl}>{viewUrl}</a>
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default RequestStatusChangeEmail;
