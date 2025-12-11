import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type NavItem = { label: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Services", href: "#services" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Materials", href: "#materials" },
  { label: "Projects", href: "/projects" },
  { label: "Products", href: "/products" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleHashClick = (hash: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const scrollToHash = () => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    };

    if (location.pathname !== "/") {
      navigate("/");
      // allow navigation to home before scrolling
      setTimeout(scrollToHash, 50);
    } else {
      scrollToHash();
    }
    setOpen(false);
  };

  // lock body scroll when mobile menu is open
  useEffect(() => {
    document.documentElement.classList.toggle("overflow-hidden", open);
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
        >
          <img
            src="/images/amboss-logo.png"
            alt="Amboss logo"
            className="h-8 w-auto"
            loading="lazy"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
          {NAV_ITEMS.map((item) => (
            item.href.startsWith("#") ? (
              <a
                key={item.href}
                href={item.href}
                onClick={handleHashClick(item.href)}
                className="transition hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="transition hover:text-white"
              >
                {item.label}
              </Link>
            )
          ))}
          <a
            href="#contact"
            onClick={handleHashClick("#contact")}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-500"
          >
            Contact
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-zinc-300 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-600/50"
        >
          <span className="sr-only">Toggle navigation</span>
          <svg
            className={`h-6 w-6 ${open ? "hidden" : "block"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg
            className={`h-6 w-6 ${open ? "block" : "hidden"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-nav"
        className={`md:hidden origin-top overflow-hidden border-t border-white/5 bg-zinc-950/95 transition-[max-height,opacity] ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <ul className="space-y-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                {item.href.startsWith("#") ? (
                  <a
                    href={item.href}
                    onClick={handleHashClick(item.href)}
                    className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            <li className="pt-1">
              <a
                href="#contact"
                onClick={handleHashClick("#contact")}
                className="block rounded-lg bg-red-600 px-3 py-2 text-center text-white hover:bg-red-500"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
