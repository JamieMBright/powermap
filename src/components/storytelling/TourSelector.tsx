'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TourIndex, TourIndexEntry } from '@/data/tour-types';
import { fetchTourIndex } from '@/hooks/useTour';
import { TourCard } from './TourCard';

interface TourSelectorProps {
  /** Whether the selector is open */
  isOpen: boolean;
  /** Callback to close the selector */
  onClose: () => void;
  /** Callback when a tour is selected */
  onSelectTour: (tourId: string) => void;
}

/**
 * Tour selector panel for browsing and selecting available tours.
 * Displays as a modal/side panel with tour cards.
 */
export function TourSelector({ isOpen, onClose, onSelectTour }: TourSelectorProps) {
  const [tours, setTours] = useState<TourIndexEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tours on mount
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function loadTours() {
      setIsLoading(true);
      setError(null);

      try {
        const index = await fetchTourIndex();
        if (!cancelled) {
          setTours(index.tours);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load tours');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadTours();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle tour selection
  const handleSelectTour = useCallback(
    (tourId: string) => {
      onSelectTour(tourId);
      onClose();
    },
    [onSelectTour, onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[480px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Guided Tours</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Explore UKPN investment stories
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="mt-4 text-sm text-gray-500">Loading tours...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => setIsLoading(true)}
                className="mt-2 text-sm text-red-700 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && tours.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="mt-4 text-gray-500">No tours available yet</p>
            </div>
          )}

          {!isLoading && !error && tours.length > 0 && (
            <div className="space-y-4">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} onSelect={handleSelectTour} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Tours highlight UKPN investment projects and network changes
          </p>
        </div>
      </div>
    </>
  );
}

export { TourSelector as default };
