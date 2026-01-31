import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Constants to test
const MIN_YEAR = 2025;
const MAX_YEAR = 2050;
const DEFAULT_YEAR = 2025;
const KEY_YEARS = [2025, 2030, 2035, 2040, 2045, 2050] as const;
const PLAYBACK_INTERVAL_MS = 1000;

// Mock state holder - this will be updated between tests
const mockState = {
  year: DEFAULT_YEAR,
  setYear: vi.fn(),
};

// Mock nuqs before any imports
vi.mock('nuqs', () => ({
  useQueryState: vi.fn(() => [mockState.year, mockState.setYear]),
  parseAsInteger: {
    withDefault: vi.fn(() => ({})),
  },
}));

// Import after mocking
import { useYearFilter } from '@/hooks/useYearFilter';
import {
  MIN_YEAR as ACTUAL_MIN_YEAR,
  MAX_YEAR as ACTUAL_MAX_YEAR,
  DEFAULT_YEAR as ACTUAL_DEFAULT_YEAR,
  KEY_YEARS as ACTUAL_KEY_YEARS,
  PLAYBACK_INTERVAL_MS as ACTUAL_PLAYBACK_INTERVAL_MS,
} from '@/hooks/useYearFilter';
import { useQueryState } from 'nuqs';

describe('useYearFilter constants', () => {
  describe('MIN_YEAR', () => {
    it('should be 2025', () => {
      expect(ACTUAL_MIN_YEAR).toBe(2025);
    });
  });

  describe('MAX_YEAR', () => {
    it('should be 2050', () => {
      expect(ACTUAL_MAX_YEAR).toBe(2050);
    });
  });

  describe('DEFAULT_YEAR', () => {
    it('should be 2025', () => {
      expect(ACTUAL_DEFAULT_YEAR).toBe(2025);
    });

    it('should be equal to MIN_YEAR', () => {
      expect(ACTUAL_DEFAULT_YEAR).toBe(ACTUAL_MIN_YEAR);
    });
  });

  describe('PLAYBACK_INTERVAL_MS', () => {
    it('should be 1000 milliseconds', () => {
      expect(ACTUAL_PLAYBACK_INTERVAL_MS).toBe(1000);
    });
  });

  describe('KEY_YEARS', () => {
    it('should contain expected milestone years', () => {
      expect(ACTUAL_KEY_YEARS).toContain(2025);
      expect(ACTUAL_KEY_YEARS).toContain(2030);
      expect(ACTUAL_KEY_YEARS).toContain(2035);
      expect(ACTUAL_KEY_YEARS).toContain(2040);
      expect(ACTUAL_KEY_YEARS).toContain(2045);
      expect(ACTUAL_KEY_YEARS).toContain(2050);
    });

    it('should have 6 key years', () => {
      expect(ACTUAL_KEY_YEARS).toHaveLength(6);
    });

    it('should be in ascending order', () => {
      for (let i = 1; i < ACTUAL_KEY_YEARS.length; i++) {
        expect(ACTUAL_KEY_YEARS[i]).toBeGreaterThan(ACTUAL_KEY_YEARS[i - 1]);
      }
    });

    it('should have 5-year intervals', () => {
      for (let i = 1; i < ACTUAL_KEY_YEARS.length; i++) {
        expect(ACTUAL_KEY_YEARS[i] - ACTUAL_KEY_YEARS[i - 1]).toBe(5);
      }
    });

    it('should start with MIN_YEAR and end with MAX_YEAR', () => {
      expect(ACTUAL_KEY_YEARS[0]).toBe(ACTUAL_MIN_YEAR);
      expect(ACTUAL_KEY_YEARS[ACTUAL_KEY_YEARS.length - 1]).toBe(ACTUAL_MAX_YEAR);
    });
  });
});

describe('useYearFilter hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset mock state before each test
    mockState.year = DEFAULT_YEAR;
    mockState.setYear = vi.fn();
    // Update the mock implementation
    vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return the default year', () => {
      mockState.year = DEFAULT_YEAR;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.year).toBe(DEFAULT_YEAR);
    });

    it('should not be playing initially', () => {
      mockState.year = DEFAULT_YEAR;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isPlaying).toBe(false);
    });

    it('should be at start initially', () => {
      mockState.year = MIN_YEAR;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isAtStart).toBe(true);
    });

    it('should not be at end initially', () => {
      mockState.year = MIN_YEAR;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isAtEnd).toBe(false);
    });
  });

  describe('setYear', () => {
    it('should update year within valid range', () => {
      mockState.year = 2030;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.setYear(2035);
      });

      expect(mockState.setYear).toHaveBeenCalledWith(2035);
    });

    it('should clamp year to MIN_YEAR when below range', () => {
      mockState.year = 2030;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.setYear(2000);
      });

      expect(mockState.setYear).toHaveBeenCalledWith(MIN_YEAR);
    });

    it('should clamp year to MAX_YEAR when above range', () => {
      mockState.year = 2030;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.setYear(2100);
      });

      expect(mockState.setYear).toHaveBeenCalledWith(MAX_YEAR);
    });
  });

  describe('nextYear', () => {
    it('should increment year by 1', () => {
      mockState.year = 2030;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.nextYear();
      });

      expect(mockState.setYear).toHaveBeenCalledWith(2031);
    });

    it('should not increment beyond MAX_YEAR', () => {
      mockState.year = MAX_YEAR;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.nextYear();
      });

      expect(mockState.setYear).not.toHaveBeenCalled();
    });
  });

  describe('previousYear', () => {
    it('should decrement year by 1', () => {
      mockState.year = 2030;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.previousYear();
      });

      expect(mockState.setYear).toHaveBeenCalledWith(2029);
    });

    it('should not decrement below MIN_YEAR', () => {
      mockState.year = MIN_YEAR;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.previousYear();
      });

      expect(mockState.setYear).not.toHaveBeenCalled();
    });
  });

  describe('play/pause controls', () => {
    it('should set isPlaying to true when play is called', () => {
      mockState.year = 2030;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should set isPlaying to false when pause is called', () => {
      mockState.year = 2030;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.play();
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should toggle isPlaying when togglePlayback is called', () => {
      mockState.year = 2030;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        result.current.togglePlayback();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.togglePlayback();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('isAtStart and isAtEnd', () => {
    it('should return isAtStart true when year is MIN_YEAR', () => {
      mockState.year = MIN_YEAR;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isAtStart).toBe(true);
      expect(result.current.isAtEnd).toBe(false);
    });

    it('should return isAtEnd true when year is MAX_YEAR', () => {
      mockState.year = MAX_YEAR;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isAtStart).toBe(false);
      expect(result.current.isAtEnd).toBe(true);
    });

    it('should return both false when year is in middle of range', () => {
      mockState.year = 2035;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isAtStart).toBe(false);
      expect(result.current.isAtEnd).toBe(false);
    });
  });

  describe('year clamping from URL state', () => {
    it('should clamp year below MIN_YEAR to MIN_YEAR', () => {
      mockState.year = 2000;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.year).toBe(MIN_YEAR);
    });

    it('should clamp year above MAX_YEAR to MAX_YEAR', () => {
      mockState.year = 2100;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.year).toBe(MAX_YEAR);
    });

    it('should not clamp valid year', () => {
      mockState.year = 2035;
      vi.mocked(useQueryState).mockImplementation(() => [mockState.year, mockState.setYear]);

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.year).toBe(2035);
    });
  });
});
