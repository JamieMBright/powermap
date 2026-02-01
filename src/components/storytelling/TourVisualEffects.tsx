'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MaplibreMap, Marker } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import type { ChapterVisualEffect } from '@/data/tour-types';

interface TourVisualEffectsProps {
  map: MaplibreMap | null;
  effects: ChapterVisualEffect[];
}

/**
 * Renders visual effects on the map for storytelling.
 * Supports pulsing effects, icon overlays, and animated visualizations.
 */
export function TourVisualEffects({ map, effects }: TourVisualEffectsProps) {
  const markersRef = useRef<Marker[]>([]);
  const [, forceUpdate] = useState(0);

  // Clean up markers when effects change
  useEffect(() => {
    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!map || effects.length === 0) return;

    // Create new markers for each effect
    effects.forEach(effect => {
      const element = createEffectElement(effect);
      if (!element) return;

      const marker = new maplibregl.Marker({
        element,
        anchor: 'center',
      })
        .setLngLat(effect.position)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Force re-render to ensure markers are displayed
    forceUpdate(n => n + 1);

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [map, effects]);

  return null; // This component only manages markers, no React DOM output
}

/**
 * Creates the HTML element for a visual effect
 */
function createEffectElement(effect: ChapterVisualEffect): HTMLElement | null {
  const config = effect.config ?? {};
  const color = config.color ?? '#f97316'; // Orange default
  const scale = config.scale ?? 1;
  const duration = config.animationDuration ?? 2000;

  switch (effect.type) {
    case 'pulse':
      return createPulseEffect(color, scale, duration, effect.label);

    case 'spotlight':
      return createSpotlightEffect(color, scale);

    case 'icon-overlay':
      return createIconOverlay(config.icon ?? 'substation', scale, effect.label);

    case 'demand-meter':
      return createDemandMeter(config.demandValue ?? 50, color, effect.label);

    case 'flow-animation':
      return createFlowAnimation(config.flowDirection ?? 'in', color, scale);

    default:
      return null;
  }
}

/**
 * Creates a pulsing glow effect element
 */
function createPulseEffect(
  color: string,
  scale: number,
  duration: number,
  label?: string
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tour-effect-pulse';
  container.style.cssText = `
    position: relative;
    width: ${80 * scale}px;
    height: ${80 * scale}px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Outer pulsing ring
  const ring = document.createElement('div');
  ring.style.cssText = `
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: ${color}20;
    border: 3px solid ${color};
    animation: tour-pulse-ring ${duration}ms ease-out infinite;
  `;
  container.appendChild(ring);

  // Second ring with delay
  const ring2 = document.createElement('div');
  ring2.style.cssText = `
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: ${color}10;
    border: 2px solid ${color}80;
    animation: tour-pulse-ring ${duration}ms ease-out infinite ${duration / 2}ms;
  `;
  container.appendChild(ring2);

  // Center dot
  const center = document.createElement('div');
  center.style.cssText = `
    width: ${20 * scale}px;
    height: ${20 * scale}px;
    border-radius: 50%;
    background: ${color};
    box-shadow: 0 0 20px ${color}80;
    animation: tour-pulse-glow ${duration}ms ease-in-out infinite;
    z-index: 1;
  `;
  container.appendChild(center);

  // Label
  if (label) {
    const labelEl = document.createElement('div');
    labelEl.style.cssText = `
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 8px;
      white-space: nowrap;
      font-size: 12px;
      font-weight: 600;
      color: ${color};
      text-shadow: 0 1px 2px rgba(0,0,0,0.5), 0 0 8px white;
      z-index: 10;
    `;
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  return container;
}

/**
 * Creates a spotlight/highlight effect
 */
function createSpotlightEffect(color: string, scale: number): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    width: ${120 * scale}px;
    height: ${120 * scale}px;
    border-radius: 50%;
    background: radial-gradient(circle, ${color}40 0%, transparent 70%);
    border: 2px dashed ${color}80;
    animation: tour-spotlight-spin 10s linear infinite;
  `;
  return container;
}

/**
 * Creates a large icon overlay (3D-style graphics)
 */
function createIconOverlay(
  icon: string,
  scale: number,
  label?: string
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tour-icon-overlay';
  container.style.cssText = `
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: tour-float 3s ease-in-out infinite;
  `;

  // Icon container with 3D effect
  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    width: ${100 * scale}px;
    height: ${100 * scale}px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
  `;

  // Get the SVG for the icon
  iconContainer.innerHTML = getIconSVG(icon, scale);
  container.appendChild(iconContainer);

  // Label below icon
  if (label) {
    const labelEl = document.createElement('div');
    labelEl.style.cssText = `
      margin-top: 12px;
      padding: 6px 16px;
      background: rgba(0,0,0,0.85);
      color: white;
      font-size: 14px;
      font-weight: 600;
      border-radius: 20px;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  return container;
}

/**
 * Creates an animated demand meter
 */
function createDemandMeter(
  value: number,
  color: string,
  label?: string
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
  `;

  // Meter container
  const meter = document.createElement('div');
  meter.style.cssText = `
    width: 60px;
    height: 100px;
    background: rgba(0,0,0,0.8);
    border-radius: 8px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;

  // Title
  const title = document.createElement('div');
  title.style.cssText = `
    color: white;
    font-size: 10px;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
  title.textContent = 'LOAD';
  meter.appendChild(title);

  // Bar container
  const barContainer = document.createElement('div');
  barContainer.style.cssText = `
    flex: 1;
    width: 30px;
    background: #333;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  `;

  // Bar fill
  const barFill = document.createElement('div');
  const fillColor = value > 80 ? '#ef4444' : value > 60 ? '#f97316' : '#22c55e';
  barFill.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: ${value}%;
    background: ${fillColor};
    transition: height 1s ease-out;
    animation: tour-meter-pulse 2s ease-in-out infinite;
  `;
  barContainer.appendChild(barFill);
  meter.appendChild(barContainer);

  // Value
  const valueEl = document.createElement('div');
  valueEl.style.cssText = `
    color: white;
    font-size: 14px;
    font-weight: bold;
    margin-top: 4px;
  `;
  valueEl.textContent = `${value}%`;
  meter.appendChild(valueEl);

  container.appendChild(meter);

  // Label
  if (label) {
    const labelEl = document.createElement('div');
    labelEl.style.cssText = `
      margin-top: 8px;
      font-size: 12px;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      background: rgba(0,0,0,0.6);
      padding: 4px 8px;
      border-radius: 4px;
    `;
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  return container;
}

/**
 * Creates an animated flow visualization
 */
function createFlowAnimation(
  direction: 'in' | 'out' | 'bidirectional',
  color: string,
  scale: number
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    width: ${80 * scale}px;
    height: ${80 * scale}px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Create animated arrows
  const arrowCount = 3;
  for (let i = 0; i < arrowCount; i++) {
    const arrow = document.createElement('div');
    const angle = direction === 'in' ? 180 : 0;
    const delay = i * 500;
    arrow.style.cssText = `
      position: absolute;
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-bottom: 15px solid ${color};
      transform: rotate(${angle}deg);
      animation: tour-flow-arrow 1.5s ease-in-out infinite ${delay}ms;
      opacity: 0;
    `;
    container.appendChild(arrow);
  }

  // Center indicator
  const center = document.createElement('div');
  center.style.cssText = `
    width: ${30 * scale}px;
    height: ${30 * scale}px;
    border-radius: 50%;
    background: ${color}40;
    border: 2px solid ${color};
    z-index: 1;
  `;
  container.appendChild(center);

  return container;
}

/**
 * Returns SVG markup for story icons
 */
function getIconSVG(icon: string, scale: number): string {
  const size = 80 * scale;

  switch (icon) {
    case 'substation':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Substation building -->
          <rect x="15" y="35" width="70" height="50" fill="#374151" stroke="#f97316" stroke-width="3"/>
          <rect x="25" y="45" width="15" height="20" fill="#1f2937"/>
          <rect x="60" y="45" width="15" height="20" fill="#1f2937"/>
          <!-- Power lines -->
          <line x1="50" y1="10" x2="50" y2="35" stroke="#f97316" stroke-width="4"/>
          <line x1="30" y1="15" x2="70" y2="15" stroke="#f97316" stroke-width="3"/>
          <circle cx="30" cy="15" r="5" fill="#f97316"/>
          <circle cx="70" cy="15" r="5" fill="#f97316"/>
          <!-- Glow effect -->
          <circle cx="50" cy="50" r="45" fill="url(#substation-glow)" opacity="0.3"/>
          <defs>
            <radialGradient id="substation-glow">
              <stop offset="0%" stop-color="#f97316"/>
              <stop offset="100%" stop-color="transparent"/>
            </radialGradient>
          </defs>
        </svg>
      `;

    case 'datacentre':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Building with 3D effect -->
          <polygon points="50,5 95,25 95,80 50,95 5,80 5,25" fill="#1e3a5a" stroke="#3b82f6" stroke-width="2"/>
          <polygon points="50,5 95,25 50,40 5,25" fill="#2d4a6a"/>
          <line x1="50" y1="40" x2="50" y2="95" stroke="#3b82f6" stroke-width="1"/>
          <!-- Server racks -->
          <rect x="20" y="50" width="20" height="8" fill="#22c55e" opacity="0.8"/>
          <rect x="20" y="62" width="20" height="8" fill="#22c55e" opacity="0.8"/>
          <rect x="60" y="50" width="20" height="8" fill="#3b82f6" opacity="0.8"/>
          <rect x="60" y="62" width="20" height="8" fill="#3b82f6" opacity="0.8"/>
          <!-- Blinking lights -->
          <circle cx="25" cy="54" r="2" fill="#22c55e">
            <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="35" cy="54" r="2" fill="#22c55e">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="0.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="65" cy="54" r="2" fill="#3b82f6">
            <animate attributeName="opacity" values="1;0.5;1" dur="0.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="75" cy="54" r="2" fill="#3b82f6">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite"/>
          </circle>
        </svg>
      `;

    case 'ev-charger':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- EV Car silhouette -->
          <path d="M15 65 Q15 55 25 55 L35 55 L40 45 L70 45 L80 55 L85 55 Q95 55 95 65 L95 75 L15 75 Z"
                fill="#374151" stroke="#22c55e" stroke-width="2"/>
          <!-- Wheels -->
          <circle cx="30" cy="75" r="8" fill="#1f2937" stroke="#22c55e" stroke-width="2"/>
          <circle cx="75" cy="75" r="8" fill="#1f2937" stroke="#22c55e" stroke-width="2"/>
          <!-- Charging port -->
          <rect x="45" y="58" width="15" height="10" rx="2" fill="#22c55e"/>
          <!-- Lightning bolt -->
          <path d="M50 20 L55 35 L52 35 L60 50 L48 38 L51 38 L45 25 Z" fill="#fbbf24">
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </path>
          <!-- Charging cable -->
          <path d="M52 63 Q52 30 30 15" stroke="#22c55e" stroke-width="3" fill="none" stroke-dasharray="5,5">
            <animate attributeName="stroke-dashoffset" values="0;10" dur="0.5s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;

    case 'solar':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Solar panel -->
          <rect x="10" y="40" width="80" height="50" rx="3" fill="#1e3a5a" stroke="#726BA9" stroke-width="2" transform="skewY(-5)"/>
          <!-- Panel cells -->
          <rect x="15" y="45" width="18" height="18" fill="#726BA9" opacity="0.8" transform="skewY(-5)"/>
          <rect x="38" y="45" width="18" height="18" fill="#726BA9" opacity="0.8" transform="skewY(-5)"/>
          <rect x="61" y="45" width="18" height="18" fill="#726BA9" opacity="0.8" transform="skewY(-5)"/>
          <rect x="15" y="68" width="18" height="18" fill="#726BA9" opacity="0.8" transform="skewY(-5)"/>
          <rect x="38" y="68" width="18" height="18" fill="#726BA9" opacity="0.8" transform="skewY(-5)"/>
          <rect x="61" y="68" width="18" height="18" fill="#726BA9" opacity="0.8" transform="skewY(-5)"/>
          <!-- Sun rays -->
          <circle cx="50" cy="15" r="8" fill="#fbbf24"/>
          <g stroke="#fbbf24" stroke-width="2">
            <line x1="50" y1="3" x2="50" y2="-2"><animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/></line>
            <line x1="62" y1="7" x2="68" y2="3" transform="rotate(0 50 15)"><animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/></line>
            <line x1="38" y1="7" x2="32" y2="3"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/></line>
          </g>
        </svg>
      `;

    case 'wind':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Tower -->
          <polygon points="45,40 55,40 52,95 48,95" fill="#374151"/>
          <!-- Hub -->
          <circle cx="50" cy="40" r="8" fill="#6b7280"/>
          <!-- Blades with rotation -->
          <g transform-origin="50 40">
            <animateTransform attributeName="transform" type="rotate" from="0 50 40" to="360 50 40" dur="3s" repeatCount="indefinite"/>
            <path d="M50 40 L50 5 Q55 15 50 40" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/>
            <path d="M50 40 L80 60 Q65 55 50 40" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/>
            <path d="M50 40 L20 60 Q35 55 50 40" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/>
          </g>
        </svg>
      `;

    case 'battery':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Battery container -->
          <rect x="15" y="25" width="70" height="60" rx="5" fill="#374151" stroke="#22c55e" stroke-width="3"/>
          <!-- Battery terminal -->
          <rect x="40" y="15" width="20" height="12" rx="2" fill="#6b7280"/>
          <!-- Charge level -->
          <rect x="22" y="32" width="56" height="46" rx="3" fill="#1f2937"/>
          <rect x="22" y="48" width="56" height="30" rx="3" fill="#22c55e" opacity="0.8">
            <animate attributeName="height" values="30;46;30" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="y" values="48;32;48" dur="3s" repeatCount="indefinite"/>
          </rect>
          <!-- Lightning symbol -->
          <path d="M45 50 L52 40 L50 50 L55 50 L48 65 L50 55 L45 55 Z" fill="white" opacity="0.9"/>
        </svg>
      `;

    default:
      return `<div style="width:${size}px;height:${size}px;background:#f97316;border-radius:50%;"></div>`;
  }
}

// Add CSS animations via style tag
if (typeof document !== 'undefined') {
  const styleId = 'tour-visual-effects-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes tour-pulse-ring {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }

      @keyframes tour-pulse-glow {
        0%, 100% { box-shadow: 0 0 10px currentColor; transform: scale(1); }
        50% { box-shadow: 0 0 25px currentColor; transform: scale(1.1); }
      }

      @keyframes tour-spotlight-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes tour-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      @keyframes tour-meter-pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }

      @keyframes tour-flow-arrow {
        0% { opacity: 0; transform: translateY(20px) rotate(180deg); }
        50% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-20px) rotate(180deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

export { TourVisualEffects as default };
