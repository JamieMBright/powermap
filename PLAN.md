# PowerMap Implementation Plan

## Overview

PowerMap is a web-based interactive map enabling interaction with UK Power Networks' future investment strategy from now to 2050. It brings the ED3+ business plan to life, showcasing industry leadership in decision-making transparency.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Next.js 14+ (App Router) | Perfect Vercel integration, SSG support, React ecosystem |
| **Language** | TypeScript | Type safety, maintainability |
| **Mapping** | MapLibre GL JS | Open-source, no licensing fees, excellent performance |
| **Hosting** | Vercel | Edge network, easy deploys, serverless functions |
| **Data Strategy** | Pre-computed static JSON | Fastest loading, update on redeploy |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design |

---

## Project Structure

```
powermap/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home/map page
│   │   └── api/                # API routes (if needed)
│   ├── components/
│   │   ├── map/
│   │   │   ├── Map.tsx         # Main MapLibre component
│   │   │   ├── MapControls.tsx # Zoom, layer toggles
│   │   │   └── AssetLayer.tsx  # Asset visualization layer
│   │   ├── timeline/
│   │   │   ├── YearSlider.tsx  # Year selection slider
│   │   │   └── TimelinePlayer.tsx # Animated playback
│   │   ├── filters/
│   │   │   ├── BoundarySelector.tsx # RESP, GSP, LA, LSOA
│   │   │   └── FilterPanel.tsx
│   │   ├── storytelling/       # Guided tour components
│   │   │   ├── TourPlayer.tsx      # Main tour playback
│   │   │   ├── TourControls.tsx    # Navigation controls
│   │   │   ├── ChapterIndicator.tsx # Progress dots
│   │   │   ├── NarrativePanel.tsx  # Story text overlay
│   │   │   ├── TourSelector.tsx    # Browse tours
│   │   │   └── TourCard.tsx        # Tour preview card
│   │   └── ui/                 # Shared UI components
│   ├── hooks/
│   │   ├── useMapData.ts       # Data fetching/filtering
│   │   └── useYearFilter.ts    # Year state management
│   ├── lib/
│   │   ├── maplibre.ts         # MapLibre configuration
│   │   ├── oim.ts              # Open Infrastructure Map integration
│   │   └── boundaries.ts       # Boundary GeoJSON helpers
│   ├── data/
│   │   └── types.ts            # TypeScript interfaces
│   └── styles/
│       └── globals.css         # Global styles + Tailwind
├── public/
│   └── data/
│       ├── assets/             # Pre-computed asset JSON by year
│       │   ├── 2025.json
│       │   ├── 2026.json
│       │   └── ...2050.json
│       ├── boundaries/         # GeoJSON boundary files
│       │   ├── resp.geojson
│       │   ├── gsp.geojson
│       │   ├── la.geojson
│       │   └── lsoa.geojson
│       ├── tours/              # Guided storytelling tours
│       │   ├── index.json          # Tour catalog
│       │   └── [tour-id].json      # Individual tour definitions
│       └── metadata/
│           └── investment-drivers.json
├── scripts/
│   └── generate-data.ts        # Data preparation scripts
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, type-check, unit tests, build
│       ├── security.yml        # Dependency audit, SAST, CodeQL
│       ├── integration.yml     # E2E tests with Playwright
│       ├── docker.yml          # Build and push Docker image
│       └── deploy.yml          # Vercel staging/prod deployments
├── Dockerfile                  # Production multi-stage build
├── Dockerfile.dev              # Development with hot reload
├── docker-compose.yml          # Container orchestration
├── .dockerignore               # Exclude files from build context
├── .env.example                # Template for required env vars
├── .gitignore                  # Git ignore rules
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── playwright.config.ts        # E2E test configuration
└── vitest.config.ts            # Unit test configuration
```

---

## MVP Scope (Phase 1)

### Must-Have Features
1. **Interactive Map**
   - Pan, zoom, click interactions
   - **Open Infrastructure Map base layer** showing existing power infrastructure
   - Asset markers/polygons color-coded by investment type
   - Responsive design (mobile + desktop)

2. **Year Slider**
   - Slider from 2025 → 2050
   - Animated playback option
   - URL state sync (shareable year links)

3. **Multi-Boundary Views**
   - RESP boundaries
   - GSP boundaries
   - Local Authority boundaries
   - LSOA boundaries
   - Toggle between boundary types

4. **Investment Data Display**
   - Aggregate spend by selected boundary
   - Investment driver breakdown
   - Asset count summaries

### Out of Scope for MVP
- RIGS automation (Phase 2)
- SAP integration (Phase 3)
- AI recommendations (Phase 3)
- Customer feedback system (Phase 3)
- Internal/External data separation (Phase 2)

---

## Storytelling & Guided Tours

### Concept

PowerMap is not just a map - it's a way to **explore decisions**. Beyond free exploration, users can experience **guided narrative tours** that explain the rationale behind network investments through a curated, animated journey.

### Story Structure

Each guided tour follows a narrative arc with chapters that control map state, highlights, and annotations. See PLAN.md sections for full TypeScript interfaces.

### Phase 2 Storytelling Enhancements

- Auto-generate tours from EJP documents
- Embed tours in external websites (iframe)
- Share tour links (URL state)
- Analytics on tour engagement
- Multi-language support

---

## Data Sources

### Open Infrastructure Map Integration

PowerMap will ingest base infrastructure data from [Open Infrastructure Map](https://openinframap.org):
- Electrical substations with voltage levels
- Power lines (transmission and distribution)
- Power plants and generation assets

### UK Power Networks Open Data Portal

The [UKPN Open Data Portal](https://ukpowernetworks.opendatasoft.com) provides API access to:
- Network asset locations and metadata
- Substation data
- Embedded Capacity Register (ECR)
- DFES outputs
- Network headroom data

### Boundary Data

Spatial boundaries from public sources:
- **ONS Geoportal** - LA, LSOA boundaries
- **National Grid ESO** - GSP boundaries
- **UKPN** - RESP boundaries

---

## Implementation Phases

### Phase 1: MVP (Target: 4-6 weeks)
| Week | Deliverable |
|------|-------------|
| 1 | Project setup, MapLibre integration, Open Infrastructure Map tile layer |
| 2 | Year slider component, state management |
| 3 | Boundary layer system, GeoJSON loading (RESP, GSP, LA, LSOA) |
| 4 | Investment data overlay, color coding by type/driver |
| 5 | Data aggregation panels, responsive design |
| 6 | Testing, performance optimization, deployment |

### Phase 2: Enhanced Features
- Storytelling/Guided Tours
- RIGS export automation
- Open Data Portal API integration
- Investment driver detail views
- Internal/External layer separation

### Phase 3: Advanced Integration
- SAP maintenance data
- NPT connections visualization
- Geospatial Workplanner sync
- AI optimization suggestions
- Customer feedback portal

---

## CI/CD & Branching Strategy

### Git Branching Model

```
feature/* ──► staging ──► main
    │            │          │
    │            │          └── Vercel Production
    │            └────────────── Vercel Staging/Preview
    └──────────────────────────── PR checks only
```

### Required Secrets (GitHub)

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

---

## Docker Commands

```bash
# Build production image
docker build -t powermap:latest .

# Run production container
docker run -p 3000:3000 --env-file .env.local powermap:latest

# Development with hot reload
docker compose --profile dev up powermap-dev

# Production via compose
docker compose up -d powermap
```

---

## AI Development Orchestration

See:
- `CLAUDE.md` - Project intelligence for Claude
- `AGENTS.md` - Specialized agent definitions with model selection
- `PROGRESS.md` - Progress cache and session state
