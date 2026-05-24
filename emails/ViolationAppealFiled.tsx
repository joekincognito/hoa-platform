import { Text, Section, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./_layout";

export function ViolationAppealFiledEmail({
  address,
  fromName,
  body,
  adminUrl,
}: {
  address: string;
  fromName: string | null;
  body: string;
  adminUrl: string;
}) {
  return (
    <EmailLayout
      preview={`Appeal/response filed for ${address}`}
      heading="A homeowner has responded to a violation"
    >
      <Section>
        <Text>
          A response has been filed for the violation at{" "}
          <strong>{address}</strong>.
        </Text>
        {fromName && (
          <Text>
            <strong>From:</strong> {fromName}
          </Text>
        )}
        <Hr style={{ borderColor: "#e5e5e5", margin: "16px 0" }} />
        <Text style={{ whiteSpace: "pre-line" }}>{body}</Text>
        <Text>
          View in admin: <a href={adminUrl}>{adminUrl}</a>
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ViolationAppealFiledEmail;
