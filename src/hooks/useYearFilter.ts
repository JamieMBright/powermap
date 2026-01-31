'use client';

import { useQueryState, parseAsInteger } from 'nuqs';
import { useCallback, useEffect, useState } from 'react';

// Year range constants
export const MIN_YEAR = 2025;
export const MAX_YEAR = 2050;
export const DEFAULT_YEAR = 2025;
export const PLAYBACK_INTERVAL_MS = 1000;

// Key years for tick marks
export const KEY_YEARS = [2025, 2030, 2035, 2040, 2045, 2050] as const;

interface UseYearFilterReturn {
  /** Current selected year */
  year: number;
  /** Set the year directly */
  setYear: (year: number) => void;
  /** Whether playback is currently active */
  isPlaying: boolean;
  /** Start playback animation */
  play: () => void;
  /** Pause playback animation */
  pause: () => void;
  /** Toggle play/pause */
  togglePlayback: () => void;
  /** Move to the next year */
  nextYear: () => void;
  /** Move to the previous year */
  previousYear: () => void;
  /** Check if at the start of the range */
  isAtStart: boolean;
  /** Check if at the end of the range */
  isAtEnd: boolean;
}

/**
 * Hook for managing year filter state with URL sync and playback controls.
 * Uses nuqs for URL state management, enabling shareable year links.
 */
export function useYearFilter(): UseYearFilterReturn {
  const [year, setYearState] = useQueryState(
    'year',
    parseAsInteger.withDefault(DEFAULT_YEAR)
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Ensure year is within valid range
  const validYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));

  const setYear = useCallback(
    (newYear: number) => {
      const clampedYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, newYear));
      setYearState(clampedYear);
    },
    [setYearState]
  );

  const nextYear = useCallback(() => {
    if (validYear < MAX_YEAR) {
      setYear(validYear + 1);
    }
  }, [validYear, setYear]);

  const previousYear = useCallback(() => {
    if (validYear > MIN_YEAR) {
      setYear(validYear - 1);
    }
  }, [validYear, setYear]);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Handle playback with timeout-based approach
  // Each time validYear changes, we schedule the next increment
  useEffect(() => {
    if (!isPlaying) return;

    const timeout = setTimeout(() => {
      if (validYear < MAX_YEAR) {
        setYear(validYear + 1);
      }
    }, PLAYBACK_INTERVAL_MS);

    return () => clearTimeout(timeout);
  }, [isPlaying, validYear, setYear]);

  // Stop playback when reaching the end
  useEffect(() => {
    if (validYear >= MAX_YEAR && isPlaying) {
      setIsPlaying(false);
    }
  }, [validYear, isPlaying]);

  return {
    year: validYear,
    setYear,
    isPlaying,
    play,
    pause,
    togglePlayback,
    nextYear,
    previousYear,
    isAtStart: validYear <= MIN_YEAR,
    isAtEnd: validYear >= MAX_YEAR,
  };
}
