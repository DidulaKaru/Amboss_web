import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Cart from "../pages/shop/components/Cart";

type NavItem = { label: string; href: string };

const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Shop", href: "/shop" },
  { label: "Projects", href: "/projects" },
  { label: "News", href: "/news" },
  { label: "About Us", href: "/about-us" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();
  const { itemCount } = useCart();

  // lock body scroll when mobile menu is open
  useEffect(() => {
    document.documentElement.classList.toggle("overflow-hidden", open);
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-amboss-accent/20 bg-amboss-bg/80 backdrop-blur supports-[backdrop-filter]:bg-amboss-bg/60">
        <div className="flex h-14 w-full items-center gap-8 px-4 sm:px-6 lg:px-8">
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
          <nav className="hidden md:flex ml-auto items-center gap-6 text-sm">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`transition px-3 py-1 rounded ${
                    isActive
                      ? 'text-white font-semibold bg-amboss-accent/40'
                      : 'text-amboss-light hover:text-white hover:bg-amboss-accent/30'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Cart Icon & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Cart Icon */}
            <div className="relative">
              <button
                onClick={() => setCartOpen(true)}
                className="text-amboss-light hover:text-white transition"
                aria-label="Shopping cart"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </button>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </div>

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
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-lg px-3 py-2 transition ${
                        isActive
                          ? 'text-white font-semibold bg-amboss-accent/40'
                          : 'text-amboss-light hover:bg-white/5 hover:text-white hover:bg-amboss-accent/30'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {/* Cart Sidebar */}
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}





