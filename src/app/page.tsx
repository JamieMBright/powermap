import { Suspense } from 'react';
import { Map } from '@/components/map/Map';
import { YearSlider } from '@/components/timeline/YearSlider';

export default function Home() {
  return (
    <main className="relative h-screen w-full">
      {/* Header - responsive with hidden subtitle on mobile */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">PowerMap</h1>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              Beta
            </span>
          </div>
          {/* Hidden on mobile, visible on sm and up */}
          <nav className="hidden items-center gap-4 sm:flex">
            <span className="text-sm text-gray-600">
              UK Power Networks Investment Strategy 2025-2050
            </span>
          </nav>
        </div>
      </header>

      {/* Map - positioned behind header/attribution overlays */}
      <Map className="absolute inset-0 z-0" />

      {/* Year Slider - responsive positioning and width */}
      <div className="absolute bottom-16 left-1/2 z-10 w-full max-w-[calc(100%-1rem)] -translate-x-1/2 px-2 sm:bottom-12 sm:max-w-xl sm:px-4">
        <Suspense fallback={<YearSliderSkeleton />}>
          <YearSlider />
        </Suspense>
      </div>

      {/* Attribution - responsive stacking on mobile */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs text-gray-500 sm:px-4 sm:py-2">
        <div className="flex flex-col items-center gap-0.5 text-center sm:flex-row sm:justify-between sm:text-left">
          <span>© UK Power Networks | Open Infrastructure Map</span>
          <span className="hidden sm:inline">Built with MapLibre GL JS</span>
        </div>
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
