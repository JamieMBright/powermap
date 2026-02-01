'use client';

import { Suspense, useState, useCallback, useRef, useEffect } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { Map } from '@/components/map/Map';
import { YearSlider } from '@/components/timeline/YearSlider';
import { TourSelector, TourPlayer } from '@/components/storytelling';
import { useTour } from '@/hooks/useTour';
import { BoundaryProvider, useBoundaryContext } from '@/contexts/BoundaryContext';
import { AggregationPanel } from '@/components/ui/AggregationPanel';
import { useYearFilter } from '@/hooks/useYearFilter';
import { APP_VERSION_SHORT } from '@/lib/version';
import { LandingPage } from '@/components/ui/LandingPage';

export default function Home() {
  const [showLanding, setShowLanding] = useState(true);
  const [hasSeenLanding, setHasSeenLanding] = useState(false);

  // Check if user has seen landing before (persist in sessionStorage)
  useEffect(() => {
    const seen = sessionStorage.getItem('powermap-landing-seen');
    if (seen === 'true') {
      setShowLanding(false);
      setHasSeenLanding(true);
    }
  }, []);

  const handleEnterMap = useCallback(() => {
    sessionStorage.setItem('powermap-landing-seen', 'true');
    setShowLanding(false);
    setHasSeenLanding(true);
  }, []);

  return (
    <BoundaryProvider>
      {showLanding && !hasSeenLanding && (
        <LandingPage onEnter={handleEnterMap} />
      )}
      <Suspense fallback={<PageSkeleton />}>
        <HomeContent />
      </Suspense>
    </BoundaryProvider>
  );
}

function HomeContent() {
  const [isTourSelectorOpen, setIsTourSelectorOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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
      {/* Header - dark navy theme */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-slate-900/95 backdrop-blur-sm shadow-lg border-b border-slate-700/50">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Logo mark */}
            <svg width="28" height="28" viewBox="0 0 80 80" fill="none" className="hidden sm:block">
              <circle cx="40" cy="40" r="36" stroke="#334155" strokeWidth="2" fill="none" />
              <path d="M44 18L28 42h10l-6 20 18-26H40l4-18z" fill="#f97316" />
              <circle cx="40" cy="12" r="3" fill="#f97316" />
              <circle cx="40" cy="68" r="3" fill="#f97316" />
              <circle cx="12" cy="40" r="3" fill="#f97316" />
              <circle cx="68" cy="40" r="3" fill="#f97316" />
            </svg>
            <h1 className="text-lg font-bold text-white sm:text-xl">
              Power<span className="text-orange-500">Map</span>
            </h1>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
              {APP_VERSION_SHORT}
            </span>
          </div>
          {/* Navigation */}
          <nav className="flex items-center gap-2 sm:gap-3">
            {/* Help button with subtle feedback */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="group p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 active:scale-95"
              aria-label="Help"
            >
              <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* Stories button with subtle feedback */}
            <StoriesButton onClick={handleOpenTourSelector} />
            {/* Subtitle - hidden on mobile */}
            <span className="hidden text-sm text-slate-400 lg:inline border-l border-slate-700 pl-3 ml-1">
              Investment Strategy 2025-2050
            </span>
          </nav>
        </div>
      </header>

      {/* Help Modal */}
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}

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

      {/* Attribution - dark theme footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 text-xs text-slate-500 sm:px-4 sm:py-2 border-t border-slate-700/50">
        <div className="flex flex-col items-center gap-0.5 text-center sm:flex-row sm:justify-between sm:text-left">
          <span>© PowerMap | Open Infrastructure Map</span>
          <span className="hidden sm:inline">Built with MapLibre GL JS</span>
        </div>
      </div>
    </main>
  );
}

// Help Modal Component
function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">How to Use PowerMap</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-orange-500 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Stories
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Tap <strong className="text-orange-400">Stories</strong> for narrated journeys through real investment projects.
              See why and where investments are being made.
            </p>
          </section>

          <section>
            <h3 className="text-orange-500 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Year Slider
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Use the slider at the bottom to travel through time from 2025 to 2050.
              Watch investments appear as they&apos;re planned for each year.
            </p>
          </section>

          <section>
            <h3 className="text-orange-500 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Click Any Region
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Click on coloured areas to see investment summaries for that region.
              View breakdowns by investment type and total spend.
            </p>
          </section>

          <section>
            <h3 className="text-orange-500 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Layer Controls
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Use the controls on the left side of the map to toggle power lines,
              substations, and other infrastructure on or off.
            </p>
          </section>

          <div className="pt-4 border-t border-slate-700">
            <p className="text-slate-500 text-xs">
              Data from the network operator&apos;s business plan. Infrastructure via Open Infrastructure Map.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for the entire page while Suspense boundary resolves
function PageSkeleton() {
  return (
    <main className="relative h-screen w-full bg-slate-800">
      {/* Header skeleton */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-slate-900/95 backdrop-blur-sm shadow-lg border-b border-slate-700/50">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-6 w-24 bg-slate-700 rounded animate-pulse" />
            <div className="h-5 w-12 bg-slate-700 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
      {/* Map loading placeholder */}
      <div className="absolute inset-0 z-0 bg-slate-700 animate-pulse" />
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
    <div className="flex flex-col items-center gap-2 rounded-lg bg-slate-800/95 px-3 py-3 shadow-lg backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-4 animate-pulse border border-slate-700">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="h-4 w-8 bg-slate-700 rounded" />
        <div className="h-8 w-16 bg-slate-700 rounded" />
      </div>
      <div className="flex w-full items-center gap-2 sm:gap-3">
        <div className="h-11 w-11 bg-slate-700 rounded-full sm:h-9 sm:w-9" />
        <div className="h-12 w-12 bg-slate-700 rounded-full sm:h-10 sm:w-10" />
        <div className="flex-1 h-3 bg-slate-700 rounded-full sm:h-2" />
        <div className="h-11 w-11 bg-slate-700 rounded-full sm:h-9 sm:w-9" />
      </div>
    </div>
  );
}

// Stories button with one-time attention animation for mobile
function StoriesButton({ onClick }: { onClick: () => void }) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Only show hint once per session and on mobile
    const hasSeenHint = sessionStorage.getItem('powermap-stories-hint-seen');
    const isMobile = window.innerWidth < 640;

    if (!hasSeenHint && isMobile) {
      // Small delay before showing animation so page loads first
      const startTimeout = setTimeout(() => {
        setShowHint(true);
        sessionStorage.setItem('powermap-stories-hint-seen', 'true');

        // Auto-dismiss after 1 second
        const hideTimeout = setTimeout(() => {
          setShowHint(false);
        }, 1000);

        return () => clearTimeout(hideTimeout);
      }, 500);

      return () => clearTimeout(startTimeout);
    }
  }, []);

  return (
    <div className="relative">
      {/* Animated attention ring - only on first visit mobile */}
      {showHint && (
        <div className="absolute inset-0 -m-1 rounded-lg animate-stories-attention pointer-events-none" />
      )}

      {/* Main button */}
      <button
        onClick={onClick}
        className={`
          group relative flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5
          rounded-lg bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-semibold text-sm
          transition-all duration-200 ease-out shadow-lg hover:shadow-orange-500/25 active:scale-[0.98]
          min-h-[40px]
          ${showHint ? 'animate-stories-pulse' : ''}
        `}
        aria-label="Explore investment stories"
      >
        {/* Book/story icon - more intuitive than map icon */}
        <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <span className="text-xs sm:text-sm">Stories</span>
      </button>

      {/* Floating hint text - fades in and out */}
      {showHint && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap animate-stories-hint pointer-events-none sm:hidden">
          <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg">
            Explore our plans
          </div>
        </div>
      )}
    </div>
  );
}
