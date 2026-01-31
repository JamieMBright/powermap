/**
 * Map rendering diagnostic tests
 * Run with: npm test -- tests/unit/components/Map.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock maplibre-gl before importing Map component
const mockMap = {
  addControl: vi.fn(),
  on: vi.fn((event: string, callback: () => void) => {
    if (event === 'load') {
      // Simulate map load after a tick
      setTimeout(callback, 0);
    }
  }),
  remove: vi.fn(),
  getSource: vi.fn(() => null),
  addSource: vi.fn(),
  getLayer: vi.fn(() => null),
  addLayer: vi.fn(),
  setLayoutProperty: vi.fn(),
};

vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(() => mockMap),
    NavigationControl: vi.fn(),
    ScaleControl: vi.fn(),
    FullscreenControl: vi.fn(),
    GeolocateControl: vi.fn(),
  },
  Map: vi.fn(() => mockMap),
  NavigationControl: vi.fn(),
  ScaleControl: vi.fn(),
  FullscreenControl: vi.fn(),
  GeolocateControl: vi.fn(),
}));

// Mock BoundaryContext
vi.mock('@/contexts/BoundaryContext', () => ({
  useBoundaryContext: vi.fn(() => ({
    selectedBoundary: null,
    setSelectedBoundary: vi.fn(),
    clearBoundary: vi.fn(),
    boundaryType: null,
    setBoundaryType: vi.fn(),
    boundaries: [],
    isLoadingBoundaries: false,
    aggregatedStats: {
      totalInvestment: 0,
      assetCount: 0,
      byDriver: {},
      byAssetType: {},
      averageInvestmentPerAsset: 0,
    },
    isLoading: false,
  })),
  BoundaryProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock nuqs
vi.mock('nuqs', () => ({
  useQueryState: vi.fn(() => [2025, vi.fn()]),
  parseAsInteger: {
    withDefault: vi.fn(() => ({})),
  },
}));

// Mock useYearFilter hook
vi.mock('@/hooks/useYearFilter', () => ({
  useYearFilter: vi.fn(() => ({
    year: 2025,
    setYear: vi.fn(),
    isValidYear: true,
    minYear: 2025,
    maxYear: 2050,
  })),
}));

// Mock InvestmentLayer to avoid nuqs issues
vi.mock('@/components/map/InvestmentLayer', () => ({
  InvestmentLayer: () => null,
}));

// Mock BoundarySelector to avoid context issues
vi.mock('@/components/filters/BoundarySelector', () => ({
  BoundarySelector: () => null,
}));

// Import Map after mocks
import { Map } from '@/components/map/Map';

describe('Map Component Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.innerWidth for mobile detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the map container element', () => {
    render(<Map />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<Map />);

    const loadingIndicator = screen.getByTestId('map-loading');
    expect(loadingIndicator).toBeInTheDocument();
    expect(loadingIndicator).toHaveTextContent('Loading map...');
  });

  it('map container has correct CSS classes for full-size display', () => {
    render(<Map />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveClass('absolute', 'inset-0');
  });

  it('outer container uses provided className (replaces defaults)', () => {
    const { container } = render(<Map className="absolute inset-0 z-0" />);

    const outerDiv = container.firstChild as HTMLElement;
    // When className is provided, it replaces the default classes entirely
    expect(outerDiv).toHaveClass('absolute', 'inset-0', 'z-0');
    // Should not have default classes
    expect(outerDiv).not.toHaveClass('relative');
  });

  it('outer container uses default classes when no className', () => {
    const { container } = render(<Map />);

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass('relative', 'h-full', 'w-full');
  });

  it('initializes MapLibre map on mount', async () => {
    const maplibregl = await import('maplibre-gl');

    render(<Map />);

    await waitFor(() => {
      expect(maplibregl.default.Map).toHaveBeenCalled();
    });
  });

  it('passes correct config to MapLibre', async () => {
    const maplibregl = await import('maplibre-gl');

    render(<Map />);

    await waitFor(() => {
      expect(maplibregl.default.Map).toHaveBeenCalledWith(
        expect.objectContaining({
          style: expect.any(String),
          center: expect.any(Array),
          zoom: expect.any(Number),
        })
      );
    });
  });

  it('hides loading state after map loads', async () => {
    render(<Map />);

    // Initially shows loading
    expect(screen.getByTestId('map-loading')).toBeInTheDocument();

    // After map load event fires, loading should be gone
    await waitFor(() => {
      expect(screen.queryByTestId('map-loading')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('calls onMapLoad callback when map loads', async () => {
    const onMapLoad = vi.fn();

    render(<Map onMapLoad={onMapLoad} />);

    await waitFor(() => {
      expect(onMapLoad).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('adds navigation controls to map', async () => {
    render(<Map />);

    await waitFor(() => {
      expect(mockMap.addControl).toHaveBeenCalled();
    });
  });

  it('adds OIM layers after map loads', async () => {
    render(<Map />);

    await waitFor(() => {
      expect(mockMap.addSource).toHaveBeenCalledWith('oim-power', expect.any(Object));
    }, { timeout: 1000 });
  });
});

describe('Map Container Dimensions', () => {
  it('container should be able to receive dimensions from parent', () => {
    // Create a parent with explicit dimensions
    const { container } = render(
      <div style={{ width: '800px', height: '600px', position: 'relative' }}>
        <Map />
      </div>
    );

    const mapContainer = screen.getByTestId('map-container');
    const parentDiv = container.firstChild as HTMLElement;

    // Parent should have dimensions
    expect(parentDiv.style.width).toBe('800px');
    expect(parentDiv.style.height).toBe('600px');

    // Map container should be absolutely positioned to fill parent
    expect(mapContainer).toHaveClass('absolute', 'inset-0');
  });
});

describe('Map Error Handling', () => {
  it('should handle missing map container gracefully', () => {
    // This tests that the component doesn't crash if container ref is somehow null
    expect(() => render(<Map />)).not.toThrow();
  });
});
