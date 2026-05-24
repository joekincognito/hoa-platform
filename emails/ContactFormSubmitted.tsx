import { Text, Section, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./_layout";

export function ContactFormSubmittedEmail({
  firstName,
  lastName,
  email,
  message,
}: {
  firstName: string;
  lastName: string | null;
  email: string;
  message: string;
}) {
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  return (
    <EmailLayout
      preview={`New contact form message from ${fullName}`}
      heading="New contact form submission"
    >
      <Section>
        <Text>
          <strong>From:</strong> {fullName} (
          <a href={`mailto:${email}`}>{email}</a>)
        </Text>
        <Hr style={{ borderColor: "#e5e5e5", margin: "16px 0" }} />
        <Text style={{ whiteSpace: "pre-line" }}>{message}</Text>
      </Section>
    </EmailLayout>
  );
}

export default ContactFormSubmittedEmail;
