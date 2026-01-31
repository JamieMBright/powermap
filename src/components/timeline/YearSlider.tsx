'use client';

import { useYearFilter, MIN_YEAR, MAX_YEAR, KEY_YEARS } from '@/hooks/useYearFilter';
import { useCallback, useState, useEffect, useRef, type ChangeEvent } from 'react';

interface YearSliderProps {
  className?: string;
}

/**
 * Year slider component for navigating through the 2025-2050 timeline.
 * Features animated playback and URL state sync for shareable links.
 * Collapses to a small pill on both mobile and desktop, expands on click.
 * On mobile: auto-hides after inactivity.
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

  // Collapse state (works for both mobile and desktop)
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

  // Auto-collapse after 4 seconds of inactivity (mobile only)
  const resetCollapseTimer = useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    // Only auto-collapse on mobile
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

  const handleCollapse = useCallback(() => {
    if (!isPlaying) {
      setIsExpanded(false);
    }
  }, [isPlaying]);

  // Calculate the percentage for styling the slider track
  const percentage = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  // Collapsed view - small pill showing current year (both mobile and desktop)
  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        data-testid="year-slider"
        className={`group flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg active:scale-95 ${className}`}
        aria-label={`Year ${year}. Click to adjust timeline`}
      >
        <span className="text-sm font-semibold text-orange-600">{year}</span>
        <div className="flex items-center gap-1">
          {/* Mini progress indicator */}
          <div className="hidden h-1 w-12 overflow-hidden rounded-full bg-gray-200 sm:block">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <svg className="h-4 w-4 text-gray-400 transition-colors group-hover:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <div
      data-testid="year-slider"
      className={`relative flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm sm:gap-4 sm:px-8 sm:py-5 ${className}`}
      onTouchStart={resetCollapseTimer}
      onClick={resetCollapseTimer}
    >
      {/* Close/Collapse button */}
      <button
        onClick={handleCollapse}
        className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-gray-50 hover:text-gray-500"
        aria-label="Collapse year slider"
        title="Collapse"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Current Year Display */}
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Year</span>
        <span data-testid="year-display" className="text-3xl font-semibold tabular-nums text-gray-900 sm:text-4xl">
          {year}
        </span>
      </div>

      {/* Controls Row */}
      <div className="flex w-full items-center gap-3 sm:gap-4">
        {/* Previous Year Button */}
        <button
          onClick={() => { previousYear(); resetCollapseTimer(); }}
          disabled={isAtStart}
          data-testid="previous-year-button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:w-9"
          aria-label="Previous year"
          title="Previous year"
        >
          <ChevronLeftIcon />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={() => { togglePlayback(); resetCollapseTimer(); }}
          disabled={isAtEnd && !isPlaying}
          data-testid="play-button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow active:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Slider Container */}
        <div className="relative flex-1 py-2 sm:py-0">
          <div className="relative mx-3 sm:mx-2">
            {/* Slim Track Background */}
            <div className="relative h-1.5 w-full rounded-full bg-gray-100">
              {/* Filled Track */}
              <div
                className="absolute h-full rounded-full bg-orange-500 transition-all duration-100"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Native Slider */}
            <input
              type="range"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={year}
              onChange={handleSliderChange}
              data-testid="year-slider-input"
              className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent touch-manipulation
                [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-orange-500
                [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:active:scale-110
                sm:[&::-webkit-slider-thumb]:h-4 sm:[&::-webkit-slider-thumb]:w-4
                sm:[&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-orange-500
                [&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:transition-transform
                [&::-moz-range-thumb]:active:scale-110
                sm:[&::-moz-range-thumb]:h-4 sm:[&::-moz-range-thumb]:w-4
                sm:[&::-moz-range-thumb]:hover:scale-110"
              aria-label="Select year"
            />
          </div>

          {/* Tick Marks - hidden on mobile */}
          <div className="absolute top-4 left-0 right-0 hidden sm:top-3 sm:block">
            <div className="relative mx-3 sm:mx-2">
              {KEY_YEARS.map((keyYear, index) => {
                const tickPercentage =
                  ((keyYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
                const isCurrentYear = year === keyYear;
                const isFirst = index === 0;
                const isLast = index === KEY_YEARS.length - 1;
                return (
                  <button
                    key={keyYear}
                    onClick={() => { setYear(keyYear); resetCollapseTimer(); }}
                    className={`group absolute flex flex-col ${
                      isFirst ? 'items-start' : isLast ? 'items-end' : 'items-center'
                    }`}
                    style={{
                      left: `${tickPercentage}%`,
                      transform: isFirst ? 'translateX(0)' : isLast ? 'translateX(-100%)' : 'translateX(-50%)',
                    }}
                    title={`Go to ${keyYear}`}
                  >
                    <span
                      className={`text-[10px] tabular-nums transition-colors ${
                        isCurrentYear
                          ? 'font-medium text-orange-600'
                          : 'text-gray-300 group-hover:text-gray-500'
                      }`}
                    >
                      {keyYear}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Next Year Button */}
        <button
          onClick={() => { nextYear(); resetCollapseTimer(); }}
          disabled={isAtEnd}
          data-testid="next-year-button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:w-9"
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
