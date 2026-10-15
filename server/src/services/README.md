# Server Services & Business Logic (`server/src/services`)

This directory houses pure domain logic decoupled from Fastify HTTP request/reply lifecycle.

---

## Services Overview

### 1. Pricing Engine (`pricingService.ts`)
- Computes deterministic additive manufacturing quotations in Sri Lankan Rupees (LKR).
- Evaluates:
  1. **Effective Mass Estimation:** Uses geometric volume ($\text{cm}^3$) and surface area ($\text{cm}^2$) to calculate outer shell mass (1.2 mm shell thickness) plus interior infill core density.
  2. **Material Cost:** Grams $\times$ material cost per gram.
  3. **Machine Cost:** Machine runtime hours $\times$ machine hourly rate (160 LKR/hr for FDM, 250 LKR/hr for SLA).
  4. **Preparation & Post-Processing Fee:** 250 LKR for FDM, 350 LKR for SLA (alcohol wash & UV curing).
  5. **Minimum Order Enforcement:** Enforces `MINIMUM_PRINT_PRICE_LKR = 250`.
  6. **Build Envelope Checks:** Flags oversized parts exceeding standard envelopes (e.g. Creality K2 Plus: $350\times 350\times 350\,\text{mm}$).

---

## Single Source of Truth (SSOT)

All logistics rules and pricing thresholds are imported from [`server/src/config/logistics.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/server/src/config/logistics.ts):
- `MINIMUM_PRINT_PRICE_LKR = 250`
- `calculateCourierFee(weightGrams: number): number`
  - 500 LKR for first 1,000g, +150 LKR per additional 1,000g.
- `calculateElectronicsDeliveryFee(method, subtotal): number`
  - Free pickups (University of Ruhuna, Hapugala Shop).
  - Galle Local: 200 LKR (free >3,000 LKR).
  - Courier: Flat 500 LKR for maker electronics (<1kg).

---

## How to Edit

### 1. Adjusting 3D Printing Pricing Formulas
Edit [`server/src/services/pricingService.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/server/src/services/pricingService.ts):
- Machine rates: `machineRatePerHourLkr`
- Handling fees: `handlingCostLkr`
- Print speed assumptions: `flowRateCm3PerHour`

### 2. Changing Courier or Delivery Rules
Edit [`server/src/config/logistics.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/server/src/config/logistics.ts):
- Keep values synchronized with `client/src/config/logistics.ts`.
