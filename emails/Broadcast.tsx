import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { siteConfig } from "@/siteConfig";

const main = {
  backgroundColor: "#f5f5f5",
  fontFamily: "Helvetica, Arial, sans-serif",
  padding: "32px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

const emergencyBanner = {
  backgroundColor: "#fee2e2",
  border: "1px solid #fca5a5",
  borderRadius: "8px",
  color: "#7f1d1d",
  fontSize: "13px",
  fontWeight: 600,
  padding: "10px 14px",
  marginBottom: "20px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const footer = {
  color: "#666",
  fontSize: "11px",
  textAlign: "center" as const,
  marginTop: "24px",
  lineHeight: 1.5,
};

export function BroadcastEmail({
  subject,
  body,
  isEmergency,
  unsubscribeUrl,
}: {
  subject: string;
  body: string;
  isEmergency: boolean;
  unsubscribeUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {isEmergency && (
            <div style={emergencyBanner}>⚠ Emergency alert</div>
          )}
          <Heading
            as="h1"
            style={{
              fontSize: "20px",
              fontWeight: 600,
              marginBottom: "16px",
              color: isEmergency ? "#7f1d1d" : "#111",
            }}
          >
            {subject}
          </Heading>
          <Section>
            <Text style={{ whiteSpace: "pre-line", lineHeight: 1.55 }}>
              {body}
            </Text>
          </Section>
          {isEmergency && (
            <Text style={{ fontSize: "12px", color: "#666", marginTop: "20px" }}>
              This is a community alert from {siteConfig.hoa.name}. It is not a
              substitute for 911 or official municipal emergency systems.
            </Text>
          )}
          <Hr style={{ borderColor: "#e5e5e5", margin: "32px 0 16px" }} />
          <Text style={footer}>
            {siteConfig.hoa.name} · {siteConfig.contact.email}
            <br />
            <a href={unsubscribeUrl}>Unsubscribe</a> or update your notification
            preferences.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default BroadcastEmail;
