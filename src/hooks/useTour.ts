'use client';

import { useState, useCallback, useMemo } from 'react';
import type {
  Tour,
  TourChapter,
  TourState,
  TourPlaybackStatus,
  UseTourReturn,
  TourIndex,
} from '@/data/tour-types';

/**
 * Fetches the tour index from the server
 */
export async function fetchTourIndex(): Promise<TourIndex> {
  const response = await fetch('/data/tours/index.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch tour index: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetches a specific tour by ID
 */
async function fetchTour(tourId: string): Promise<Tour> {
  const response = await fetch(`/data/tours/${tourId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tour ${tourId}: ${response.status}`);
  }
  return response.json();
}

/**
 * Initial state for the tour hook
 */
const initialState: TourState = {
  activeTour: null,
  currentChapterIndex: 0,
  status: 'idle',
  error: null,
};

/**
 * Hook for managing guided tour state and playback.
 *
 * @example
 * ```tsx
 * const {
 *   activeTour,
 *   currentChapter,
 *   startTour,
 *   nextChapter,
 *   previousChapter,
 *   endTour
 * } = useTour();
 *
 * // Start a tour
 * await startTour('barking-grid-2028');
 *
 * // Navigate chapters
 * nextChapter();
 * previousChapter();
 * goToChapter(2);
 *
 * // End the tour
 * endTour();
 * ```
 */
export function useTour(): UseTourReturn {
  const [state, setState] = useState<TourState>(initialState);

  // Derived state: current chapter
  const currentChapter = useMemo<TourChapter | null>(() => {
    if (!state.activeTour) return null;
    return state.activeTour.chapters[state.currentChapterIndex] ?? null;
  }, [state.activeTour, state.currentChapterIndex]);

  // Derived state: navigation flags
  const isFirstChapter = state.currentChapterIndex === 0;
  const isLastChapter = state.activeTour
    ? state.currentChapterIndex >= state.activeTour.chapters.length - 1
    : true;
  const totalChapters = state.activeTour?.chapters.length ?? 0;

  /**
   * Start a tour by fetching its data and setting initial state
   */
  const startTour = useCallback(async (tourId: string): Promise<void> => {
    setState((prev) => ({
      ...prev,
      status: 'loading',
      error: null,
    }));

    try {
      const tour = await fetchTour(tourId);
      setState({
        activeTour: tour,
        currentChapterIndex: 0,
        status: 'playing',
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'idle',
        error: error instanceof Error ? error.message : 'Failed to load tour',
      }));
    }
  }, []);

  /**
   * End the current tour and reset state
   */
  const endTour = useCallback((): void => {
    setState(initialState);
  }, []);

  /**
   * Navigate to the next chapter
   */
  const nextChapter = useCallback((): void => {
    setState((prev) => {
      if (!prev.activeTour) return prev;
      const nextIndex = prev.currentChapterIndex + 1;
      if (nextIndex >= prev.activeTour.chapters.length) return prev;

      return {
        ...prev,
        currentChapterIndex: nextIndex,
        status: 'transitioning',
      };
    });

    // Set status back to playing after transition starts
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        status: prev.status === 'transitioning' ? 'playing' : prev.status,
      }));
    }, 100);
  }, []);

  /**
   * Navigate to the previous chapter
   */
  const previousChapter = useCallback((): void => {
    setState((prev) => {
      if (!prev.activeTour) return prev;
      const prevIndex = prev.currentChapterIndex - 1;
      if (prevIndex < 0) return prev;

      return {
        ...prev,
        currentChapterIndex: prevIndex,
        status: 'transitioning',
      };
    });

    // Set status back to playing after transition starts
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        status: prev.status === 'transitioning' ? 'playing' : prev.status,
      }));
    }, 100);
  }, []);

  /**
   * Jump to a specific chapter by index
   */
  const goToChapter = useCallback((index: number): void => {
    setState((prev) => {
      if (!prev.activeTour) return prev;
      if (index < 0 || index >= prev.activeTour.chapters.length) return prev;
      if (index === prev.currentChapterIndex) return prev;

      return {
        ...prev,
        currentChapterIndex: index,
        status: 'transitioning',
      };
    });

    // Set status back to playing after transition starts
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        status: prev.status === 'transitioning' ? 'playing' : prev.status,
      }));
    }, 100);
  }, []);

  /**
   * Pause the tour
   */
  const pause = useCallback((): void => {
    setState((prev) => {
      if (prev.status !== 'playing' && prev.status !== 'transitioning') return prev;
      return { ...prev, status: 'paused' };
    });
  }, []);

  /**
   * Resume the tour
   */
  const resume = useCallback((): void => {
    setState((prev) => {
      if (prev.status !== 'paused') return prev;
      return { ...prev, status: 'playing' };
    });
  }, []);

  return {
    // State
    activeTour: state.activeTour,
    currentChapterIndex: state.currentChapterIndex,
    status: state.status,
    error: state.error,

    // Derived state
    currentChapter,
    isFirstChapter,
    isLastChapter,
    totalChapters,

    // Actions
    startTour,
    endTour,
    nextChapter,
    previousChapter,
    goToChapter,
    pause,
    resume,
  };
}

export { useTour as default };
