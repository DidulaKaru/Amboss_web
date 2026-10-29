# Amboss Maker Store Feature (`client/src/features/shop`)

This module powers the public electronics catalog, variant grouping, real-time inventory checking, and WhatsApp-directed cart checkout for Amboss STEM and prototyping hardware in Galle, Sri Lanka.

---

## What This Section Does

1. **Catalog Browsing & Search:**
   - Displays microcontrollers (Arduino, ESP32), sensors (ultrasonic, IMU, IR), prototyping boards, and passive components.
   - Live category tabs and search input filtering by SKU, name, or description.
2. **Consolidated Variant Cards:**
   - Handled via `groupProducts.ts`.
   - Groups multi-SKU items into a single card with variant dropdown selectors:
     - **LEDs:** Color dropdown (`Red`, `Green`; 500 stock each).
     - **Jumper Cables:** Termination dropdown (`M-M`, `M-F`, `F-F`).
3. **Subtractive Anti-"Vibe-Coded" Design:**
   - Conforms strictly to [`client/DESIGN_PHILOSOPHY.md`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/DESIGN_PHILOSOPHY.md).
   - Zero emojis anywhere in the interface.
   - Public store never displays raw stock numbers to users; instead shows subtle geometric dots: emerald `In stock` or zinc `Out of stock`.
4. **Logistics & WhatsApp Checkout:**
   - Free pickup at Faculty of Engineering (University of Ruhuna) or Amboss Shop (Hapugala).
   - Galle local delivery (200 LKR, free over 3,000 LKR).
   - Flat 500 LKR islandwide courier for electronics.
   - Checks inventory against Fastify backend (`/api/v1/orders/validate-cart`) before redirecting to WhatsApp.

---

## Directory Structure

```
shop/
├── components/
│   ├── Cart.tsx             # Slide-over cart drawer with logistics selector & checkout
│   └── ProductCard.tsx      # Subtractive product card with variant dropdown & status dot
├── cartContext.tsx          # Cart state provider (localStorage persistence, sync, validation)
├── cartInternal.ts          # Internal createContext definition
├── groupProducts.ts         # Logic for grouping variant SKUs into unified cards
├── ShopPage.tsx             # Full shop page assembly (header, categories, grid, cart)
├── types.ts                 # Product, CartItem, DeliveryMethod, GroupedProduct definitions
├── useCart.ts               # Custom hook to consume CartContext
├── useProducts.ts           # Fetch catalog with fallback to client data
└── README.md                # This documentation
```

---

## Single Source of Truth (SSOT) References

- **Delivery Fees & Logistics Options:**
  Imported from [`client/src/config/logistics.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/config/logistics.ts):
  - `calculateShopDeliveryFee(method, subtotal)`
  - `LOGISTICS_CONFIG`
- **Contact & WhatsApp Phone Number:**
  Imported from [`client/src/config/site.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/config/site.ts):
  - `SITE.phone` (`+94779902796`)
- **Public Fallback Catalog:**
  [`client/src/data/products.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/data/products.ts) provides offline/fallback inventory if the backend API is unreachable.

---

## How to Edit

### 1. Adding a New Product Variant Group
To group new products under a single card (e.g. Resistor values or Capacitor kits), edit `client/src/features/shop/groupProducts.ts`:
```ts
// Detect matching items and assign to group
const isResistor = p.name.toLowerCase().includes('resistor')
if (isResistor) {
  // Extract variant label (e.g. '10k', '1k', '220 ohm') and push to group
}
```

### 2. Modifying Cart State or Delivery Methods
Edit [`client/src/features/shop/cartContext.tsx`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/features/shop/cartContext.tsx):
- All delivery fees are calculated via `calculateShopDeliveryFee()` from `config/logistics.ts`.
- Pre-filled WhatsApp message format is generated inside `checkoutViaWhatsApp()`.

### 3. Adding or Updating Static Product Seeds
Edit [`client/src/data/products.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/data/products.ts) and mirror changes in `server/src/db/seedData.ts`.
