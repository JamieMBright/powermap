'use client';

import { useEffect, useState } from 'react';
import type { TourChapter } from '@/data/tour-types';

interface NarrativePanelProps {
  /** Current chapter to display */
  chapter: TourChapter | null;
  /** Whether the panel is visible */
  isVisible: boolean;
  /** Position of the panel */
  position?: 'bottom' | 'side';
  /** Whether to show a collapsed view */
  collapsed?: boolean;
  /** Callback to toggle collapsed state */
  onToggleCollapse?: () => void;
  /** Navigation callbacks for mobile integrated controls */
  onPrevious?: () => void;
  onNext?: () => void;
  onExit?: () => void;
  isPreviousDisabled?: boolean;
  isNextDisabled?: boolean;
  isTransitioning?: boolean;
}

/**
 * Overlay panel showing chapter title and narrative text.
 * Positioned at bottom or side of screen with smooth transitions.
 */
export function NarrativePanel({
  chapter,
  isVisible,
  position = 'bottom',
  collapsed = false,
  onToggleCollapse,
  onPrevious,
  onNext,
  onExit,
  isPreviousDisabled = false,
  isNextDisabled = false,
  isTransitioning = false,
}: NarrativePanelProps) {
  const [displayedChapter, setDisplayedChapter] = useState<TourChapter | null>(chapter);
  const [isContentTransitioning, setIsContentTransitioning] = useState(false);

  // Handle smooth chapter transitions
  useEffect(() => {
    if (!chapter) {
      setDisplayedChapter(null);
      return;
    }

    if (chapter.id !== displayedChapter?.id) {
      setIsContentTransitioning(true);
      // Wait for fade out, then update content
      const timer = setTimeout(() => {
        setDisplayedChapter(chapter);
        setIsContentTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [chapter, displayedChapter?.id]);

  if (!isVisible || !displayedChapter) return null;

  const isBottom = position === 'bottom';

  const hasNavigation = onPrevious && onNext && onExit;

  return (
    <div
      className={`
        fixed z-30 transition-all duration-300 ease-out
        ${isBottom
          ? 'bottom-4 left-4 right-4 sm:bottom-24 sm:left-auto sm:right-4 sm:max-w-md'
          : 'top-20 left-4 bottom-20 w-80 sm:w-96'
        }
        ${isContentTransitioning ? 'opacity-50' : 'opacity-100'}
        ${collapsed ? 'translate-y-[calc(100%-3rem)]' : 'translate-y-0'}
      `}
    >
      <div
        className={`
          bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200
          overflow-hidden
          ${isBottom ? '' : 'h-full flex flex-col'}
        `}
      >
        {/* Collapse toggle handle (for bottom position) */}
        {isBottom && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center py-1.5 hover:bg-gray-50 transition-colors"
            aria-label={collapsed ? 'Expand narrative' : 'Collapse narrative'}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </button>
        )}

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">
              {displayedChapter.title}
            </h3>
            {/* Side position collapse button */}
            {!isBottom && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 -mr-1 rounded hover:bg-gray-100 transition-colors shrink-0"
                aria-label={collapsed ? 'Expand narrative' : 'Collapse narrative'}
              >
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content - hidden when collapsed */}
        {!collapsed && (
          <div className={`px-4 py-3 ${isBottom ? '' : 'flex-1 overflow-y-auto'}`}>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {displayedChapter.narrative}
            </p>
          </div>
        )}

        {/* Integrated navigation controls for mobile */}
        {hasNavigation && isBottom && !collapsed && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 sm:hidden">
            {/* Previous button */}
            <button
              onClick={onPrevious}
              disabled={isPreviousDisabled || isTransitioning}
              className={`
                p-2.5 rounded-full transition-all duration-200
                ${isPreviousDisabled || isTransitioning
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm'
                }
                min-w-[44px] min-h-[44px] flex items-center justify-center
              `}
              aria-label="Previous chapter"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Exit button */}
            <button
              onClick={onExit}
              className="
                px-4 py-2 rounded-lg
                bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100
                shadow-sm border border-gray-200 transition-all duration-200
                text-sm font-medium min-h-[44px]
              "
              aria-label="Exit tour"
            >
              Exit Tour
            </button>

            {/* Next button */}
            <button
              onClick={onNext}
              disabled={isNextDisabled || isTransitioning}
              className={`
                p-2.5 rounded-full transition-all duration-200
                ${isNextDisabled || isTransitioning
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm'
                }
                min-w-[44px] min-h-[44px] flex items-center justify-center
              `}
              aria-label="Next chapter"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { NarrativePanel as default };
