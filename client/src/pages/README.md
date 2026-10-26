# Amboss Client Pages (`client/src/pages`)

This directory houses the top-level routable views for the public-facing Amboss web platform.

---

## Directory Overview

```
pages/
├── landing/                 # Root home page (/)
│   ├── components/          # 3D Hero canvas, capabilities grid, CTA, project previews, footer
│   └── home.tsx             # Master assembly for landing page
├── AboutUs/                 # About Amboss, university origin, manufacturing capacity (/about-us)
│   └── aboutUs.tsx          # Contains the discreet 'SYS / CTRL' link in the colophon footer
├── Projects/                # Engineering portfolio showcase (/projects)
│   ├── components/          # Filterable portfolio grid & lightbox
│   └── projects.tsx         # Case study hero + dynamic portfolio grid
├── shop/                    # Maker Store entry point (/shop)
│   └── Shop.tsx             # Wraps features/shop/ShopPage.tsx
└── README.md                # This documentation
```

---

## Page Catalog & Routing

| Path | Component | Purpose |
| :--- | :--- | :--- |
| `/` | `pages/landing/home.tsx` | Main technical showcase, 3D viewport hero, services overview |
| `/quote` | `features/quote/QuotePage.tsx` | Instant 3D STL volumetric quotation engine |
| `/shop` | `features/shop/ShopPage.tsx` | Electronics catalog, variant dropdowns, smart cart |
| `/projects` | `pages/Projects/projects.tsx` | Engineering portfolio and case studies |
| `/about-us` | `pages/AboutUs/aboutUs.tsx` | Studio origins, university affiliation, and discreet `SYS / CTRL` colophon link |
| `/admin/login` | `features/admin/AdminLogin.tsx` | SYS.CTRL authentication terminal |
| `/admin` | `features/admin/AdminDashboard.tsx` | SYS.CTRL catalog and inventory control |

---

## Discreet System Gateway

The colophon at the bottom of [`AboutUs/aboutUs.tsx`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/pages/AboutUs/aboutUs.tsx) exposes the low-contrast system entry point:
```tsx
<div className="pt-10 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-600">
  <span>AMBOSS Engineering & Manufacturing · Southern Province</span>
  <Link to="/admin/login" className="text-zinc-600 hover:text-zinc-400 transition" title="System Terminal">
    SYS / CTRL
  </Link>
</div>
```

---

## How to Edit

### 1. Adding a New Page Route
1. Create the page component in `client/src/pages/<PageName>/<pageName>.tsx`.
2. Register the route in [`client/src/App.tsx`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/App.tsx):
   ```tsx
   <Route path="/new-path" element={<NewPageComponent />} />
   ```
3. Add the corresponding SEO metadata in the `RouteSeo` component inside `App.tsx`.
4. If it requires navigation bar visibility, update `client/src/components/navbar.tsx`.
