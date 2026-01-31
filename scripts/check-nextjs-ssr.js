#!/usr/bin/env node
/**
 * Next.js Static Generation (SSG) Check Script
 *
 * Checks for common issues that cause Vercel build failures:
 * 1. useSearchParams() without Suspense boundary
 * 2. Dynamic imports in pages without proper handling
 * 3. Client hooks used in server components
 */

const fs = require('fs');
const path = require('path');

const ERRORS = [];
const WARNINGS = [];

// Colors for console output
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

/**
 * Recursively find all TypeScript/JavaScript files
 */
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = [];

  if (!fs.existsSync(dir)) return results;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      results.push(...findFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Check if a file uses useSearchParams and has proper Suspense boundary
 */
function checkSearchParamsSuspense(filePath, content) {
  // Check if file uses nuqs or useSearchParams
  const usesSearchParams = content.includes('useSearchParams') ||
                           content.includes('useQueryState') ||
                           content.includes("from 'nuqs'");

  if (!usesSearchParams) return;

  // Check if it's a page file (in app directory)
  const isPage = filePath.includes('/app/') &&
                 (filePath.endsWith('page.tsx') || filePath.endsWith('page.ts'));

  if (isPage) {
    // Check for Suspense boundary wrapping the content
    const hasSuspense = content.includes('<Suspense') && content.includes('</Suspense>');

    if (!hasSuspense) {
      ERRORS.push({
        file: filePath,
        message: 'Page uses useSearchParams/nuqs but lacks Suspense boundary',
        hint: 'Wrap component using useSearchParams in <Suspense fallback={...}>',
        docs: 'https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout'
      });
    } else {
      // Verify Suspense has a fallback prop
      const suspenseMatch = content.match(/<Suspense[^>]*>/g);
      if (suspenseMatch) {
        const hasValidFallback = suspenseMatch.some(s => s.includes('fallback='));
        if (!hasValidFallback) {
          WARNINGS.push({
            file: filePath,
            message: 'Suspense boundary may be missing fallback prop',
            hint: 'Add fallback={<LoadingComponent />} to Suspense'
          });
        }
      }
    }
  }

  // Also check components that might be used in pages
  const isComponent = filePath.includes('/components/');
  if (isComponent && !content.includes("'use client'") && !content.includes('"use client"')) {
    // Component uses search params but might not be marked as client
    WARNINGS.push({
      file: filePath,
      message: 'Component uses useSearchParams/nuqs - ensure parent has Suspense boundary',
      hint: 'Components using URL state should be wrapped in Suspense at the page level'
    });
  }
}

/**
 * Check for client hooks in files without 'use client'
 */
function checkClientDirective(filePath, content) {
  const clientHooks = ['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext'];
  const hasClientHook = clientHooks.some(hook => {
    const regex = new RegExp(`\\b${hook}\\s*\\(`);
    return regex.test(content);
  });

  if (hasClientHook && !content.includes("'use client'") && !content.includes('"use client"')) {
    // Check if it's in app directory (could be server component)
    if (filePath.includes('/app/') && !filePath.includes('/components/')) {
      WARNINGS.push({
        file: filePath,
        message: 'File uses React hooks but may be missing "use client" directive',
        hint: 'Add "use client" at the top of the file if this is a client component'
      });
    }
  }
}

/**
 * Check for dynamic usage in layout files
 */
function checkLayoutDynamic(filePath, content) {
  if (!filePath.endsWith('layout.tsx') && !filePath.endsWith('layout.ts')) return;

  // Check for dynamic imports or hooks that shouldn't be in layouts
  if (content.includes('useSearchParams') || content.includes('useQueryState')) {
    ERRORS.push({
      file: filePath,
      message: 'Layout uses useSearchParams which can cause hydration issues',
      hint: 'Move useSearchParams usage to a child component wrapped in Suspense'
    });
  }
}

/**
 * Main check function
 */
function runChecks() {
  console.log('Checking for Next.js SSG/SSR issues...\n');

  const srcDir = path.join(process.cwd(), 'src');
  const files = findFiles(srcDir);

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      checkSearchParamsSuspense(filePath, content);
      checkClientDirective(filePath, content);
      checkLayoutDynamic(filePath, content);
    } catch (err) {
      console.error(`Error reading ${filePath}: ${err.message}`);
    }
  }

  // Report results
  if (ERRORS.length === 0 && WARNINGS.length === 0) {
    console.log(`${GREEN}✓ No SSG/SSR issues found${RESET}\n`);
    return 0;
  }

  if (WARNINGS.length > 0) {
    console.log(`${YELLOW}Warnings:${RESET}`);
    for (const warning of WARNINGS) {
      console.log(`  ${YELLOW}⚠${RESET} ${warning.file}`);
      console.log(`    ${warning.message}`);
      if (warning.hint) console.log(`    Hint: ${warning.hint}`);
      console.log('');
    }
  }

  if (ERRORS.length > 0) {
    console.log(`${RED}Errors:${RESET}`);
    for (const error of ERRORS) {
      console.log(`  ${RED}✗${RESET} ${error.file}`);
      console.log(`    ${error.message}`);
      if (error.hint) console.log(`    Hint: ${error.hint}`);
      if (error.docs) console.log(`    Docs: ${error.docs}`);
      console.log('');
    }
    return 1;
  }

  return 0;
}

// Run and exit with appropriate code
process.exit(runChecks());
