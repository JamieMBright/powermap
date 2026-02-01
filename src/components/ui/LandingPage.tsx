'use client';

import { useState, useCallback } from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = useCallback(() => {
    setIsExiting(true);
    // Allow animation to complete before calling onEnter
    setTimeout(() => {
      onEnter();
    }, 500);
  }, [onEnter]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 max-w-2xl text-center">
        {/* Logo */}
        <div className="mb-8">
          <PowerMapLogo />
        </div>

        {/* Tagline */}
        <p className="text-slate-400 text-lg sm:text-xl mb-2">
          Electricity Network Investment Strategy
        </p>
        <p className="text-orange-500 font-semibold text-xl sm:text-2xl mb-8">
          2025 — 2050
        </p>

        {/* Brief description */}
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-12 max-w-xl">
          Explore how your electricity network is being transformed to support
          decarbonisation, electric vehicles, and a cleaner future.
        </p>

        {/* Enter button with subtle glow effect */}
        <button
          onClick={handleEnter}
          className="group relative px-10 py-4 bg-orange-500 text-white font-semibold text-lg rounded-lg transition-all duration-300 ease-out hover:bg-orange-400 active:bg-orange-600 active:scale-[0.98] hover:shadow-lg hover:shadow-orange-500/30"
        >
          <span className="relative z-10 flex items-center gap-2">
            Explore the Map
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>

        {/* Help link with subtle hover */}
        <button
          onClick={() => setIsHelpOpen(true)}
          className="mt-8 flex items-center gap-2 text-slate-500 hover:text-white transition-all duration-200 text-sm group"
        >
          <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="group-hover:underline underline-offset-2">What will I see?</span>
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-slate-600 text-xs">
        Built with Open Infrastructure Map data
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <HelpModal onClose={() => setIsHelpOpen(false)} />
      )}
    </div>
  );
}

function PowerMapLogo() {
  return (
    <div className="flex flex-col items-center">
      {/* Icon with entrance animation */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        className="mb-4 animate-logo-entrance"
      >
        {/* Outer ring with rotation animation */}
        <circle
          cx="40" cy="40" r="36"
          stroke="#334155" strokeWidth="2" fill="none"
          className="animate-ring-draw"
          style={{ strokeDasharray: '226', strokeDashoffset: '226' }}
        />

        {/* Power symbol / lightning bolt with flash animation */}
        <path
          d="M44 18L28 42h10l-6 20 18-26H40l4-18z"
          fill="#f97316"
          className="drop-shadow-lg animate-bolt-flash"
        />

        {/* Grid nodes with staggered pulse */}
        <circle cx="40" cy="12" r="3" fill="#f97316" className="animate-node-pulse" style={{ animationDelay: '0.8s' }} />
        <circle cx="40" cy="68" r="3" fill="#f97316" className="animate-node-pulse" style={{ animationDelay: '1.0s' }} />
        <circle cx="12" cy="40" r="3" fill="#f97316" className="animate-node-pulse" style={{ animationDelay: '1.2s' }} />
        <circle cx="68" cy="40" r="3" fill="#f97316" className="animate-node-pulse" style={{ animationDelay: '1.4s' }} />

        {/* Connection lines with fade-in */}
        <g className="animate-lines-fade" style={{ animationDelay: '0.6s' }}>
          <line x1="40" y1="15" x2="40" y2="22" stroke="#475569" strokeWidth="1.5" />
          <line x1="40" y1="58" x2="40" y2="65" stroke="#475569" strokeWidth="1.5" />
          <line x1="15" y1="40" x2="26" y2="40" stroke="#475569" strokeWidth="1.5" />
          <line x1="54" y1="40" x2="65" y2="40" stroke="#475569" strokeWidth="1.5" />
        </g>
      </svg>

      {/* Text with slide-up animation */}
      <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight animate-text-slide">
        Power<span className="text-orange-500">Map</span>
      </h1>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes logo-entrance {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ring-draw {
          0% { stroke-dashoffset: 226; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes bolt-flash {
          0% { opacity: 0; transform: translateY(-10px); }
          50% { opacity: 1; }
          70% { filter: brightness(1.5); }
          100% { opacity: 1; filter: brightness(1); transform: translateY(0); }
        }
        @keyframes node-pulse {
          0% { r: 0; opacity: 0; }
          50% { r: 4; opacity: 1; }
          100% { r: 3; opacity: 1; }
        }
        @keyframes lines-fade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes text-slide {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-logo-entrance {
          animation: logo-entrance 0.6s ease-out forwards;
        }
        .animate-ring-draw {
          animation: ring-draw 1s ease-out 0.3s forwards;
        }
        .animate-bolt-flash {
          animation: bolt-flash 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
        .animate-node-pulse {
          animation: node-pulse 0.4s ease-out forwards;
          opacity: 0;
        }
        .animate-lines-fade {
          animation: lines-fade 0.5s ease-out forwards;
          opacity: 0;
        }
        .animate-text-slide {
          animation: text-slide 0.6s ease-out 0.4s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

interface HelpModalProps {
  onClose: () => void;
}

function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">What You&apos;ll Discover</h2>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Interactive Investment Map
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              See where money is being invested in the electricity network across your region.
              From new substations to upgraded cables, explore the infrastructure that will power
              electric vehicles, heat pumps, and renewable energy.
            </p>
          </section>

          <section>
            <h3 className="text-orange-500 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timeline from 2025 to 2050
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Use the year slider to travel through time and see how investments unfold.
              Watch the network evolve as new projects come online year by year.
            </p>
          </section>

          <section>
            <h3 className="text-orange-500 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Guided Story Tours
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Take a guided tour through real projects. Learn why investments are needed,
              how they&apos;re delivered, and what they mean for your community.
              Perfect if you&apos;re new to energy infrastructure.
            </p>
          </section>

          <section>
            <h3 className="text-orange-500 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Your Local Area
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Click on any region to see investment summaries. Find out what&apos;s planned
              for your local authority, postcode area, or grid supply point.
            </p>
          </section>

          <div className="pt-4 border-t border-slate-700">
            <p className="text-slate-500 text-xs">
              Data sourced from the network operator&apos;s business plan.
              Infrastructure layers provided by Open Infrastructure Map.
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

export default LandingPage;
