'use client';

import { useEffect, useCallback } from 'react';

interface TourControlsProps {
  /** Callback for previous chapter */
  onPrevious: () => void;
  /** Callback for next chapter */
  onNext: () => void;
  /** Callback to exit the tour */
  onExit: () => void;
  /** Whether the previous button is disabled */
  isPreviousDisabled: boolean;
  /** Whether the next button is disabled */
  isNextDisabled: boolean;
  /** Whether the tour is currently transitioning */
  isTransitioning?: boolean;
}

/**
 * Navigation controls for tour playback.
 * Includes previous/next buttons and exit button with keyboard support.
 */
export function TourControls({
  onPrevious,
  onNext,
  onExit,
  isPreviousDisabled,
  isNextDisabled,
  isTransitioning = false,
}: TourControlsProps) {
  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (!isPreviousDisabled) {
            e.preventDefault();
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (!isNextDisabled) {
            e.preventDefault();
            onNext();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onExit();
          break;
      }
    },
    [onPrevious, onNext, onExit, isPreviousDisabled, isNextDisabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex items-center gap-2">
      {/* Previous button */}
      <button
        onClick={onPrevious}
        disabled={isPreviousDisabled || isTransitioning}
        className={`
          p-2 sm:p-2.5 rounded-full transition-all duration-200
          ${isPreviousDisabled || isTransitioning
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm border border-gray-200'
          }
          min-w-[44px] min-h-[44px] flex items-center justify-center
        `}
        aria-label="Previous chapter"
        title="Previous chapter (Left arrow)"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Exit button */}
      <button
        onClick={onExit}
        className="
          px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg
          bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100
          shadow-sm border border-gray-200 transition-all duration-200
          text-sm font-medium min-h-[44px]
        "
        aria-label="Exit tour"
        title="Exit tour (Escape)"
      >
        <span className="hidden sm:inline">Exit Tour</span>
        <svg className="w-5 h-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={isNextDisabled || isTransitioning}
        className={`
          p-2 sm:p-2.5 rounded-full transition-all duration-200
          ${isNextDisabled || isTransitioning
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm'
          }
          min-w-[44px] min-h-[44px] flex items-center justify-center
        `}
        aria-label="Next chapter"
        title="Next chapter (Right arrow)"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export { TourControls as default };
