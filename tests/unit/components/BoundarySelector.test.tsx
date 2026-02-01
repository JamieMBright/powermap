import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { BoundaryType } from '@/data/types';

// Mock the boundaries module - must be before any imports that use it
vi.mock('@/lib/boundaries', () => {
  const mockAddBoundaryToMap = vi.fn();
  const mockRemoveBoundaryFromMap = vi.fn();
  const mockGetBoundaryFeatureAtPoint = vi.fn();

  return {
    BOUNDARY_CONFIGS: {
      resp: {
        id: 'resp',
        name: 'RESP',
        description: 'Regional Energy Strategic Planner boundaries',
        dataPath: '/data/boundaries/resp.geojson',
        minZoom: 5,
        labelMinZoom: 6,
        colors: {
          fill: '#8b5cf6',
          line: '#7c3aed',
          highlight: '#a78bfa',
        },
      },
      gsp: {
        id: 'gsp',
        name: 'GSP',
        description: 'Grid Supply Point boundaries',
        dataPath: '/data/boundaries/gsp.geojson',
        minZoom: 7,
        labelMinZoom: 9,
        colors: {
          fill: '#3b82f6',
          line: '#2563eb',
          highlight: '#60a5fa',
        },
      },
      la: {
        id: 'la',
        name: 'Local Authority',
        description: 'Local Authority boundaries',
        dataPath: '/data/boundaries/la.geojson',
        minZoom: 8,
        labelMinZoom: 10,
        colors: {
          fill: '#10b981',
          line: '#059669',
          highlight: '#34d399',
        },
      },
      lsoa: {
        id: 'lsoa',
        name: 'LSOA',
        description: 'Lower Layer Super Output Area boundaries',
        dataPath: '/data/boundaries/lsoa.geojson',
        minZoom: 11,
        labelMinZoom: 13,
        colors: {
          fill: '#f59e0b',
          line: '#d97706',
          highlight: '#fbbf24',
        },
      },
    },
    getBoundaryTypes: vi.fn(() => ['resp', 'gsp', 'la', 'lsoa'] as BoundaryType[]),
    getBoundarySourceId: vi.fn((type: string) => `boundary-${type}`),
    addBoundaryToMap: mockAddBoundaryToMap,
    removeBoundaryFromMap: mockRemoveBoundaryFromMap,
    getBoundaryFeatureAtPoint: mockGetBoundaryFeatureAtPoint,
    updateBoundaryChoropleth: vi.fn(),
    resetBoundaryChoropleth: vi.fn(),
  };
});

// Mock useYearFilter hook
vi.mock('@/hooks/useYearFilter', () => ({
  useYearFilter: () => ({
    year: 2025,
    setYear: vi.fn(),
    isPlaying: false,
    togglePlayback: vi.fn(),
  }),
}));

// Mock useBoundaryInvestments hook
vi.mock('@/hooks/useBoundaryInvestments', () => ({
  useBoundaryInvestments: () => ({
    stats: null,
    isLoading: false,
  }),
}));

// Mock useBoundaryTimeSeries hook
vi.mock('@/hooks/useBoundaryTimeSeries', () => ({
  useBoundaryTimeSeries: () => ({
    data: null,
    isLoading: false,
  }),
}));

// Mock MapStyleSelector event
vi.mock('@/components/filters/MapStyleSelector', () => ({
  MAP_STYLE_CHANGE_EVENT: 'map-style-change',
}));

// Mock dynamic import for BoundaryInvestmentChart
vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

// Mock InvestmentDriverSelector
vi.mock('@/components/filters/InvestmentDriverSelector', () => ({
  InvestmentDriverSelector: () => null,
}));

// Mock InvestmentLegend
vi.mock('@/components/ui/InvestmentLegend', () => ({
  InvestmentLegend: () => null,
}));

// Import after mocking
import { BoundarySelector } from '@/components/filters/BoundarySelector';
import { BoundaryProvider } from '@/contexts/BoundaryContext';
import { addBoundaryToMap, removeBoundaryFromMap, getBoundaryFeatureAtPoint } from '@/lib/boundaries';
import type { ReactNode } from 'react';

// Get references to mocked functions
const mockAddBoundaryToMap = vi.mocked(addBoundaryToMap);
const mockRemoveBoundaryFromMap = vi.mocked(removeBoundaryFromMap);
const mockGetBoundaryFeatureAtPoint = vi.mocked(getBoundaryFeatureAtPoint);

// Wrapper component to provide BoundaryContext
function TestWrapper({ children }: { children: ReactNode }) {
  return <BoundaryProvider>{children}</BoundaryProvider>;
}

// Custom render function that includes the wrapper
function renderWithProvider(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

// Create a mock MapLibre map
function createMockMap(): MaplibreMap {
  return {
    on: vi.fn(),
    off: vi.fn(),
    getSource: vi.fn(),
    addSource: vi.fn(),
    removeSource: vi.fn(),
    getLayer: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    setLayoutProperty: vi.fn(),
    setFilter: vi.fn(),
    setPaintProperty: vi.fn(),
    getCanvas: vi.fn(() => ({ style: { cursor: '' } })),
    queryRenderedFeatures: vi.fn(() => []),
  } as unknown as MaplibreMap;
}

describe('BoundarySelector Component', () => {
  let mockMap: MaplibreMap;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMap = createMockMap();
    mockAddBoundaryToMap.mockResolvedValue(undefined);

    // Mock window.innerWidth for desktop view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render the component with default boundary loaded', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for default boundary (GSP) to be loaded
      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });
    });

    it('should render the selector button', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for loading to complete
      await waitFor(() => {
        const button = screen.getByTestId('boundary-selector-button');
        expect(button).toBeInTheDocument();
      });
    });

    it('should apply custom className', () => {
      const { container } = renderWithProvider(
        <BoundarySelector map={mockMap} className="custom-class" />
      );

      const selector = container.querySelector('[data-testid="boundary-selector"]');
      expect(selector).toHaveClass('custom-class');
    });

    it('should render with null map and show Boundaries', () => {
      renderWithProvider(<BoundarySelector map={null} />);

      // With null map, no default loading happens
      expect(screen.getByText('Boundaries')).toBeInTheDocument();
    });
  });

  describe('dropdown menu', () => {
    it('should open dropdown when button is clicked', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for default loading to complete
      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      const button = screen.getByTestId('boundary-selector-button');
      fireEvent.click(button);

      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.getByText('Hide all boundaries')).toBeInTheDocument();
    });

    it('should show all boundary options when open', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      const button = screen.getByTestId('boundary-selector-button');
      fireEvent.click(button);

      expect(screen.getByText('RESP')).toBeInTheDocument();
      // GSP is also in the dropdown, along with button text
      expect(screen.getByText('Local Authority')).toBeInTheDocument();
      expect(screen.getByText('LSOA')).toBeInTheDocument();
    });

    it('should show boundary descriptions', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      const button = screen.getByTestId('boundary-selector-button');
      fireEvent.click(button);

      expect(screen.getByText('Regional Energy Strategic Planner boundaries')).toBeInTheDocument();
      expect(screen.getByText('Grid Supply Point boundaries')).toBeInTheDocument();
    });

    it('should close dropdown after selection', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      const button = screen.getByTestId('boundary-selector-button');
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(screen.queryByText('Hide all boundaries')).not.toBeInTheDocument();
      });
    });
  });

  describe('boundary selection', () => {
    it('should call addBoundaryToMap for default boundary on load', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      // Component auto-loads GSP by default
      await waitFor(() => {
        expect(mockAddBoundaryToMap).toHaveBeenCalledWith(mockMap, 'gsp');
      });
    });

    it('should call addBoundaryToMap when boundary is selected', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for default GSP to load
      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      const button = screen.getByTestId('boundary-selector-button');
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(mockAddBoundaryToMap).toHaveBeenCalledWith(mockMap, 'resp');
      });
    });

    it('should call removeBoundaryFromMap when different boundary is selected', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for default GSP to load
      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      // Select first boundary
      const button = screen.getByTestId('boundary-selector-button');
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(mockRemoveBoundaryFromMap).toHaveBeenCalledWith(mockMap, 'gsp');
        expect(mockAddBoundaryToMap).toHaveBeenCalledWith(mockMap, 'resp');
      });
    });

    it('should clear boundary when "None" is selected', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for default GSP to load
      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      // Clear boundary
      const button = screen.getByTestId('boundary-selector-button');
      fireEvent.click(button);
      const noneOption = screen.getByText('None');
      fireEvent.click(noneOption);

      await waitFor(() => {
        expect(mockRemoveBoundaryFromMap).toHaveBeenCalledWith(mockMap, 'gsp');
      });
    });

    it('should show loading state while loading boundary', async () => {
      // Make addBoundaryToMap slow
      mockAddBoundaryToMap.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProvider(<BoundarySelector map={mockMap} />);

      // The loading state should appear for the default boundary
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show error when boundary loading fails', async () => {
      mockAddBoundaryToMap.mockRejectedValue(new Error('Failed to load boundary'));

      renderWithProvider(<BoundarySelector map={mockMap} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load boundary')).toBeInTheDocument();
      });
    });

    it('should not call addBoundaryToMap when map is null', async () => {
      renderWithProvider(<BoundarySelector map={null} />);

      // With null map, no auto-load
      const button = screen.getByTestId('boundary-selector-button');
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      // Should still not be called
      await waitFor(() => {
        expect(mockAddBoundaryToMap).not.toHaveBeenCalled();
      });
    });
  });

  describe('active boundary display', () => {
    it('should show active boundary name in button after selection', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for default GSP to load
      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      const button = screen.getByTestId('boundary-selector-button');
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(button).toHaveTextContent('RESP');
      });
    });

    it('should show "Boundaries" when map is null', () => {
      renderWithProvider(<BoundarySelector map={null} />);

      const button = screen.getByTestId('boundary-selector-button');
      expect(button).toHaveTextContent('Boundaries');
    });
  });

  describe('toggle behavior', () => {
    it('should toggle dropdown open and closed', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for default to load
      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      const button = screen.getByTestId('boundary-selector-button');

      // Open
      fireEvent.click(button);
      expect(screen.getByText('None')).toBeInTheDocument();

      // Close
      fireEvent.click(button);
      expect(screen.queryByText('None')).not.toBeInTheDocument();
    });
  });

  describe('deselect same boundary', () => {
    it('should deselect boundary when same one is clicked again', async () => {
      renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for default GSP to load
      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      const button = screen.getByTestId('boundary-selector-button');
      fireEvent.click(button);

      // There are now two elements with "GSP" - one in button, one in dropdown
      // Find the one in the dropdown using data-testid
      const gspOption = screen.getByTestId('boundary-option-gsp');
      fireEvent.click(gspOption);

      await waitFor(() => {
        // Clicking same boundary should remove it
        expect(mockRemoveBoundaryFromMap).toHaveBeenCalledWith(mockMap, 'gsp');
      });
    });
  });

  describe('disabled state', () => {
    it('should disable button while loading', async () => {
      mockAddBoundaryToMap.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderWithProvider(<BoundarySelector map={mockMap} />);

      const button = screen.getByTestId('boundary-selector-button');

      // Button should be disabled during initial load
      expect(button).toBeDisabled();
    });
  });

  describe('color indicator', () => {
    it('should show color indicator in button', async () => {
      const { container } = renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for default to load
      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      // The color indicator span should be present
      const colorIndicator = container.querySelector('span[class*="rounded-full"]');
      expect(colorIndicator).toBeInTheDocument();
    });

    it('should show boundary color when boundary is loaded', async () => {
      const { container } = renderWithProvider(<BoundarySelector map={mockMap} />);

      // Wait for default GSP to load
      await waitFor(() => {
        expect(screen.getByText('GSP')).toBeInTheDocument();
      });

      // Color indicator should have GSP color
      const colorIndicator = container.querySelector(
        'span[style*="background-color"]'
      );
      expect(colorIndicator).toBeInTheDocument();
    });
  });
});
