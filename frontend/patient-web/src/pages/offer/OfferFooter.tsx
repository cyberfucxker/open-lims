import { Link } from "react-router-dom";

import { Logo } from "@/components/brand/Logo";
import { CONTACT, WHATSAPP_HREF } from "@/components/home/SiteFooter";

function OfferFooter() {
  return (
    <footer className="bg-brand-navy text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo variant="white" className="h-8 self-start" />
          <p className="max-w-sm text-sm leading-relaxed text-white/70">{CONTACT.address}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
            Talk to us
          </p>
          <a href={CONTACT.phoneHref} className="text-white hover:underline">
            {CONTACT.phone}
          </a>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white hover:underline"
          >
            WhatsApp
          </a>
          <a href={`mailto:${CONTACT.email}`} className="hover:text-white hover:underline">
            {CONTACT.email}
          </a>
          <span className="text-white/60">{CONTACT.hours}</span>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
            Policies
          </p>
          <Link to="/privacy-policy" className="hover:text-white hover:underline">
            Privacy policy
          </Link>
          <Link to="/terms" className="hover:text-white hover:underline">
            Terms of service
          </Link>
          <Link to="/refund-policy" className="hover:text-white hover:underline">
            Refund policy
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/50 sm:px-6">
          © {new Date().getFullYear()} Example Diagnostics Lab. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export { OfferFooter };
