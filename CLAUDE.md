# PowerMap - Claude Development Guide

## Project Overview
PowerMap is a Next.js 14 web application for visualizing UK Power Networks'
investment strategy from 2025-2050 using MapLibre GL JS.

## Tech Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript (strict mode)
- Mapping: MapLibre GL JS
- Styling: Tailwind CSS
- Testing: Vitest (unit), Playwright (e2e)
- Data: Pre-computed JSON, UKPN ODP API

## Code Conventions
- Use functional components with hooks
- Prefer named exports over default exports
- Use TypeScript strict mode - no `any` types
- Component files: PascalCase (Map.tsx)
- Utility files: camelCase (mapHelpers.ts)
- Test files: *.test.ts or *.spec.ts

## File Structure Patterns
- Components in src/components/{feature}/
- Hooks in src/hooks/
- Utilities in src/lib/
- Types in src/data/types.ts
- Static data in public/data/

## Key Files to Understand
- src/lib/maplibre.ts - Map configuration
- src/lib/oim.ts - Open Infrastructure Map integration
- src/lib/ukpn-odp.ts - UKPN API client
- src/data/types.ts - TypeScript interfaces

## Testing Requirements
- Unit tests for all utility functions
- Component tests for interactive elements
- E2E tests for critical user flows
- Run `npm test` before committing

## Context Management
- Check PROGRESS.md before starting any task
- Update PROGRESS.md after completing tasks
- Keep tasks small and focused
- Clear context between major features

## Do NOT
- Use `any` type
- Skip TypeScript errors
- Commit without running tests
- Modify .env files (use .env.example)
- Push directly to main or staging
