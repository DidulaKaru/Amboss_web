// Footer.tsx
import React from "react";

type FooterProps = {
  company?: string;
  email?: string;
  phone?: string;
  addressLines?: string[];
  links?: { label: string; href: string }[];
  socials?: { label: string; href: string; icon: React.ReactNode }[];
};

const IconMail = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 8l8 5 8-5" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M2 5l4-2 4 8-3 2a12 12 0 006 6l2-3 8 4-2 4c-8 1-15-6-17-14z" />
  </svg>
);

const IconMap = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M9 20l-5 2V6l5-2 6 2 5-2v16l-5 2-6-2zM15 6v14" />
  </svg>
);

const IconIG = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3a5 5 0 110 10 5 5 0 010-10zm6.5-.75a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" />
  </svg>
);

const IconLinkedIn = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0V8zm7.5 0H12v2.2h.06c.63-1.2 2.17-2.46 4.47-2.46C20.91 7.74 22 10.2 22 14.06V24h-5v-8.7c0-2.08-.04-4.76-2.9-4.76-2.9 0-3.35 2.26-3.35 4.6V24H7.5V8z" />
  </svg>
);

export default function Footer({
  company = "Amboss Industries",
  email = "amboss.manufacturing@gmail.com",
  phone = "+94779902796",
  addressLines = ["Amboss Industries", "Elhenage Watta, Hapugala", "Galle, Sri Lanka"],
  links = [
    { label: "Services", href: "#services" },
    { label: "Capabilities", href: "#capabilities" },
    { label: "Materials", href: "#materials" },
    { label: "Research", href: "#research" },
  ],
  socials = [
    { label: "Instagram", href: "https://www.instagram.com/amboss.official_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", icon: <IconIG /> },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/amboss-manufacturing/", icon: <IconLinkedIn /> },
  ],
}: FooterProps) {
  return (
    <footer id="footer" className="mt-16 border-t border-amboss-accent/30 bg-amboss-bg">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <a href="#home" className="inline-flex items-center gap-3">
              <img
                src="/Amboss_web/images/amboss-logo.png"
                alt="Amboss logo"
                className="h-8 w-auto"
                loading="lazy"
              />
            </a>
            <p className="text-sm text-amboss-light/60 max-w-sm">
              Shaping your future with precise, reliable 3D printingfrom rapid prototyping to small-batch production.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amboss-accent/30 bg-amboss-section/30 text-amboss-light/80 hover:text-white hover:border-amboss-light/50 transition"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Quick links</h4>
            <ul className="mt-3 space-y-2">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-amboss-light/80 hover:text-white transition">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Contact</h4>
            <div className="flex items-start gap-3 text-sm text-amboss-light/80">
              <span className="mt-0.5 text-amboss-light/60"><IconMail /></span>
              <a href={`mailto:${email}`} className="hover:text-white break-all">{email}</a>
            </div>
            <div className="flex items-start gap-3 text-sm text-amboss-light/80">
              <span className="mt-0.5 text-amboss-light/60"><IconPhone /></span>
              <a href={`https://wa.me/${phone.replace(/[^+\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">{phone}</a>
            </div>
            <div className="flex items-start gap-3 text-sm text-amboss-light/80">
              <span className="mt-0.5 text-amboss-light/60"><IconMap /></span>
              <p className="whitespace-pre-line">
                {addressLines.join("\n")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-amboss-accent/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4 text-xs text-amboss-light/60">
          <p> {new Date().getFullYear()} {company}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#home" className="hover:text-white">Back to top</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}



