'use client';

import { Suspense, useState, useCallback, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { Map } from '@/components/map/Map';
import { YearSlider } from '@/components/timeline/YearSlider';
import { TourSelector, TourPlayer } from '@/components/storytelling';
import { useTour } from '@/hooks/useTour';
import { BoundaryProvider, useBoundaryContext } from '@/contexts/BoundaryContext';
import { AggregationPanel } from '@/components/ui/AggregationPanel';
import { useYearFilter } from '@/hooks/useYearFilter';
import { APP_VERSION_SHORT } from '@/lib/version';

export default function Home() {
  return (
    <BoundaryProvider>
      <Suspense fallback={<PageSkeleton />}>
        <HomeContent />
      </Suspense>
    </BoundaryProvider>
  );
}

function HomeContent() {
  const [isTourSelectorOpen, setIsTourSelectorOpen] = useState(false);
  const mapRef = useRef<MaplibreMap | null>(null);

  // Boundary context for aggregation panel
  const { selectedBoundary, clearBoundary, aggregatedStats, isLoading } = useBoundaryContext();

  // Year filter for displaying current year in aggregation panel
  const { year } = useYearFilter();

  const {
    activeTour,
    currentChapter,
    currentChapterIndex,
    totalChapters,
    status,
    isFirstChapter,
    isLastChapter,
    startTour,
    endTour,
    nextChapter,
    previousChapter,
    goToChapter,
  } = useTour();

  // Track map instance
  const handleMapLoad = useCallback((map: MaplibreMap) => {
    mapRef.current = map;
  }, []);

  // Handle tour selection
  const handleSelectTour = useCallback(async (tourId: string) => {
    await startTour(tourId);
  }, [startTour]);

  // Open tour selector
  const handleOpenTourSelector = useCallback(() => {
    setIsTourSelectorOpen(true);
  }, []);

  // Close tour selector
  const handleCloseTourSelector = useCallback(() => {
    setIsTourSelectorOpen(false);
  }, []);

  // Handle closing the aggregation panel
  const handleCloseAggregationPanel = useCallback(() => {
    clearBoundary();
  }, [clearBoundary]);

  const isTourActive = status !== 'idle';

  return (
    <main className="relative h-screen w-full">
      {/* Header - responsive with hidden subtitle on mobile */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">PowerMap</h1>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              {APP_VERSION_SHORT}
            </span>
          </div>
          {/* Navigation - Hidden on mobile, visible on sm and up */}
          <nav className="flex items-center gap-3 sm:gap-4">
            {/* Guided Tours button - Prominent with animation */}
            <button
              onClick={handleOpenTourSelector}
              className="
                relative flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3
                rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm sm:text-base
                hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800
                transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105
                min-h-[44px] sm:min-h-[48px]
                animate-pulse-subtle
              "
              aria-label="Open guided tours"
            >
              {/* Glow effect */}
              <span className="absolute inset-0 rounded-xl bg-orange-400 opacity-0 blur-md transition-opacity group-hover:opacity-30" />
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <span>Explore Tours</span>
              {/* "New" indicator badge */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-orange-300 text-[8px] sm:text-[10px] font-bold text-orange-800 items-center justify-center">!</span>
              </span>
            </button>
            {/* Subtitle - hidden on mobile */}
            <span className="hidden text-sm text-gray-600 lg:inline">
              Electricity Network Investment Strategy 2025-2050
            </span>
          </nav>
        </div>
      </header>

      {/* Map - positioned behind header/attribution overlays */}
      <Map className="absolute inset-0 z-0" onMapLoad={handleMapLoad} />

      {/* Year Slider - responsive positioning and width */}
      {/* Hide during active tour to avoid UI clutter */}
      {!isTourActive && (
        <div className="absolute bottom-16 left-1/2 z-10 w-full max-w-[calc(100%-1rem)] -translate-x-1/2 px-2 sm:bottom-12 sm:max-w-xl sm:px-4">
          <Suspense fallback={<YearSliderSkeleton />}>
            <YearSlider />
          </Suspense>
        </div>
      )}

      {/* Aggregation Panel - shows when a boundary is selected */}
      <AggregationPanel
        selectedBoundary={selectedBoundary}
        stats={aggregatedStats}
        year={year}
        onClose={handleCloseAggregationPanel}
        isLoading={isLoading}
      />

      {/* Tour Player - only visible during active tour */}
      <TourPlayer
        map={mapRef.current}
        currentChapter={currentChapter}
        currentChapterIndex={currentChapterIndex}
        totalChapters={totalChapters}
        status={status}
        isFirstChapter={isFirstChapter}
        isLastChapter={isLastChapter}
        tourTitle={activeTour?.title}
        onNextChapter={nextChapter}
        onPreviousChapter={previousChapter}
        onGoToChapter={goToChapter}
        onExitTour={endTour}
      />

      {/* Tour Selector Panel */}
      <TourSelector
        isOpen={isTourSelectorOpen}
        onClose={handleCloseTourSelector}
        onSelectTour={handleSelectTour}
      />

      {/* Attribution - responsive stacking on mobile */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs text-gray-500 sm:px-4 sm:py-2">
        <div className="flex flex-col items-center gap-0.5 text-center sm:flex-row sm:justify-between sm:text-left">
          <span>© PowerMap | Open Infrastructure Map</span>
          <span className="hidden sm:inline">Built with MapLibre GL JS</span>
        </div>
      </div>
    </main>
  );
}

// Loading skeleton for the entire page while Suspense boundary resolves
function PageSkeleton() {
  return (
    <main className="relative h-screen w-full bg-gray-100">
      {/* Header skeleton */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
      {/* Map loading placeholder */}
      <div className="absolute inset-0 z-0 bg-gray-200 animate-pulse" />
      {/* Year slider skeleton */}
      <div className="absolute bottom-16 left-1/2 z-10 w-full max-w-[calc(100%-1rem)] -translate-x-1/2 px-2 sm:bottom-12 sm:max-w-xl sm:px-4">
        <YearSliderSkeleton />
      </div>
    </main>
  );
}

// Loading skeleton for YearSlider while Suspense boundary resolves
function YearSliderSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-white/95 px-3 py-3 shadow-lg backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-4 animate-pulse">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="h-4 w-8 bg-gray-200 rounded" />
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </div>
      <div className="flex w-full items-center gap-2 sm:gap-3">
        <div className="h-11 w-11 bg-gray-200 rounded-full sm:h-9 sm:w-9" />
        <div className="h-12 w-12 bg-gray-200 rounded-full sm:h-10 sm:w-10" />
        <div className="flex-1 h-3 bg-gray-200 rounded-full sm:h-2" />
        <div className="h-11 w-11 bg-gray-200 rounded-full sm:h-9 sm:w-9" />
      </div>
    </div>
  );
}
