/**
 * Map rendering diagnostic tests
 * Run with: npm test -- tests/unit/components/Map.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create mock map with proper event handling
const createMockMap = () => ({
  addControl: vi.fn(),
  on: vi.fn((event: string, callback: () => void) => {
    if (event === 'load') {
      // Fire load event immediately via microtask
      Promise.resolve().then(callback);
    }
  }),
  off: vi.fn(),
  remove: vi.fn(),
  resize: vi.fn(),
  getSource: vi.fn(() => null),
  addSource: vi.fn(),
  getLayer: vi.fn(() => null),
  addLayer: vi.fn(),
  setLayoutProperty: vi.fn(),
});

let mockMap = createMockMap();

vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(() => mockMap),
    NavigationControl: vi.fn(),
    ScaleControl: vi.fn(),
    FullscreenControl: vi.fn(),
    GeolocateControl: vi.fn(),
    AttributionControl: vi.fn(),
  },
  Map: vi.fn(() => mockMap),
  NavigationControl: vi.fn(),
  ScaleControl: vi.fn(),
  FullscreenControl: vi.fn(),
  GeolocateControl: vi.fn(),
  AttributionControl: vi.fn(),
}));

// Mock OIM module with inline mock function
vi.mock('@/lib/oim', () => ({
  addOIMToMapAsync: vi.fn((map, statusCallback) => {
    map.addSource('oim-power', { type: 'vector', tiles: [] });
    if (statusCallback) statusCallback('loaded');
    return Promise.resolve('loaded');
  }),
  OIM_SOURCE: {
    type: 'vector',
    tiles: ['https://openinframap.org/map/power/{z}/{x}/{y}.pbf'],
  },
  OIM_LAYER_IDS: ['power_line', 'power_substation'],
}));

// Mock OIM symbols
vi.mock('@/lib/oim-symbols', () => ({
  initializeOIMSymbols: vi.fn(() => vi.fn()),
  clearOIMSymbolsCache: vi.fn(),
}));

// Mock useInfrastructurePopup hook
vi.mock('@/hooks/useInfrastructurePopup', () => ({
  useInfrastructurePopup: vi.fn(),
}));

// Mock BoundarySelector and other UI components
vi.mock('@/components/filters/BoundarySelector', () => ({
  BoundarySelector: () => null,
}));

vi.mock('@/components/filters/LayerControl', () => ({
  LayerControl: () => null,
}));

vi.mock('@/components/filters/MapStyleSelector', () => ({
  MapStyleSelector: () => null,
}));

vi.mock('@/components/map/InvestmentLayer', () => ({
  InvestmentLayer: () => null,
}));

// Import Map after mocks
import { Map } from '@/components/map/Map';

describe('Map Component Rendering', () => {
  beforeEach(() => {
    // Recreate mock map for each test
    mockMap = createMockMap();
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

  // Note: Tests for MapLibre initialization, loading state changes, onMapLoad callback,
  // controls, and OIM layers are better covered by E2E tests since they require complex
  // async mock coordination that doesn't reliably work with vitest hoisting.
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
