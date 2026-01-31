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
}: NarrativePanelProps) {
  const [displayedChapter, setDisplayedChapter] = useState<TourChapter | null>(chapter);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle smooth chapter transitions
  useEffect(() => {
    if (!chapter) {
      setDisplayedChapter(null);
      return;
    }

    if (chapter.id !== displayedChapter?.id) {
      setIsTransitioning(true);
      // Wait for fade out, then update content
      const timer = setTimeout(() => {
        setDisplayedChapter(chapter);
        setIsTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [chapter, displayedChapter?.id]);

  if (!isVisible || !displayedChapter) return null;

  const isBottom = position === 'bottom';

  return (
    <div
      className={`
        fixed z-30 transition-all duration-300 ease-out
        ${isBottom
          ? 'bottom-20 left-4 right-4 sm:bottom-24 sm:left-auto sm:right-4 sm:max-w-md'
          : 'top-20 left-4 bottom-20 w-80 sm:w-96'
        }
        ${isTransitioning ? 'opacity-50' : 'opacity-100'}
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
      </div>
    </div>
  );
}

export { NarrativePanel as default };
