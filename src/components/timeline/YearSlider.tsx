'use client';

import { useYearFilter, MIN_YEAR, MAX_YEAR, KEY_YEARS } from '@/hooks/useYearFilter';
import { useCallback, type ChangeEvent } from 'react';

interface YearSliderProps {
  className?: string;
}

/**
 * Year slider component for navigating through the 2025-2050 timeline.
 * Features animated playback and URL state sync for shareable links.
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

  const handleSliderChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setYear(parseInt(event.target.value, 10));
    },
    [setYear]
  );

  // Calculate the percentage for styling the slider track
  const percentage = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg bg-white/95 px-6 py-4 shadow-lg backdrop-blur-sm ${className}`}
    >
      {/* Current Year Display */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-500">Year</span>
        <span className="text-3xl font-bold tabular-nums text-indigo-600">
          {year}
        </span>
      </div>

      {/* Controls Row */}
      <div className="flex w-full items-center gap-3">
        {/* Previous Year Button */}
        <button
          onClick={previousYear}
          disabled={isAtStart}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous year"
          title="Previous year"
        >
          <ChevronLeftIcon />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayback}
          disabled={isAtEnd && !isPlaying}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Slider Container */}
        <div className="relative flex-1">
          {/* Custom Slider Track Background */}
          <div className="relative h-2 w-full rounded-full bg-gray-200">
            {/* Filled Track */}
            <div
              className="absolute h-full rounded-full bg-indigo-500 transition-all duration-150"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Native Slider (transparent, positioned over the track) */}
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={year}
            onChange={handleSliderChange}
            className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent
              [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-indigo-600
              [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-indigo-600
              [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-transform
              [&::-moz-range-thumb]:hover:scale-110"
            aria-label="Select year"
          />

          {/* Tick Marks */}
          <div className="absolute top-4 flex w-full justify-between px-0">
            {KEY_YEARS.map((keyYear) => {
              const tickPercentage =
                ((keyYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
              const isCurrentYear = year === keyYear;
              return (
                <button
                  key={keyYear}
                  onClick={() => setYear(keyYear)}
                  className="group flex flex-col items-center"
                  style={{
                    position: 'absolute',
                    left: `${tickPercentage}%`,
                    transform: 'translateX(-50%)',
                  }}
                  title={`Go to ${keyYear}`}
                >
                  <div
                    className={`h-2 w-0.5 transition-colors ${
                      isCurrentYear ? 'bg-indigo-600' : 'bg-gray-300 group-hover:bg-gray-400'
                    }`}
                  />
                  <span
                    className={`mt-1 text-xs tabular-nums transition-colors ${
                      isCurrentYear
                        ? 'font-semibold text-indigo-600'
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

        {/* Next Year Button */}
        <button
          onClick={nextYear}
          disabled={isAtEnd}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
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
