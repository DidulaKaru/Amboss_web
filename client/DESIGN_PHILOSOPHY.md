# AMBOSS Design Philosophy

> **Core Identity:** Amboss is a precision engineering, rapid prototyping, and additive manufacturing studio originating at the University of Ruhuna Faculty of Engineering (Galle, Sri Lanka). The digital platform reflects the clean, minimalist, and tactile elegance of physical hardware manufacturing and precision instruments.

---

## 1. Minimalist, Simple & Elegant Aesthetic
- **Visual Baseline:** The home page establishes the visual anchor for the entire site: generous negative space, refined typography, subtle zinc borders (`border-zinc-800`), deep carbon surfaces (`bg-zinc-950` / `bg-zinc-900`), and quiet elegance.
- **Unified Consistency Across All Pages:** Every page—including the Quote Calculator, Shop / Products Catalog, Projects, About Us, and the Admin Portal—must strictly adhere to this same understated, minimalist aesthetic.
- **Subtractive Design:** If an element does not serve an essential purpose or repeats information found elsewhere, eliminate it. Avoid visual clutter, heavy marketing banners, redundant descriptions, and excessive helper text. Let layout, imagery, and typography breathe.

---

## 2. Zero Emojis Policy
- **Absolute Rule:** Never use emojis anywhere in the user interface, buttons, badges, banners, alerts, or checkout payloads.
- **Rationale:** Emojis degrade technical credibility, introducing a toy-like aesthetic unfitting for an engineering and prototyping firm.
- **Alternative:** 
  - Use clean, single-weight monochrome SVG line icons (1.5px stroke width).
  - Use disciplined micro-typography (e.g., uppercase monospaced labels: `FREE`, `LOCAL PICKUP`, `IN STOCK`).
  - Use subtle geometric indicators (e.g., a solid 6px emerald status dot for active state).

---

## 3. Color Palette & Typography
- **Palette:**
  - Deep carbon/zinc neutrals (`#09090b` zinc-950 background, `#18181b` zinc-900 surfaces, `#27272a` zinc-800 borders).
  - High-contrast text hierarchy: `#f4f4f5` (zinc-100) for primary headings and values, `#a1a1aa` (zinc-400) for secondary details, `#71717a` (zinc-500) for micro-labels.
  - Functional accents only: emerald `#10b981` strictly for positive state/free, cyan `#06b6d4` for active technical focus/links, red `#ef4444` strictly for limits and validation errors.
- **No Decorative Clutter:** Avoid gratuitous gradient mesh blobs, neon rainbow drop-shadows, or floating blurred orbs.

---

## 4. Shop & Product Presentation Minimalism
- **Uncluttered Catalog Grid:** The store is a curated maker inventory, not an overwhelming retail supermarket.
- **Clean Product Cards:** Focus on crisp product photography, clean product title, clear price in LKR, and status dot (`In stock` / `Out of stock`).
- **No Bulky Banners:** Avoid towering promotional banners and repetitive logistics blocks at the top of the shop. Delivery terms should be seamlessly embedded into cart checkout rather than cluttering the storefront view.
- **Privacy & Clean Inventory:** Never expose raw internal stock numbers on public cards; indicate status using qualitative status dots (`In stock` / `Out of stock`).

---

## 5. No Jargon, Plain Language
- **Clarity Over Hype:** Never use empty marketing buzzwords ("revolutionary", "cutting-edge", "game-changing", "supercharged"). Avoid corporate supply-chain jargon like "fulfillment method" — use clear, everyday language like "Delivery Method" or "Pickup".
- **Human-Readable Engineering:**
  - Express technical dimensions plainly: `20 × 20 × 20 mm`.
  - Express mass accurately: `~28.4 g`.
  - Clearly state delivery options: `Free pickup at Ruhuna Faculty or Hapugala shop`.
  - Clearly state turnaround: `Lead time: 24–48 hours`.

---

## 6. Anti-"Vibe-Coded" Aesthetic
- **Avoid Generic AI Tropes:**
  - No bloated hero sections filled with cliché copy and generic stock illustrations.
  - No neon gradient borders or rainbow glowing cards.
  - No oversized rounded pills with emojis.
- **Inspiration:**
  - Dieter Rams' Ten Principles for Good Design (functional, honest, unobtrusive).
  - Teenage Engineering industrial hardware (tactile, compact, dense informational clarity).
  - Precision CAD viewports and Swiss typographic grids (monospace numerals for metrics, tabular numbers, clean alignment).

---

## 7. Administrative Terminal (`SYS / CTRL`)
- **Minimal Machine Control Panel:** The administration portal (`/admin`) is a dedicated machine tool control panel, not a cluttered corporate dashboard.
- **Streamlined Inventory & Content Management:** Prioritize high-density data tables, fast inline stock/price updates, quick active toggles, and simple search/filter controls without bulky metric cards or noisy badge colors.
- **Discreet Public Link:** Discovered strictly through a muted, low-contrast `SYS / CTRL` colophon link in `AboutUs/aboutUs.tsx`.

---

## 8. Single Source of Truth (SSOT)
- Never duplicate constants (pricing, delivery rates, pickup addresses, phone numbers) across components.
- Always import from `client/src/config/logistics.ts` and `client/src/config/site.ts`.
- Public store interfaces must never expose raw stock quantity counts; use qualitative status dots (`In stock` / `Out of stock`) while retaining precise numeric counts inside `/admin`.
