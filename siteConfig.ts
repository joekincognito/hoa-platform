/**
 * Per-HOA branding and content. This is the primary file a fork overrides.
 * See CUSTOMIZE.md for the full list of customization surface area.
 */

export const siteConfig = {
  hoa: {
    name: "Example HOA",
    shortName: "Example",
    tagline: "A community website for your HOA",
    city: "Yourtown",
    state: "ST",
    zip: "00000",
    establishedYear: 2000,
  },

  contact: {
    phone: "555-555-5555",
    email: "hello@example.com",
    address: "123 Main Street",
    addressLine2: "Yourtown, ST 00000",
  },

  /**
   * SMS broadcasting requires Twilio + A2P 10DLC registration (~1-2 weeks,
   * ~$15/mo per HOA). Leave false until the registration is approved.
   * Email broadcasting works without this flag.
   */
  features: {
    smsEnabled: false,
    publicEventRsvp: true,
    anonymousViolationReports: false,
  },

  /**
   * Email "From" identity. Domain must be verified in Resend.
   */
  email: {
    fromName: "Example HOA",
    fromAddress: "no-reply@example.com",
    replyTo: "board@example.com",
  },

  /**
   * Amenities listed on the About section. Customize per HOA.
   */
  amenities: [
    "Tennis courts",
    "Private swimming pool",
    "Pavilion for events",
    "Boat docks with lake access",
  ],

  /**
   * Marketing copy for the About section. Plain text, line breaks preserved.
   */
  aboutCopy: `Replace this with a paragraph about your community. This text appears in the "About" section of the home page.`,
} as const;

export type SiteConfig = typeof siteConfig;
