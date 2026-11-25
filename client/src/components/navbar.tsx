import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../features/shop/useCart";
import Cart from "../features/shop/components/Cart";

type NavItem = { label: string; href: string };

const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Instant Quote", href: "/quote" },
  { label: "Shop", href: "/shop" },
  { label: "Projects", href: "/projects" },
  { label: "About Us", href: "/about-us" },
];

function CartButton() {
  const { itemCount, openCart } = useCart();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => openCart()}
        className="text-zinc-400 transition hover:text-zinc-100 p-1 cursor-pointer"
        aria-label={`Shopping cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
        aria-haspopup="dialog"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </button>
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-xs font-mono font-bold text-zinc-950"
        >
          {itemCount}
        </span>
      )}
    </div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const { isCartOpen, closeCart } = useCart();

  // The mobile menu is open only for the route it was opened on, so any navigation
  // (link click, back/forward, programmatic) closes it without an effect.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === location.pathname;
  const closeMenu = () => setMenuPath(null);

  // lock body scroll when mobile menu is open (html element; the cart drawer locks <body>)
  useEffect(() => {
    document.documentElement.classList.toggle("overflow-hidden", open);
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [open]);

  // close mobile menu on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuPath(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <div className="flex h-14 w-full items-center gap-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Brand */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-2 text-sm font-medium tracking-tight text-white"
          >
            <img
              src={`${import.meta.env.BASE_URL}images/amboss-logo.png`}
              alt="Amboss"
              className="h-7 w-auto"
              width={140}
              height={28}
            />
          </Link>

          {/* Desktop nav and cart */}
          <div className="ml-auto hidden md:flex items-center gap-6">
            <nav aria-label="Main" className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={closeMenu}
                    aria-current={isActive ? "page" : undefined}
                    className={`transition px-3 py-1.5 rounded ${
                      isActive
                        ? 'text-zinc-100 bg-zinc-900 border border-zinc-800'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <CartButton />
          </div>

          {/* Mobile cart and menu */}
          <div className="ml-auto flex items-center gap-3 md:hidden">
            <CartButton />

            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setMenuPath(open ? null : location.pathname)}
              className="inline-flex items-center justify-center p-1.5 rounded text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900/60"
            >
              <span className="sr-only">Toggle navigation</span>
              <svg
                aria-hidden="true"
                className={`h-5 w-5 ${open ? "hidden" : "block"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeWidth="1.75" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                aria-hidden="true"
                className={`h-5 w-5 ${open ? "block" : "hidden"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeWidth="1.75" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          id="mobile-nav"
          inert={!open}
          className={`md:hidden origin-top overflow-hidden border-t border-zinc-800 bg-zinc-950 transition-[max-height,opacity] ${
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav aria-label="Mobile" className="w-full px-4 sm:px-6 lg:px-8 py-3">
            <ul className="space-y-1 text-xs font-mono uppercase tracking-wider">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={closeMenu}
                      aria-current={isActive ? "page" : undefined}
                      className={`block rounded px-3 py-2 transition ${
                        isActive
                          ? 'text-zinc-100 bg-zinc-900 border border-zinc-800'
                          : 'text-zinc-400 hover:text-zinc-200'
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
      <Cart isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}
