# Amboss Industries (amboss.lk)

Official web platform and engineering portal for **Amboss Industries** — additive manufacturing, precision rapid prototyping, 3D printing bureau, and STEM maker supplies based in Galle, Sri Lanka.

## Monorepo Architecture

```
amboss-monorepo/
├── client/                     # Vite + React (TypeScript) + TailwindCSS
│   ├── public/                 # Static assets, branding, and imagery
│   └── src/                    # Components, pages, context, and shop features
├── server/                     # Fastify + TypeScript + Drizzle ORM (Phase 4)
├── docs/                       # Project documentation & feature summaries
├── guide.md                    # Master execution roadmap
├── progress_tracker.md         # Live development progress tracker
└── package.json                # Monorepo root with npm workspaces
```

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
# Install all dependencies across workspaces
npm install
```

### Development
```bash
# Run the client frontend
npm run dev:client

# Run both client and server concurrently (once server is set up)
npm run dev:all
```

### Build
```bash
# Build all workspaces
npm run build
```

## Production Domain
- Website: [amboss.lk](https://amboss.lk/)
- Project Showcase: [pawsthetics.lk](https://pawsthetics.lk/)
