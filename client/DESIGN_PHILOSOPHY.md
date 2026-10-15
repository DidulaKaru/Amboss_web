# AMBOSS Design Philosophy

> **Core Identity:** Amboss is a precision engineering, rapid prototyping, and additive manufacturing studio originating at the University of Ruhuna Faculty of Engineering (Galle, Sri Lanka). The digital platform must reflect the rigors, precision, and tactile reality of physical hardware manufacturing.

---

## 1. Zero Emojis Policy
- **Absolute Rule:** Never use emojis anywhere in the user interface, buttons, badges, banners, alerts, or checkout payloads.
- **Rationale:** Emojis degrade technical credibility, introducing a toy-like aesthetic unfitting for an engineering and prototyping firm.
- **Alternative:** 
  - Use clean, single-weight monochrome SVG line icons (1.5px stroke width).
  - Use disciplined micro-typography (e.g., uppercase monospaced labels: `FREE`, `LOCAL PICKUP`, `IN STOCK`).
  - Use subtle geometric indicators (e.g., a solid 6px emerald status dot for active state).

---

## 2. Minimalist & Functional Discipline
- **Subtractive Design:** If an element does not serve a functional engineering purpose, remove it.
- **Color Palette:**
  - Deep carbon/zinc neutrals (`#09090b` zinc-950 background, `#18181b` zinc-900 surfaces, `#27272a` zinc-800 borders).
  - High-contrast text hierarchy: `#f4f4f5` (zinc-100) for primary headings and values, `#a1a1aa` (zinc-400) for secondary details, `#71717a` (zinc-500) for metadata.
  - Accent colors are restrained and functional: emerald `#10b981` strictly for verified success/free, cyan `#06b6d4` for active technical focus/CAD viewport accents, red `#ef4444` strictly for limits and validation errors.
- **No Decorative Clutter:** Avoid gratuitous gradient mesh blobs, neon rainbow drop-shadows, or floating blurred orbs. Interfaces must feel like an industrial instrument panel.

---

## 3. No Jargon, Plain Language
- **Clarity Over Hype:** Never use empty marketing buzzwords ("revolutionary", "cutting-edge", "game-changing", "supercharged").
- **Human-Readable Engineering:**
  - Express technical dimensions plainly: `20 × 20 × 20 mm`, not ambiguous bounding boxes.
  - Express mass accurately: `~28.4 g`, not vague volume estimates.
  - Clearly state fulfillment options: `Free pickup at Faculty of Engineering, University of Ruhuna or Hapugala shop`.
  - Clearly state turnaround: `Lead time: 24–48 hours`.

---

## 4. Anti-"Vibe-Coded" Aesthetic
- **Avoid Generic AI Tropes:**
  - No bloated hero sections filled with cliché copy and generic stock illustrations.
  - No neon gradient borders or rainbow glowing cards.
  - No oversized rounded pills with emojis.
- **Inspiration:**
  - Dieter Rams' Ten Principles for Good Design (functional, honest, unobtrusive).
  - Teenage Engineering industrial hardware (tactile, compact, dense informational clarity).
  - Precision CAD viewports and Swiss typographic grids (monospace numerals for metrics, tabular numbers, clean alignment).

---

## 5. Intuitive Feedback & Affordances
- **Instant Status Feedback:** Every interactive element must provide immediate feedback (loading spinners on async calls, clear disable states when inventory is exhausted, inline validation messages).
- **Sensible Defaults:** Forms should default to standard engineering parameters (20% infill, 0.20 mm layer height, local pickup).
- **Transparent Pricing:** All costs (material, machine runtime, prep & QA, courier) must be itemized transparently in Sri Lankan Rupees (LKR) with no hidden surcharges.

---

## 6. Administrative Terminal (`SYS / CTRL`)
- **Air-Gapped Industrial Feeling:** The administration portal (`/admin`) is treated not as a flashy web app, but as a dedicated machine tool control panel.
- **Discreet Public Link:** Discovered strictly through a muted, low-contrast `SYS / CTRL` colophon link in `AboutUs/aboutUs.tsx`.
- **High-Density Data Grid:** Monospace tables, compact numeric controls (`−`, input, `+`), immediate inline synchronization, and zero decorative fluff.

---

## 7. Single Source of Truth (SSOT)
- Never duplicate constants (pricing, delivery rates, pickup addresses, phone numbers) across components.
- Always import from `client/src/config/logistics.ts` and `client/src/config/site.ts`.
- Public store interfaces must never expose raw stock quantity counts; use qualitative status dots (`In stock` / `Out of stock`) while retaining precise numeric counts inside `/admin`.
