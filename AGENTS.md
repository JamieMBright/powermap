# PowerMap Agent Definitions

## Model Selection Guide

| Complexity | Model | Use For |
|------------|-------|---------|
| **Low** | Haiku | Orchestration, progress tracking, simple file ops |
| **Medium** | Sonnet | Standard implementation, tests, CI/CD |
| **High** | Opus | Architecture, complex algorithms, debugging |

---

## Context Manager Agent (Overseer)
**Purpose:** Orchestrates all development tasks, manages context, tracks progress
**Model:** Haiku (lightweight orchestration)
**Responsibilities:**
- Read PROGRESS.md at session start
- Assign tasks to specialized agents
- Enforce context clearing between major tasks
- Update PROGRESS.md after task completion
- Maintain project coherence across sessions

**Triggers:**
- Session start: Load progress, assess state
- Task completion: Update progress, clear context
- Error recovery: Assess impact, reassign tasks

---

## Map Agent
**Purpose:** All MapLibre and mapping functionality
**Model:** Opus (complex spatial logic, WebGL, performance optimization)
**Scope:**
- src/components/map/*
- src/lib/maplibre.ts
- src/lib/oim.ts
- Map-related hooks

**Tasks:**
- Map initialization and configuration
- Layer management (OIM, boundaries, assets)
- Map interactions (click, hover, zoom)
- Performance optimization

**Why Opus:** MapLibre requires understanding WebGL rendering, GeoJSON
processing, coordinate systems, and complex state management. Performance
optimization needs sophisticated analysis.

---

## Data Agent
**Purpose:** Data fetching, transformation, and state management
**Model:** Sonnet (standard API work) → Opus (complex transforms)
**Scope:**
- src/lib/ukpn-odp.ts
- src/hooks/useMapData.ts
- public/data/*
- scripts/generate-data.ts

**Tasks:**
- API client implementation (Sonnet)
- Data transformation pipelines (Opus for complex GeoJSON)
- Caching strategies (Sonnet)
- Type definitions (Sonnet)

---

## UI Agent
**Purpose:** User interface components and styling
**Model:** Sonnet (standard components) → Opus (complex animations/a11y)
**Scope:**
- src/components/ui/*
- src/components/timeline/*
- src/components/filters/*
- Tailwind configuration

**Tasks:**
- Component implementation (Sonnet)
- Responsive design (Sonnet)
- Accessibility compliance (Opus - WCAG expertise)
- Animation and transitions (Opus - complex timing)

---

## Test Agent
**Purpose:** Testing and quality assurance
**Model:** Sonnet (unit tests) → Opus (E2E strategy)
**Scope:**
- tests/unit/*
- tests/e2e/*
- Test configuration files

**Tasks:**
- Write unit tests for utilities (Sonnet)
- Write component tests (Sonnet)
- Write E2E tests for user flows (Opus - complex scenarios)
- Maintain test coverage (Haiku - reporting)

---

## DevOps Agent
**Purpose:** CI/CD, Docker, and deployment
**Model:** Sonnet (standard configs) → Opus (optimization)
**Scope:**
- .github/workflows/*
- Dockerfile, docker-compose.yml
- Vercel configuration

**Tasks:**
- CI pipeline maintenance (Sonnet)
- Docker image optimization (Opus - multi-stage builds)
- Deployment configuration (Sonnet)
- Environment management (Haiku - simple updates)

---

## Storytelling Agent
**Purpose:** Guided tour and narrative experience development
**Model:** Opus (narrative design, complex animations)
**Scope:**
- src/components/storytelling/*
- public/data/tours/*
- Map animation sequences

**Tasks:**
- Tour player component (Opus - complex state machine)
- Map camera animations (Opus - smooth transitions, easing)
- Narrative panel UI (Sonnet)
- Tour data schema design (Opus)
- Accessibility for tours (Opus - screen reader, keyboard nav)

**Why Opus:** Storytelling requires sophisticated understanding of:
- Narrative structure and pacing
- Map animation choreography
- State management for multi-step flows
- Accessibility across animated content

---

## Model Selection Rules

1. **Start with the lightest model** that can do the job
2. **Escalate to Opus** when:
   - Task involves complex algorithms
   - Debugging difficult issues
   - Architectural decisions
   - Performance optimization
   - Security-sensitive code

3. **Use Haiku for:**
   - Progress tracking
   - File listing/reading
   - Simple text updates
   - Status reporting
   - Context handoff

4. **Use Sonnet for:**
   - Standard implementation tasks
   - Writing tests
   - Configuration files
   - Documentation
   - Code review
