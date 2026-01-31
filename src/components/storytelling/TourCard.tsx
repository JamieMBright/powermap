'use client';

import type { TourIndexEntry } from '@/data/tour-types';

interface TourCardProps {
  /** Tour metadata */
  tour: TourIndexEntry;
  /** Callback when the tour is selected */
  onSelect: (tourId: string) => void;
  /** Whether this card is currently selected */
  isSelected?: boolean;
}

/**
 * Preview card for a single tour.
 * Displays thumbnail, title, duration, and summary.
 */
export function TourCard({ tour, onSelect, isSelected = false }: TourCardProps) {
  return (
    <button
      onClick={() => onSelect(tour.id)}
      className={`
        w-full text-left rounded-lg overflow-hidden
        bg-white border transition-all duration-200
        hover:shadow-lg hover:border-indigo-300
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${isSelected ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-500' : 'border-gray-200 shadow-sm'}
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tour.thumbnail}
          alt={`${tour.title} preview`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
          {tour.duration}
        </div>
        {/* Category badge */}
        {tour.category && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-indigo-600/90 text-white text-xs font-medium rounded">
            {tour.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
          {tour.title}
        </h3>
        <p className="mt-1 text-gray-600 text-xs sm:text-sm line-clamp-2">
          {tour.summary}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>{tour.chapterCount} chapters</span>
        </div>
      </div>
    </button>
  );
}

export { TourCard as default };
