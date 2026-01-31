import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  MIN_YEAR,
  MAX_YEAR,
  DEFAULT_YEAR,
  KEY_YEARS,
  PLAYBACK_INTERVAL_MS,
} from '@/hooks/useYearFilter';

// Create a mock for the setYearState function
let mockSetYearState: ReturnType<typeof vi.fn>;
let currentMockYear: number;

// Mock nuqs
vi.mock('nuqs', () => ({
  useQueryState: vi.fn(() => [currentMockYear, mockSetYearState]),
  parseAsInteger: {
    withDefault: vi.fn(() => ({})),
  },
}));

describe('useYearFilter constants', () => {
  describe('MIN_YEAR', () => {
    it('should be 2025', () => {
      expect(MIN_YEAR).toBe(2025);
    });
  });

  describe('MAX_YEAR', () => {
    it('should be 2050', () => {
      expect(MAX_YEAR).toBe(2050);
    });
  });

  describe('DEFAULT_YEAR', () => {
    it('should be 2025', () => {
      expect(DEFAULT_YEAR).toBe(2025);
    });

    it('should be equal to MIN_YEAR', () => {
      expect(DEFAULT_YEAR).toBe(MIN_YEAR);
    });
  });

  describe('PLAYBACK_INTERVAL_MS', () => {
    it('should be 1000 milliseconds', () => {
      expect(PLAYBACK_INTERVAL_MS).toBe(1000);
    });
  });

  describe('KEY_YEARS', () => {
    it('should contain expected milestone years', () => {
      expect(KEY_YEARS).toContain(2025);
      expect(KEY_YEARS).toContain(2030);
      expect(KEY_YEARS).toContain(2035);
      expect(KEY_YEARS).toContain(2040);
      expect(KEY_YEARS).toContain(2045);
      expect(KEY_YEARS).toContain(2050);
    });

    it('should have 6 key years', () => {
      expect(KEY_YEARS).toHaveLength(6);
    });

    it('should be in ascending order', () => {
      for (let i = 1; i < KEY_YEARS.length; i++) {
        expect(KEY_YEARS[i]).toBeGreaterThan(KEY_YEARS[i - 1]);
      }
    });

    it('should have 5-year intervals', () => {
      for (let i = 1; i < KEY_YEARS.length; i++) {
        expect(KEY_YEARS[i] - KEY_YEARS[i - 1]).toBe(5);
      }
    });

    it('should start with MIN_YEAR and end with MAX_YEAR', () => {
      expect(KEY_YEARS[0]).toBe(MIN_YEAR);
      expect(KEY_YEARS[KEY_YEARS.length - 1]).toBe(MAX_YEAR);
    });
  });
});

describe('useYearFilter hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSetYearState = vi.fn();
    currentMockYear = DEFAULT_YEAR;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should return the default year', async () => {
      currentMockYear = DEFAULT_YEAR;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.year).toBe(DEFAULT_YEAR);
    });

    it('should not be playing initially', async () => {
      currentMockYear = DEFAULT_YEAR;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isPlaying).toBe(false);
    });

    it('should be at start initially', async () => {
      currentMockYear = MIN_YEAR;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isAtStart).toBe(true);
    });

    it('should not be at end initially', async () => {
      currentMockYear = MIN_YEAR;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isAtEnd).toBe(false);
    });
  });

  describe('setYear', () => {
    it('should update year within valid range', async () => {
      currentMockYear = 2030;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.setYear(2035);
      });

      expect(mockSetYearState).toHaveBeenCalledWith(2035);
    });

    it('should clamp year to MIN_YEAR when below range', async () => {
      currentMockYear = 2030;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.setYear(2000);
      });

      expect(mockSetYearState).toHaveBeenCalledWith(MIN_YEAR);
    });

    it('should clamp year to MAX_YEAR when above range', async () => {
      currentMockYear = 2030;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.setYear(2100);
      });

      expect(mockSetYearState).toHaveBeenCalledWith(MAX_YEAR);
    });
  });

  describe('nextYear', () => {
    it('should increment year by 1', async () => {
      currentMockYear = 2030;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.nextYear();
      });

      expect(mockSetYearState).toHaveBeenCalledWith(2031);
    });

    it('should not increment beyond MAX_YEAR', async () => {
      currentMockYear = MAX_YEAR;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.nextYear();
      });

      expect(mockSetYearState).not.toHaveBeenCalled();
    });
  });

  describe('previousYear', () => {
    it('should decrement year by 1', async () => {
      currentMockYear = 2030;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.previousYear();
      });

      expect(mockSetYearState).toHaveBeenCalledWith(2029);
    });

    it('should not decrement below MIN_YEAR', async () => {
      currentMockYear = MIN_YEAR;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.previousYear();
      });

      expect(mockSetYearState).not.toHaveBeenCalled();
    });
  });

  describe('play/pause controls', () => {
    it('should set isPlaying to true when play is called', async () => {
      currentMockYear = 2030;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should set isPlaying to false when pause is called', async () => {
      currentMockYear = 2030;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      act(() => {
        result.current.play();
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should toggle isPlaying when togglePlayback is called', async () => {
      currentMockYear = 2030;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

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
    it('should return isAtStart true when year is MIN_YEAR', async () => {
      currentMockYear = MIN_YEAR;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isAtStart).toBe(true);
      expect(result.current.isAtEnd).toBe(false);
    });

    it('should return isAtEnd true when year is MAX_YEAR', async () => {
      currentMockYear = MAX_YEAR;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isAtStart).toBe(false);
      expect(result.current.isAtEnd).toBe(true);
    });

    it('should return both false when year is in middle of range', async () => {
      currentMockYear = 2035;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.isAtStart).toBe(false);
      expect(result.current.isAtEnd).toBe(false);
    });
  });

  describe('year clamping from URL state', () => {
    it('should clamp year below MIN_YEAR to MIN_YEAR', async () => {
      currentMockYear = 2000;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.year).toBe(MIN_YEAR);
    });

    it('should clamp year above MAX_YEAR to MAX_YEAR', async () => {
      currentMockYear = 2100;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.year).toBe(MAX_YEAR);
    });

    it('should not clamp valid year', async () => {
      currentMockYear = 2035;
      const { useYearFilter } = await import('@/hooks/useYearFilter');

      const { result } = renderHook(() => useYearFilter());

      expect(result.current.year).toBe(2035);
    });
  });
});
