'use client';

interface ChapterIndicatorProps {
  /** Total number of chapters */
  totalChapters: number;
  /** Current chapter index (0-based) */
  currentIndex: number;
  /** Callback when a chapter dot is clicked */
  onChapterClick: (index: number) => void;
  /** Whether the indicator is in a compact mode */
  compact?: boolean;
}

/**
 * Progress dots showing current position in tour.
 * Clickable to jump to any chapter.
 */
export function ChapterIndicator({
  totalChapters,
  currentIndex,
  onChapterClick,
  compact = false,
}: ChapterIndicatorProps) {
  const dots = Array.from({ length: totalChapters }, (_, i) => i);

  return (
    <div
      className={`flex items-center justify-center gap-2 ${compact ? 'gap-1.5' : 'gap-2'}`}
      role="navigation"
      aria-label="Tour chapters"
    >
      {dots.map((index) => {
        const isCurrent = index === currentIndex;
        const isPast = index < currentIndex;

        return (
          <button
            key={index}
            onClick={() => onChapterClick(index)}
            className={`
              rounded-full transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
              ${compact ? 'w-2 h-2' : 'w-3 h-3'}
              ${isCurrent
                ? 'bg-orange-500 scale-110'
                : isPast
                  ? 'bg-orange-400 hover:bg-orange-500'
                  : 'bg-gray-300 hover:bg-gray-400'
              }
            `}
            aria-label={`Go to chapter ${index + 1}`}
            aria-current={isCurrent ? 'step' : undefined}
          />
        );
      })}
      {/* Chapter count text */}
      {!compact && (
        <span className="ml-2 text-xs text-gray-500 font-medium">
          {currentIndex + 1} / {totalChapters}
        </span>
      )}
    </div>
  );
}

export { ChapterIndicator as default };
