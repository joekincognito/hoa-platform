import { Phone, Mail, MapPin } from "lucide-react";
import { siteConfig } from "@/siteConfig";
import { ContactForm } from "@/components/site/ContactForm";

export function Footer() {
  return (
    <footer className="mt-24 bg-neutral-900 text-neutral-100">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <h3 className="font-heading text-2xl font-semibold tracking-tight">
            Contact info
          </h3>
          <div className="mt-6 space-y-3 text-sm text-neutral-300">
            <p className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0" /> {siteConfig.contact.phone}
            </p>
            <p className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0" />
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="hover:text-white"
              >
                {siteConfig.contact.email}
              </a>
            </p>
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {siteConfig.contact.address}
                <br />
                {siteConfig.contact.addressLine2}
              </span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-heading text-2xl font-semibold tracking-tight">
            Send a message
          </h3>
          <p className="mt-2 text-sm text-neutral-400">
            Questions for the board or property manager? Send a message and
            we&apos;ll get back to you.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-neutral-500 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {siteConfig.hoa.name}. All rights
            reserved.
          </p>
          <p>
            {siteConfig.hoa.city}, {siteConfig.hoa.state}{" "}
            {siteConfig.hoa.zip}
          </p>
        </div>
      </div>
    </footer>
  );
}
