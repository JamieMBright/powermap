#!/bin/bash
# Pre-push validation script for PowerMap
# Run this before pushing to ensure the build will succeed on Vercel

set -e  # Exit on any error

echo "=========================================="
echo "PowerMap Build Validation"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# Function to run a check
run_check() {
    local name="$1"
    local cmd="$2"

    echo ""
    echo -e "${YELLOW}▶ Running: ${name}${NC}"

    if eval "$cmd"; then
        echo -e "${GREEN}✓ ${name} passed${NC}"
    else
        echo -e "${RED}✗ ${name} failed${NC}"
        FAILED=1
    fi
}

# 1. TypeScript type checking (most important - this is what broke the Vercel build)
run_check "TypeScript Check" "npm run type-check"

# 2. Next.js SSG/SSR checks (catches useSearchParams without Suspense, etc.)
run_check "Next.js SSG Checks" "node scripts/check-nextjs-ssr.js"

# 3. Unit tests
run_check "Unit Tests" "npm test"

# 4. Linting (informational - doesn't block Vercel build)
echo ""
echo -e "${YELLOW}▶ Running: ESLint (informational)${NC}"
LINT_OUTPUT=$(npm run lint 2>&1 || true)
LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c "error" || echo "0")
LINT_WARNINGS=$(echo "$LINT_OUTPUT" | grep -c "warning" || echo "0")
echo -e "${YELLOW}  Found $LINT_ERRORS errors, $LINT_WARNINGS warnings${NC}"
echo -e "${YELLOW}  (Lint errors don't block Vercel build, but should be fixed)${NC}"

# 5. Try to build (skip if network issues with fonts)
echo ""
echo -e "${YELLOW}▶ Running: Next.js Build${NC}"
if npm run build 2>&1; then
    echo -e "${GREEN}✓ Next.js Build passed${NC}"
else
    BUILD_OUTPUT=$(npm run build 2>&1 || true)
    if echo "$BUILD_OUTPUT" | grep -q "Failed to fetch.*Google Fonts\|Error while requesting resource"; then
        echo -e "${YELLOW}⚠ Build skipped - Google Fonts network issue (will work on Vercel)${NC}"
    else
        echo -e "${RED}✗ Next.js Build failed${NC}"
        echo "$BUILD_OUTPUT"
        FAILED=1
    fi
fi

# Summary
echo ""
echo "=========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Safe to push.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Fix issues before pushing.${NC}"
    exit 1
fi
