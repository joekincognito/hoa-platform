import { Text, Section } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./_layout";

export function RequestSubmittedEmail({
  submitterName,
  requestTitle,
  requestType,
  viewUrl,
}: {
  submitterName: string;
  requestTitle: string;
  requestType: string;
  viewUrl: string;
}) {
  return (
    <EmailLayout
      preview={`Your ${requestType} request was received`}
      heading="We received your request"
    >
      <Section>
        <Text>Hi {submitterName},</Text>
        <Text>
          Your request <strong>&ldquo;{requestTitle}&rdquo;</strong> has been
          submitted to the board for review. We&apos;ll email you when the
          status changes.
        </Text>
        <Text>
          You can check on it at any time:
          <br />
          <a href={viewUrl}>{viewUrl}</a>
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default RequestSubmittedEmail;
