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

const footer = {
  color: "#666",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "24px",
};

export function EmailLayout({
  preview,
  heading,
  children,
}: {
  preview: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading
            as="h1"
            style={{
              fontSize: "22px",
              fontWeight: 600,
              marginBottom: "24px",
              color: "#111",
            }}
          >
            {heading}
          </Heading>
          <Section>{children}</Section>
          <Hr style={{ borderColor: "#e5e5e5", margin: "32px 0 16px" }} />
          <Text style={footer}>
            {siteConfig.hoa.name} — {siteConfig.contact.email}
            <br />
            You&apos;re receiving this because you registered or were listed in
            HOA records. Update your preferences in your profile.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
