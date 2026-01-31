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

## CRITICAL: Pre-Push Validation Workflow

**ALWAYS run validation before pushing any changes:**

```bash
npm run validate
```

This runs:
1. `npm run type-check` - TypeScript compilation (MUST pass)
2. `npm test` - All unit tests (MUST pass)
3. `npm run lint` - ESLint checks
4. `npm run build` - Next.js build (if network allows)

### Minimum Required Checks Before Push
At minimum, these MUST pass before pushing:
```bash
npm run type-check && npm test
```

### Why This Matters
- Vercel runs `next build` which includes TypeScript checking
- Test files are excluded from production tsconfig.json
- If tests have TypeScript errors, they won't break the build
- But source files with errors WILL break deployment

### Common Build Failures
1. **Missing imports in test files** - Test setup must import all vitest globals used
2. **Type errors in source files** - Run `npm run type-check` to catch these
3. **ESM/CommonJS issues** - vitest.config uses .mts extension for ESM

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
- Test setup in tests/setup.ts
- Unit tests in tests/unit/

## Key Files to Understand
- src/lib/maplibre.ts - Map configuration
- src/lib/oim.ts - Open Infrastructure Map integration
- src/lib/ukpn-odp.ts - UKPN API client
- src/data/types.ts - TypeScript interfaces
- tsconfig.json - Production TypeScript config (excludes tests)
- tsconfig.test.json - Test-specific TypeScript config
- vitest.config.mts - Vitest configuration (ESM)

## Testing Requirements
- Unit tests for all utility functions
- Component tests for interactive elements
- E2E tests for critical user flows
- **Run `npm run validate` before pushing**

### Test File Guidelines
- Import all vitest functions explicitly: `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'`
- Mock modules before importing components that use them
- Use `vi.mocked()` to get typed mock references
- Wrap components needing context with appropriate providers

## Context Management
- Check PROGRESS.md before starting any task
- Update PROGRESS.md after completing tasks
- Keep tasks small and focused
- Clear context between major features

## Do NOT
- Use `any` type
- Skip TypeScript errors
- **Commit/push without running `npm run validate`**
- Modify .env files (use .env.example)
- Push directly to main or staging without PR
- Use vitest globals without importing them
- Put test-only code in source files
