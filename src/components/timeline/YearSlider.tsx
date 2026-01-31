'use client';

import { useYearFilter, MIN_YEAR, MAX_YEAR, KEY_YEARS } from '@/hooks/useYearFilter';
import { useCallback, useState, useEffect, useRef, type ChangeEvent } from 'react';

interface YearSliderProps {
  className?: string;
}

/**
 * Year slider component for navigating through the 2025-2050 timeline.
 * Features animated playback and URL state sync for shareable links.
 * On mobile: collapses to a small pill, expands on tap, auto-hides after inactivity.
 */
export function YearSlider({ className = '' }: YearSliderProps) {
  const {
    year,
    setYear,
    isPlaying,
    togglePlayback,
    nextYear,
    previousYear,
    isAtStart,
    isAtEnd,
  } = useYearFilter();

  // Mobile collapse state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-collapse after 4 seconds of inactivity on mobile
  const resetCollapseTimer = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    if (isMobile && isExpanded && !isPlaying) {
      collapseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 4000);
    }
  }, [isMobile, isExpanded, isPlaying]);

  // Reset timer on any interaction
  useEffect(() => {
    resetCollapseTimer();
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, [resetCollapseTimer, year]);

  // Keep expanded while playing
  useEffect(() => {
    if (isPlaying) {
      setIsExpanded(true);
    }
  }, [isPlaying]);

  const handleSliderChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setYear(parseInt(event.target.value, 10));
      resetCollapseTimer();
    },
    [setYear, resetCollapseTimer]
  );

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    resetCollapseTimer();
  }, [resetCollapseTimer]);

  // Calculate the percentage for styling the slider track
  const percentage = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  // Mobile collapsed view - just a small pill showing current year
  if (isMobile && !isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className={`flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-md backdrop-blur-sm transition-all active:scale-95 ${className}`}
        aria-label={`Year ${year}. Tap to adjust`}
      >
        <span className="text-sm font-semibold text-orange-600">{year}</span>
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    );
  }

  return (
    <div
      data-testid="year-slider"
      className={`flex flex-col items-center gap-2 rounded-lg bg-white/95 px-3 py-3 shadow-lg backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-4 ${className}`}
      onTouchStart={resetCollapseTimer}
      onClick={resetCollapseTimer}
    >
      {/* Mobile: Close button */}
      {isMobile && (
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-500 shadow-sm"
          aria-label="Collapse year slider"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Current Year Display */}
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="text-xs font-medium text-gray-500 sm:text-sm">Year</span>
        <span data-testid="year-display" className="text-2xl font-bold tabular-nums text-orange-600 sm:text-3xl">
          {year}
        </span>
      </div>

      {/* Controls Row */}
      <div className="flex w-full items-center gap-2 sm:gap-3">
        {/* Previous Year Button - 44px min tap target */}
        <button
          onClick={() => { previousYear(); resetCollapseTimer(); }}
          disabled={isAtStart}
          data-testid="previous-year-button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
          aria-label="Previous year"
          title="Previous year"
        >
          <ChevronLeftIcon />
        </button>

        {/* Play/Pause Button - 44px min tap target */}
        <button
          onClick={() => { togglePlayback(); resetCollapseTimer(); }}
          disabled={isAtEnd && !isPlaying}
          data-testid="play-button"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600 active:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Slider Container - larger touch area on mobile */}
        <div className="relative flex-1 py-3 sm:py-0">
          {/* Custom Slider Track Background - taller on mobile for easier touch */}
          <div className="relative h-3 w-full rounded-full bg-gray-200 sm:h-2">
            {/* Filled Track */}
            <div
              className="absolute h-full rounded-full bg-orange-500 transition-all duration-150"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Native Slider - larger thumb on mobile for touch */}
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={year}
            onChange={handleSliderChange}
            data-testid="year-slider-input"
            className="absolute inset-0 h-3 w-full cursor-pointer appearance-none bg-transparent touch-manipulation sm:h-2
              [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-orange-500
              [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:active:scale-110
              sm:[&::-webkit-slider-thumb]:h-5 sm:[&::-webkit-slider-thumb]:w-5
              sm:[&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7
              [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-orange-500
              [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-transform
              [&::-moz-range-thumb]:active:scale-110
              sm:[&::-moz-range-thumb]:h-5 sm:[&::-moz-range-thumb]:w-5
              sm:[&::-moz-range-thumb]:hover:scale-110"
            aria-label="Select year"
          />

          {/* Tick Marks - hidden on mobile */}
          <div className="absolute top-5 hidden w-full justify-between px-0 sm:top-4 sm:flex">
            {KEY_YEARS.map((keyYear) => {
              const tickPercentage =
                ((keyYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
              const isCurrentYear = year === keyYear;
              return (
                <button
                  key={keyYear}
                  onClick={() => { setYear(keyYear); resetCollapseTimer(); }}
                  className="group flex min-h-[44px] min-w-[44px] flex-col items-center justify-start sm:min-h-0 sm:min-w-0"
                  style={{
                    position: 'absolute',
                    left: `${tickPercentage}%`,
                    transform: 'translateX(-50%)',
                  }}
                  title={`Go to ${keyYear}`}
                >
                  <div
                    className={`h-2 w-0.5 transition-colors ${
                      isCurrentYear ? 'bg-orange-500' : 'bg-gray-300 group-hover:bg-gray-400'
                    }`}
                  />
                  <span
                    className={`mt-1 text-xs tabular-nums transition-colors ${
                      isCurrentYear
                        ? 'font-semibold text-orange-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  >
                    {keyYear}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next Year Button - 44px min tap target */}
        <button
          onClick={() => { nextYear(); resetCollapseTimer(); }}
          disabled={isAtEnd}
          data-testid="next-year-button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
          aria-label="Next year"
          title="Next year"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}

// Icon components
function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export { YearSlider as default };
