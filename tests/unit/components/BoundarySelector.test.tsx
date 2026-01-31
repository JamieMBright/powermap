import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BoundarySelector } from '@/components/filters/BoundarySelector';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { BoundaryType } from '@/data/types';

// Mock the boundaries module
const mockAddBoundaryToMap = vi.fn();
const mockRemoveBoundaryFromMap = vi.fn();
const mockGetBoundaryFeatureAtPoint = vi.fn();

vi.mock('@/lib/boundaries', () => ({
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
  addBoundaryToMap: mockAddBoundaryToMap,
  removeBoundaryFromMap: mockRemoveBoundaryFromMap,
  getBoundaryFeatureAtPoint: mockGetBoundaryFeatureAtPoint,
}));

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
    it('should render the component', () => {
      render(<BoundarySelector map={mockMap} />);

      expect(screen.getByText('Boundaries')).toBeInTheDocument();
    });

    it('should render the selector button', () => {
      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      expect(button).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <BoundarySelector map={mockMap} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render with null map', () => {
      render(<BoundarySelector map={null} />);

      expect(screen.getByText('Boundaries')).toBeInTheDocument();
    });
  });

  describe('dropdown menu', () => {
    it('should open dropdown when button is clicked', () => {
      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.getByText('Hide all boundaries')).toBeInTheDocument();
    });

    it('should show all boundary options when open', () => {
      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      expect(screen.getByText('RESP')).toBeInTheDocument();
      expect(screen.getByText('GSP')).toBeInTheDocument();
      expect(screen.getByText('Local Authority')).toBeInTheDocument();
      expect(screen.getByText('LSOA')).toBeInTheDocument();
    });

    it('should show boundary descriptions', () => {
      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      expect(screen.getByText('Regional Energy Strategic Planner boundaries')).toBeInTheDocument();
      expect(screen.getByText('Grid Supply Point boundaries')).toBeInTheDocument();
    });

    it('should close dropdown after selection', async () => {
      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(screen.queryByText('Hide all boundaries')).not.toBeInTheDocument();
      });
    });
  });

  describe('boundary selection', () => {
    it('should call addBoundaryToMap when boundary is selected', async () => {
      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(mockAddBoundaryToMap).toHaveBeenCalledWith(mockMap, 'resp');
      });
    });

    it('should call removeBoundaryFromMap when different boundary is selected', async () => {
      render(<BoundarySelector map={mockMap} />);

      // Select first boundary
      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(mockAddBoundaryToMap).toHaveBeenCalledWith(mockMap, 'resp');
      });

      // Select different boundary
      fireEvent.click(button);
      const gspOption = screen.getByText('GSP');
      fireEvent.click(gspOption);

      await waitFor(() => {
        expect(mockRemoveBoundaryFromMap).toHaveBeenCalledWith(mockMap, 'resp');
        expect(mockAddBoundaryToMap).toHaveBeenCalledWith(mockMap, 'gsp');
      });
    });

    it('should clear boundary when "None" is selected', async () => {
      render(<BoundarySelector map={mockMap} />);

      // Select boundary
      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(mockAddBoundaryToMap).toHaveBeenCalled();
      });

      // Clear boundary
      fireEvent.click(button);
      const noneOption = screen.getByText('None');
      fireEvent.click(noneOption);

      await waitFor(() => {
        expect(mockRemoveBoundaryFromMap).toHaveBeenCalled();
      });
    });

    it('should show loading state while loading boundary', async () => {
      mockAddBoundaryToMap.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show error when boundary loading fails', async () => {
      mockAddBoundaryToMap.mockRejectedValue(new Error('Failed to load boundary'));

      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(screen.getByText('Failed to load boundary')).toBeInTheDocument();
      });
    });

    it('should not call addBoundaryToMap when map is null', async () => {
      render(<BoundarySelector map={null} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(mockAddBoundaryToMap).not.toHaveBeenCalled();
      });
    });
  });

  describe('active boundary display', () => {
    it('should show active boundary name in button', async () => {
      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(button).toHaveTextContent('RESP');
      });
    });

    it('should show "Boundaries" when no boundary is selected', () => {
      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      expect(button).toHaveTextContent('Boundaries');
    });
  });

  describe('toggle behavior', () => {
    it('should toggle dropdown open and closed', () => {
      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });

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
      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      // Select RESP
      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(mockAddBoundaryToMap).toHaveBeenCalledWith(mockMap, 'resp');
      });

      // Click RESP again
      fireEvent.click(button);
      const respOptionAgain = screen.getByText('RESP');
      fireEvent.click(respOptionAgain);

      await waitFor(() => {
        expect(mockRemoveBoundaryFromMap).toHaveBeenCalledWith(mockMap, 'resp');
      });
    });
  });

  describe('disabled state', () => {
    it('should disable button while loading', async () => {
      mockAddBoundaryToMap.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('color indicator', () => {
    it('should show neutral color when no boundary selected', () => {
      const { container } = render(<BoundarySelector map={mockMap} />);

      // The color indicator span with default gray color
      const colorIndicator = container.querySelector('span[class*="rounded-full"]');
      expect(colorIndicator).toBeInTheDocument();
    });

    it('should show boundary color when boundary is selected', async () => {
      const { container } = render(<BoundarySelector map={mockMap} />);

      const button = screen.getByRole('button', { name: /boundaries/i });
      fireEvent.click(button);

      const respOption = screen.getByText('RESP');
      fireEvent.click(respOption);

      await waitFor(() => {
        const colorIndicator = container.querySelector(
          'span[style*="background-color"]'
        );
        expect(colorIndicator).toBeInTheDocument();
      });
    });
  });
});
