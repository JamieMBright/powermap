'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { TourChapter, TourPlaybackStatus } from '@/data/tour-types';
import { TourControls } from './TourControls';
import { ChapterIndicator } from './ChapterIndicator';
import { NarrativePanel } from './NarrativePanel';

interface TourPlayerProps {
  /** Map instance to control */
  map: MaplibreMap | null;
  /** Current chapter to display */
  currentChapter: TourChapter | null;
  /** Current chapter index */
  currentChapterIndex: number;
  /** Total number of chapters */
  totalChapters: number;
  /** Tour playback status */
  status: TourPlaybackStatus;
  /** Whether at first chapter */
  isFirstChapter: boolean;
  /** Whether at last chapter */
  isLastChapter: boolean;
  /** Tour title */
  tourTitle?: string;
  /** Callback to go to next chapter */
  onNextChapter: () => void;
  /** Callback to go to previous chapter */
  onPreviousChapter: () => void;
  /** Callback to jump to a specific chapter */
  onGoToChapter: (index: number) => void;
  /** Callback to exit the tour */
  onExitTour: () => void;
}

/**
 * Main component that controls tour playback.
 * Manages map camera animations and displays tour UI elements.
 */
export function TourPlayer({
  map,
  currentChapter,
  currentChapterIndex,
  totalChapters,
  status,
  isFirstChapter,
  isLastChapter,
  tourTitle,
  onNextChapter,
  onPreviousChapter,
  onGoToChapter,
  onExitTour,
}: TourPlayerProps) {
  const [isNarrativeCollapsed, setIsNarrativeCollapsed] = useState(false);
  const previousChapterRef = useRef<string | null>(null);

  // Animate map camera when chapter changes
  useEffect(() => {
    if (!map || !currentChapter) return;

    // Skip if same chapter (avoid re-animating on status changes)
    if (previousChapterRef.current === currentChapter.id) return;
    previousChapterRef.current = currentChapter.id;

    const { mapState, transition } = currentChapter;

    // Determine animation options based on transition config
    const animationOptions = {
      center: mapState.center,
      zoom: mapState.zoom,
      pitch: mapState.pitch ?? 0,
      bearing: mapState.bearing ?? 0,
      duration: transition.duration,
      essential: true, // Animation will happen even if user prefers reduced motion
    };

    // Use different animation methods based on easing
    if (transition.easing === 'fly') {
      map.flyTo(animationOptions);
    } else {
      map.easeTo({
        ...animationOptions,
        // easeTo doesn't have curve/speed options, use linear or built-in easing
      });
    }
  }, [map, currentChapter]);

  // Handle narrative collapse toggle
  const handleToggleNarrative = useCallback(() => {
    setIsNarrativeCollapsed((prev) => !prev);
  }, []);

  // Don't render if tour is not active
  if (status === 'idle' || !currentChapter) {
    return null;
  }

  const isTransitioning = status === 'transitioning' || status === 'loading';

  return (
    <>
      {/* Top bar with tour title and chapter indicator */}
      <div className="fixed top-14 left-0 right-0 z-30 sm:top-16">
        <div className="mx-auto max-w-2xl px-4">
          <div className="bg-white/95 backdrop-blur-md rounded-b-xl shadow-lg border-x border-b border-gray-200 px-4 py-3">
            {/* Tour title */}
            {tourTitle && (
              <div className="text-center mb-2">
                <span className="text-xs font-medium text-orange-600 uppercase tracking-wider">
                  Guided Tour
                </span>
                <h2 className="text-sm font-semibold text-gray-900 truncate">
                  {tourTitle}
                </h2>
              </div>
            )}

            {/* Chapter indicator */}
            <ChapterIndicator
              totalChapters={totalChapters}
              currentIndex={currentChapterIndex}
              onChapterClick={onGoToChapter}
            />
          </div>
        </div>
      </div>

      {/* Narrative panel with integrated mobile navigation */}
      <NarrativePanel
        chapter={currentChapter}
        isVisible={status === 'playing' || status === 'paused' || status === 'transitioning'}
        position="bottom"
        collapsed={isNarrativeCollapsed}
        onToggleCollapse={handleToggleNarrative}
        onPrevious={onPreviousChapter}
        onNext={onNextChapter}
        onExit={onExitTour}
        isPreviousDisabled={isFirstChapter}
        isNextDisabled={isLastChapter}
        isTransitioning={isTransitioning}
      />

      {/* Bottom controls - hidden on mobile, visible on desktop */}
      <div className="hidden sm:block fixed bottom-32 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-gray-200 px-3 py-2">
          <TourControls
            onPrevious={onPreviousChapter}
            onNext={onNextChapter}
            onExit={onExitTour}
            isPreviousDisabled={isFirstChapter}
            isNextDisabled={isLastChapter}
            isTransitioning={isTransitioning}
          />
        </div>
      </div>

      {/* Loading overlay during tour load */}
      {status === 'loading' && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="mt-4 text-sm text-gray-600">Loading tour...</p>
          </div>
        </div>
      )}
    </>
  );
}

export { TourPlayer as default };
