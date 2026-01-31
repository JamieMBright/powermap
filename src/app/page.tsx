import { Map } from '@/components/map/Map';
import { YearSlider } from '@/components/timeline/YearSlider';

export default function Home() {
  return (
    <main className="relative h-screen w-full">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">PowerMap</h1>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              Beta
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              UK Power Networks Investment Strategy 2025-2050
            </span>
          </nav>
        </div>
      </header>

      {/* Map - positioned behind header/attribution overlays */}
      <Map className="absolute inset-0 z-0" />

      {/* Year Slider - positioned above attribution */}
      <div className="absolute bottom-12 left-1/2 z-10 w-full max-w-xl -translate-x-1/2 px-4">
        <YearSlider />
      </div>

      {/* Attribution */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm px-4 py-2 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>© UK Power Networks | Data from Open Infrastructure Map</span>
          <span>Built with MapLibre GL JS</span>
        </div>
      </div>
    </main>
  );
}
