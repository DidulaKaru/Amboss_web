# Amboss 3D Print Quotation Engine (`client/src/features/quote`)

This module provides an interactive client-side 3D CAD analysis, visualization, and deterministic quotation tool for Amboss additive manufacturing services in Sri Lanka.

---

## What This Section Does

1. **Client-Side STL Processing:**
   - Parses binary and ASCII `.stl` geometry in a background Web Worker (`client/src/workers/stlVolumeWorker.ts`).
   - Uses the divergence theorem (signed tetrahedron decomposition) to compute exact part volume in cubic centimeters ($\text{cm}^3$) and outer bounding box envelope in millimeters ($\text{mm}$).
2. **Interactive 3D CAD Preview:**
   - Built on Three.js (`PartViewer.tsx`).
   - Features automatic camera framing, orbiting controls, isometric grid ground, wireframe toggle, and bounding box dimensions display.
3. **Deterministic Pricing Calculation:**
   - Evaluates material cost (gram price $\times$ estimated mass).
   - Evaluates machine runtime hourly cost based on print technology (FDM vs. SLA).
   - Adds fixed preparation & QA handling fee.
   - Enforces a minimum manufacturing charge of **250 LKR** (`MINIMUM_PRINT_PRICE_LKR`).
4. **Logistics & WhatsApp Payload Generation:**
   - Computes delivery options: Free pickup at Faculty of Engineering (University of Ruhuna) or Amboss Shop (Hapugala), or islandwide courier (500 LKR for 1st kg, +150 LKR/kg thereafter).
   - Generates a pre-formatted WhatsApp quote request directly to Amboss management.

---

## Directory Structure

```
quote/
├── components/
│   ├── PartViewer.tsx       # Three.js WebGL canvas, lighting, auto-centering, wireframe
│   ├── QuoteForm.tsx        # Parameter inputs (material, infill, layer height, quantity, delivery)
│   └── UploadZone.tsx       # Drag-and-drop file dropzone with binary validation
├── utils/
│   ├── pricing.ts           # Divergence mass calculation & pricing formulas
│   └── stlParser.ts         # Direct array buffer parsing fallback
├── types.ts                 # MaterialOption interface & default MATERIALS catalog
├── QuotePage.tsx            # Full page layout combining viewer, form, and upload dropzone
└── README.md                # This documentation
```

---

## Single Source of Truth (SSOT) References

- **Minimum Manufacturing Charge & Courier Rates:**
  Imported from [`client/src/config/logistics.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/config/logistics.ts):
  - `MINIMUM_PRINT_PRICE_LKR = 250`
  - `calculateCourierFee(weightGrams: number)`
- **Contact & WhatsApp Phone Number:**
  Imported from [`client/src/config/site.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/config/site.ts):
  - `SITE.phone` (`+94779902796`)
- **Materials Catalog:**
  Defined in `types.ts` as `MATERIALS`. Matches server seed data in `server/src/db/seedData.ts`.

---

## How to Edit

### 1. Adding a New 3D Printing Material
Edit `client/src/features/quote/types.ts`:
```ts
export const MATERIALS: MaterialOption[] = [
  // ... existing materials
  {
    id: 'peek',
    name: 'PEEK (Polyetheretherketone)',
    type: 'FDM',
    densityGPerCm3: 1.30,
    pricePerGramLkr: 180,
    tag: 'Ultra-Polymer',
    requiresEnclosure: true,
  },
]
```
Ensure the matching record is added to `server/src/db/seedData.ts`.

### 2. Adjusting Machine Hourly Rates or Formulas
Edit [`client/src/features/quote/utils/pricing.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/features/quote/utils/pricing.ts):
- Machine rates: `machineRatePerHourLkr` (160 LKR/hr for FDM, 250 LKR/hr for SLA).
- Handling fee: `handlingFeeLkr` (250 LKR for FDM, 350 LKR for SLA post-wash & UV cure).
- Infill shell thickness: `shellThicknessCm = 0.12` (1.2 mm).

### 3. Modifying 3D Viewer Appearance
Edit [`client/src/features/quote/components/PartViewer.tsx`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/features/quote/components/PartViewer.tsx):
- Material color: `MeshStandardMaterial` (`color: 0x06b6d4` for cyan industrial highlight).
- Background: `scene.background = new THREE.Color(0x09090b)` (carbon zinc-950).
