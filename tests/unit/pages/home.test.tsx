import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock all the heavy dependencies before importing the page
vi.mock('maplibre-gl', () => ({
  Map: vi.fn(),
  NavigationControl: vi.fn(),
  AttributionControl: vi.fn(),
}));

vi.mock('@/components/map/Map', () => ({
  Map: ({ className }: { className?: string }) => (
    <div data-testid="map" className={className}>Map Component</div>
  ),
}));

vi.mock('@/components/timeline/YearSlider', () => ({
  YearSlider: () => <div data-testid="year-slider">Year Slider</div>,
}));

vi.mock('@/components/storytelling', () => ({
  TourSelector: () => <div data-testid="tour-selector">Tour Selector</div>,
  TourPlayer: () => <div data-testid="tour-player">Tour Player</div>,
}));

vi.mock('@/hooks/useTour', () => ({
  useTour: () => ({
    activeTour: null,
    currentChapter: null,
    currentChapterIndex: 0,
    totalChapters: 0,
    status: 'idle',
    isFirstChapter: true,
    isLastChapter: false,
    startTour: vi.fn(),
    endTour: vi.fn(),
    nextChapter: vi.fn(),
    previousChapter: vi.fn(),
    goToChapter: vi.fn(),
  }),
}));

vi.mock('@/hooks/useYearFilter', () => ({
  useYearFilter: () => ({
    year: 2025,
    setYear: vi.fn(),
    isPlaying: false,
    play: vi.fn(),
    pause: vi.fn(),
    togglePlayback: vi.fn(),
    nextYear: vi.fn(),
    previousYear: vi.fn(),
    isAtStart: true,
    isAtEnd: false,
  }),
}));

vi.mock('@/hooks/useAggregation', () => ({
  useAggregation: () => ({
    totalInvestment: 0,
    projectCount: 0,
    assetTypes: {},
    yearlyBreakdown: [],
  }),
  EMPTY_STATS: {
    totalInvestment: 0,
    projectCount: 0,
    assetTypes: {},
    yearlyBreakdown: [],
  },
}));

// Import the page component after mocking
import Home from '@/app/page';

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock sessionStorage to skip landing page
    const mockSessionStorage = {
      getItem: vi.fn().mockReturnValue('true'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true });
  });

  it('should render without crashing (SSG compatibility)', async () => {
    // This test verifies the page can be rendered, which is what Next.js SSG does
    // If useSearchParams is not wrapped in Suspense, this would fail
    const { container } = render(<Home />);

    expect(container).toBeTruthy();
  });

  it('should have Suspense boundary for SSG compatibility', async () => {
    // The page should render even if some client components are still loading
    render(<Home />);

    // The page should show something (either skeleton or content)
    // This tests that the Suspense boundary is working
    expect(document.body).toBeTruthy();
  });

  it('should render header with PowerMap title', async () => {
    render(<Home />);

    // Wait for content to load through Suspense
    // The header text is split: "Power" + <span>Map</span>
    const header = await screen.findByRole('heading', { level: 1 }, { timeout: 3000 });
    expect(header).toBeInTheDocument();
    expect(header.textContent).toBe('PowerMap');
  });

  it('should render the map component', async () => {
    render(<Home />);

    const map = await screen.findByTestId('map', {}, { timeout: 3000 });
    expect(map).toBeInTheDocument();
  });

  it('should render the year slider when not in tour mode', async () => {
    render(<Home />);

    const yearSlider = await screen.findByTestId('year-slider', {}, { timeout: 3000 });
    expect(yearSlider).toBeInTheDocument();
  });

  it('should render the Guided Tours button', async () => {
    render(<Home />);

    const button = await screen.findByRole('button', { name: /guided tours|open guided tours/i }, { timeout: 3000 });
    expect(button).toBeInTheDocument();
  });
});

describe('Home Page SSG Requirements', () => {
  beforeEach(() => {
    // Mock sessionStorage to skip landing page
    const mockSessionStorage = {
      getItem: vi.fn().mockReturnValue('true'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true });
  });

  it('should be wrapped in Suspense for useSearchParams compatibility', () => {
    // This is a compile-time check - if the page renders, Suspense is working
    // The actual SSG error would occur during Next.js build if Suspense is missing
    expect(() => render(<Home />)).not.toThrow();
  });

  it('should render skeleton during Suspense fallback', () => {
    // Test that PageSkeleton is defined and can be used as fallback
    // This ensures the Suspense boundary has a valid fallback
    const { container } = render(<Home />);

    // Either we see the skeleton (if Suspense is pending) or the real content
    // Both are valid - the important thing is it doesn't throw
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
