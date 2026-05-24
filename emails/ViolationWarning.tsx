import { Text, Section, Heading } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./_layout";
import {
  VIOLATION_CATEGORY_LABEL,
  VIOLATION_STATUS_LABEL,
  type ViolationCategory,
  type ViolationStatus,
} from "@/lib/workflow/violations";

const HEADLINE: Record<ViolationStatus, string> = {
  warning_1: "First warning",
  warning_2: "Second warning",
  final_notice: "Final notice",
  fined: "Notice of fine",
  resolved: "Violation resolved",
  pending_review: "Notice",
  dismissed: "Violation dismissed",
};

const DEADLINES: Partial<Record<ViolationStatus, string>> = {
  warning_1: "Please correct the issue within 14 days.",
  warning_2: "Please correct the issue within 7 days. Continued non-compliance will result in a final notice.",
  final_notice: "This is a final notice. Continued non-compliance will result in a fine.",
};

export function ViolationWarningEmail({
  status,
  homeownerName,
  address,
  category,
  description,
  fineAmount,
  comment,
  appealUrl,
  bylawsReference,
}: {
  status: ViolationStatus;
  homeownerName: string | null;
  address: string;
  category: ViolationCategory;
  description: string;
  fineAmount?: number | null;
  comment?: string;
  appealUrl: string;
  bylawsReference?: string;
}) {
  const headline = HEADLINE[status];
  const deadline = DEADLINES[status];

  return (
    <EmailLayout preview={`${headline} for ${address}`} heading={headline}>
      <Section>
        <Text>Hello{homeownerName ? `, ${homeownerName}` : ""},</Text>
        <Text>
          The HOA board has issued a{" "}
          <strong>{VIOLATION_STATUS_LABEL[status].toLowerCase()}</strong>{" "}
          regarding the property at <strong>{address}</strong> for the
          following:
        </Text>

        <Heading
          as="h2"
          style={{ fontSize: "16px", marginTop: "20px", marginBottom: "4px" }}
        >
          {VIOLATION_CATEGORY_LABEL[category]}
        </Heading>
        <Text style={{ whiteSpace: "pre-line", marginTop: 0 }}>{description}</Text>

        {comment && (
          <>
            <Heading
              as="h2"
              style={{ fontSize: "16px", marginTop: "20px", marginBottom: "4px" }}
            >
              Board note
            </Heading>
            <Text style={{ whiteSpace: "pre-line", marginTop: 0 }}>{comment}</Text>
          </>
        )}

        {status === "fined" && fineAmount != null && (
          <Text>
            <strong>Fine amount: ${fineAmount.toFixed(2)}</strong>
          </Text>
        )}

        {deadline && <Text style={{ fontWeight: 600 }}>{deadline}</Text>}

        <Text>
          You may respond, dispute, or provide context here:
          <br />
          <a href={appealUrl}>{appealUrl}</a>
        </Text>

        <Text style={{ fontSize: "12px", color: "#666", marginTop: "32px" }}>
          {bylawsReference ??
            "This message is sent as part of HOA enforcement procedures. It is not a legal notice — refer to the community bylaws and CC&Rs for the full enforcement policy and any rights to a formal hearing."}
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ViolationWarningEmail;
