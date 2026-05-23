import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type NavItem = { label: string; href: string };

const NAV_ITEMS: NavItem[] = [
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
    <header className="sticky top-0 z-50 w-full border-b border-amboss-accent/20 bg-amboss-bg/80 backdrop-blur supports-[backdrop-filter]:bg-amboss-bg/60">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
        >
          <img
            src={`${import.meta.env.BASE_URL}images/amboss-logo.png`}
            alt="Amboss logo"
            className="h-8 w-auto"
            loading="lazy"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-amboss-light">
          {NAV_ITEMS.map((item) => (
            item.href.startsWith("#") ? (
              <a
                key={item.href}
                href={item.href}
                onClick={handleHashClick(item.href)}
                className="transition hover:text-white hover:bg-amboss-accent/30 px-3 py-1 rounded"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="transition hover:text-white hover:bg-amboss-accent/30 px-3 py-1 rounded"
              >
                {item.label}
              </Link>
            )
          ))}
          <Link
            to="/about-us"
            onClick={() => setOpen(false)}
            className="transition hover:text-white hover:bg-amboss-accent/30 px-3 py-1 rounded"
          >
            About us
          </Link>
          <Link
            to="/news"
            onClick={() => setOpen(false)}
            className="rounded-full bg-amboss-accent hover:bg-amboss-accent/80 px-4 py-2 text-white"
          >
            News
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-amboss-light hover:bg-white/5 hover:text-white hover:bg-amboss-accent/30 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-red-600/50"
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
        className={`md:hidden origin-top overflow-hidden border-t border-amboss-accent/20 bg-zinc-950/95 transition-[max-height,opacity] ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <ul className="space-y-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                {item.href.startsWith("#") ? (
                  <a
                    href={item.href}
                    onClick={handleHashClick(item.href)}
                    className="block rounded-lg px-3 py-2 text-amboss-light hover:bg-white/5 hover:text-white hover:bg-amboss-accent/30 px-3 py-1 rounded"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-amboss-light hover:bg-white/5 hover:text-white hover:bg-amboss-accent/30 px-3 py-1 rounded"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            <li className="pt-1">
              <Link
                to="/about-us"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-4 py-2 text-white hover:bg-amboss-accent/30"
              >
                About us
              </Link>
            </li>
            <li>
              <Link
                to="/news"
                onClick={() => setOpen(false)}
                className="block rounded-lg bg-amboss-accent hover:bg-amboss-accent/80 px-4 py-2 text-white"
              >
                News
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}





