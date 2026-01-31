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
        <YearSlider />
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
