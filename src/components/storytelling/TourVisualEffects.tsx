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

    case '3d-building':
      return create3DBuilding(
        config.buildingType ?? 'datacentre',
        scale,
        effect.label,
        color,
        config.powerMW ?? 50,
        config.holographic ?? false
      );

    case 'energy-arc':
      return createEnergyArc(color, config.secondaryColor ?? '#00ffff', scale, config.intensity ?? 3);

    case 'power-pulse-line':
      return createPowerPulseLine(color, scale, config.particleCount ?? 5);

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
 * Creates a dramatic 3D building with holographic effects and power visualization
 */
function create3DBuilding(
  buildingType: string,
  scale: number,
  label?: string,
  color: string = '#3b82f6',
  powerMW: number = 50,
  holographic: boolean = false
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tour-3d-building';
  container.style.cssText = `
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    filter: drop-shadow(0 20px 40px rgba(0,0,0,0.5));
  `;

  // Main building container with perspective
  const buildingWrapper = document.createElement('div');
  buildingWrapper.style.cssText = `
    position: relative;
    width: ${200 * scale}px;
    height: ${180 * scale}px;
    animation: tour-building-float 4s ease-in-out infinite;
  `;

  // Create the 3D building SVG
  const svgSize = 200 * scale;
  buildingWrapper.innerHTML = get3DBuildingSVG(buildingType, svgSize, color, powerMW, holographic);
  container.appendChild(buildingWrapper);

  // Holographic scan line effect
  if (holographic) {
    const scanLine = document.createElement('div');
    scanLine.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, transparent, ${color}80, transparent);
      animation: tour-scan-line 2s linear infinite;
      pointer-events: none;
    `;
    buildingWrapper.appendChild(scanLine);
  }

  // Power consumption display
  const powerDisplay = document.createElement('div');
  powerDisplay.style.cssText = `
    position: absolute;
    top: -10px;
    right: -20px;
    background: rgba(0,0,0,0.9);
    border: 2px solid ${color};
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 0 20px ${color}40, inset 0 0 20px ${color}10;
    animation: tour-power-glow 2s ease-in-out infinite;
  `;
  powerDisplay.innerHTML = `
    <div style="color: ${color}; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">POWER</div>
    <div style="color: white; font-size: 20px; font-weight: bold; font-family: monospace;">${powerMW}<span style="font-size: 12px; color: ${color};">MW</span></div>
    <div style="width: 100%; height: 3px; background: #333; border-radius: 2px; margin-top: 4px; overflow: hidden;">
      <div style="height: 100%; width: 100%; background: linear-gradient(90deg, ${color}, #00ff88); animation: tour-power-bar 1.5s ease-in-out infinite;"></div>
    </div>
  `;
  container.appendChild(powerDisplay);

  // Ground glow effect
  const groundGlow = document.createElement('div');
  groundGlow.style.cssText = `
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: ${150 * scale}px;
    height: ${40 * scale}px;
    background: radial-gradient(ellipse, ${color}40 0%, transparent 70%);
    animation: tour-ground-pulse 2s ease-in-out infinite;
  `;
  container.appendChild(groundGlow);

  // Label with tech styling
  if (label) {
    const labelEl = document.createElement('div');
    labelEl.style.cssText = `
      margin-top: 20px;
      padding: 10px 24px;
      background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,40,0.95) 100%);
      color: white;
      font-size: 16px;
      font-weight: 700;
      border-radius: 8px;
      white-space: nowrap;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${color}30;
      border: 1px solid ${color}60;
      text-transform: uppercase;
      letter-spacing: 2px;
      position: relative;
      overflow: hidden;
    `;
    labelEl.innerHTML = `
      <span style="position: relative; z-index: 1;">${label}</span>
      <div style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, ${color}30, transparent); animation: tour-label-shine 3s linear infinite;"></div>
    `;
    container.appendChild(labelEl);
  }

  return container;
}

/**
 * Creates SVG for 3D buildings with dramatic effects
 */
function get3DBuildingSVG(
  buildingType: string,
  size: number,
  color: string,
  powerMW: number,
  holographic: boolean
): string {
  const glowFilter = holographic ? `
    <filter id="holographic-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feFlood flood-color="${color}" flood-opacity="0.5"/>
      <feComposite in2="blur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  ` : '';

  const holoStyle = holographic ? 'filter: url(#holographic-glow);' : '';

  if (buildingType === 'datacentre') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${glowFilter}
          <linearGradient id="building-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1a2744"/>
            <stop offset="50%" stop-color="#0f1729"/>
            <stop offset="100%" stop-color="#0a0f1a"/>
          </linearGradient>
          <linearGradient id="roof-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#2d3a54"/>
            <stop offset="100%" stop-color="#1a2744"/>
          </linearGradient>
          <linearGradient id="glow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${color}"/>
            <stop offset="100%" stop-color="${color}00"/>
          </linearGradient>
        </defs>

        <!-- Building shadow -->
        <ellipse cx="100" cy="165" rx="80" ry="12" fill="rgba(0,0,0,0.3)"/>

        <!-- Main building body - 3D isometric -->
        <g style="${holoStyle}">
          <!-- Left face -->
          <polygon points="20,60 100,20 100,140 20,160" fill="url(#building-gradient)" stroke="${color}" stroke-width="1.5"/>
          <!-- Right face -->
          <polygon points="100,20 180,60 180,160 100,140" fill="#0f1729" stroke="${color}" stroke-width="1.5"/>
          <!-- Top face -->
          <polygon points="20,60 100,20 180,60 100,85" fill="url(#roof-gradient)" stroke="${color}" stroke-width="1.5"/>
        </g>

        <!-- Server racks - left side -->
        <g>
          ${Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: 3 }, (_, col) => {
              const x = 30 + col * 20;
              const y = 70 + row * 22;
              const skewY = -0.3;
              return `
                <rect x="${x}" y="${y}" width="15" height="16" fill="#0a1020" transform="skewY(${skewY * 20}deg)"/>
                <rect x="${x + 2}" y="${y + 2}" width="11" height="4" fill="#22c55e" opacity="0.9">
                  <animate attributeName="opacity" values="0.9;0.4;0.9" dur="${0.3 + Math.random() * 0.5}s" repeatCount="indefinite"/>
                </rect>
                <rect x="${x + 2}" y="${y + 8}" width="11" height="4" fill="${color}" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="${0.4 + Math.random() * 0.4}s" repeatCount="indefinite"/>
                </rect>
                <!-- Activity lights -->
                <circle cx="${x + 4}" cy="${y + 14}" r="1.5" fill="#22c55e">
                  <animate attributeName="opacity" values="1;0.2;1" dur="${0.1 + Math.random() * 0.2}s" repeatCount="indefinite"/>
                </circle>
                <circle cx="${x + 8}" cy="${y + 14}" r="1.5" fill="#f59e0b">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="${0.15 + Math.random() * 0.3}s" repeatCount="indefinite"/>
                </circle>
                <circle cx="${x + 12}" cy="${y + 14}" r="1.5" fill="${color}">
                  <animate attributeName="opacity" values="1;0.5;1" dur="${0.2 + Math.random() * 0.2}s" repeatCount="indefinite"/>
                </circle>
              `;
            }).join('')
          ).join('')}
        </g>

        <!-- Server racks - right side -->
        <g>
          ${Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: 3 }, (_, col) => {
              const x = 110 + col * 20;
              const y = 75 + row * 20;
              return `
                <rect x="${x}" y="${y}" width="15" height="14" fill="#0a1020" transform="skewY(0.3rad)"/>
                <rect x="${x + 2}" y="${y + 2}" width="11" height="3" fill="#3b82f6" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.2;0.8" dur="${0.25 + Math.random() * 0.4}s" repeatCount="indefinite"/>
                </rect>
                <rect x="${x + 2}" y="${y + 7}" width="11" height="3" fill="#06b6d4" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;0.3;0.7" dur="${0.35 + Math.random() * 0.3}s" repeatCount="indefinite"/>
                </rect>
              `;
            }).join('')
          ).join('')}
        </g>

        <!-- Roof equipment -->
        <g>
          <!-- HVAC units -->
          <rect x="40" y="45" width="25" height="12" fill="#374151" stroke="${color}40" stroke-width="0.5"/>
          <rect x="75" y="42" width="20" height="10" fill="#374151" stroke="${color}40" stroke-width="0.5"/>
          <rect x="120" y="50" width="25" height="12" fill="#374151" stroke="${color}40" stroke-width="0.5"/>
          <!-- Ventilation animation -->
          <line x1="52" y1="45" x2="52" y2="35" stroke="#6b7280" stroke-width="2" stroke-dasharray="2,2">
            <animate attributeName="y2" values="35;25;35" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite"/>
          </line>
          <line x1="85" y1="42" x2="85" y2="32" stroke="#6b7280" stroke-width="2" stroke-dasharray="2,2">
            <animate attributeName="y2" values="32;22;32" dur="1.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite"/>
          </line>
        </g>

        <!-- Power connection lines -->
        <g stroke="${color}" stroke-width="2" fill="none">
          <path d="M100,140 Q100,155 80,165">
            <animate attributeName="stroke-dashoffset" values="20;0" dur="0.5s" repeatCount="indefinite"/>
          </path>
          <path d="M100,140 Q100,155 120,165" stroke-dasharray="4,2">
            <animate attributeName="stroke-dashoffset" values="0;20" dur="0.5s" repeatCount="indefinite"/>
          </path>
        </g>

        <!-- Energy glow at base -->
        <ellipse cx="100" cy="155" rx="40" ry="8" fill="url(#glow-gradient)" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.3;0.6" dur="1.5s" repeatCount="indefinite"/>
        </ellipse>

        <!-- Pulsing energy rings -->
        <circle cx="100" cy="80" r="60" stroke="${color}" stroke-width="1" fill="none" opacity="0.3">
          <animate attributeName="r" values="60;90;60" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite"/>
        </circle>
      </svg>
    `;
  }

  // Default substation building
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${glowFilter}
        <linearGradient id="sub-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#374151"/>
          <stop offset="100%" stop-color="#1f2937"/>
        </linearGradient>
      </defs>
      <g style="${holoStyle}">
        <!-- Substation building -->
        <polygon points="30,70 100,30 170,70 170,140 100,165 30,140" fill="url(#sub-gradient)" stroke="${color}" stroke-width="2"/>
        <polygon points="30,70 100,30 170,70 100,100" fill="#4b5563" stroke="${color}" stroke-width="1"/>
        <!-- Power lines -->
        <line x1="100" y1="30" x2="100" y2="5" stroke="${color}" stroke-width="4"/>
        <line x1="70" y1="10" x2="130" y2="10" stroke="${color}" stroke-width="3"/>
        <circle cx="70" cy="10" r="6" fill="${color}">
          <animate attributeName="r" values="6;8;6" dur="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="130" cy="10" r="6" fill="${color}">
          <animate attributeName="r" values="6;8;6" dur="1s" repeatCount="indefinite" begin="0.5s"/>
        </circle>
        <!-- Equipment -->
        <rect x="50" y="90" width="30" height="35" fill="#1f2937" stroke="${color}" stroke-width="1"/>
        <rect x="120" y="90" width="30" height="35" fill="#1f2937" stroke="${color}" stroke-width="1"/>
        <!-- Status lights -->
        <circle cx="65" cy="100" r="4" fill="#22c55e">
          <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="135" cy="100" r="4" fill="#22c55e">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.5s" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>
  `;
}

/**
 * Creates an electric arc/lightning effect
 */
function createEnergyArc(
  color: string,
  secondaryColor: string,
  scale: number,
  intensity: number
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tour-energy-arc';
  const size = 120 * scale;
  container.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Generate multiple lightning bolts
  const arcCount = Math.min(intensity, 5);
  for (let i = 0; i < arcCount; i++) {
    const arc = document.createElement('div');
    arc.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      animation: tour-arc-flicker ${0.1 + Math.random() * 0.2}s linear infinite;
      animation-delay: ${i * 0.1}s;
    `;
    arc.innerHTML = generateLightningPath(size, color, secondaryColor, i);
    container.appendChild(arc);
  }

  // Central energy core
  const core = document.createElement('div');
  core.style.cssText = `
    width: ${30 * scale}px;
    height: ${30 * scale}px;
    border-radius: 50%;
    background: radial-gradient(circle, ${secondaryColor} 0%, ${color} 50%, transparent 70%);
    box-shadow: 0 0 ${20 * scale}px ${color}, 0 0 ${40 * scale}px ${secondaryColor}60;
    animation: tour-core-pulse 0.5s ease-in-out infinite;
    z-index: 2;
  `;
  container.appendChild(core);

  // Outer energy ring
  const ring = document.createElement('div');
  ring.style.cssText = `
    position: absolute;
    width: ${80 * scale}px;
    height: ${80 * scale}px;
    border-radius: 50%;
    border: 2px solid ${color};
    box-shadow: 0 0 10px ${color}, inset 0 0 10px ${color}40;
    animation: tour-ring-rotate 2s linear infinite;
  `;
  container.appendChild(ring);

  return container;
}

/**
 * Generates SVG lightning path
 */
function generateLightningPath(size: number, color: string, secondaryColor: string, index: number): string {
  const cx = size / 2;
  const cy = size / 2;
  const angles = [0, 72, 144, 216, 288]; // 5 directions
  const angle = (angles[index % 5] + Math.random() * 30) * Math.PI / 180;
  const length = size * 0.4;

  // Generate jagged lightning path
  let path = `M${cx},${cy}`;
  let x = cx;
  let y = cy;
  const segments = 4;

  for (let j = 0; j < segments; j++) {
    const segLen = length / segments;
    const jitter = (Math.random() - 0.5) * 20;
    x += Math.cos(angle) * segLen + Math.cos(angle + Math.PI/2) * jitter;
    y += Math.sin(angle) * segLen + Math.sin(angle + Math.PI/2) * jitter;
    path += ` L${x},${y}`;
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="position: absolute; top: 0; left: 0;">
      <defs>
        <filter id="arc-glow-${index}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="${path}" stroke="${secondaryColor}" stroke-width="4" fill="none" filter="url(#arc-glow-${index})" opacity="0.8"/>
      <path d="${path}" stroke="${color}" stroke-width="2" fill="none"/>
    </svg>
  `;
}

/**
 * Creates an animated power pulse line with particles
 */
function createPowerPulseLine(
  color: string,
  scale: number,
  particleCount: number
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tour-power-pulse';
  const size = 100 * scale;
  container.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Energy particles flowing outward
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    const angle = (i / particleCount) * 360;
    const delay = (i / particleCount) * 2;
    particle.style.cssText = `
      position: absolute;
      width: ${8 * scale}px;
      height: ${8 * scale}px;
      border-radius: 50%;
      background: ${color};
      box-shadow: 0 0 ${10 * scale}px ${color}, 0 0 ${20 * scale}px ${color}60;
      animation: tour-particle-flow 2s ease-out infinite;
      animation-delay: ${delay}s;
      transform: rotate(${angle}deg) translateX(0);
      --particle-angle: ${angle}deg;
    `;
    container.appendChild(particle);

    // Particle trail
    const trail = document.createElement('div');
    trail.style.cssText = `
      position: absolute;
      width: ${20 * scale}px;
      height: ${3 * scale}px;
      background: linear-gradient(90deg, transparent, ${color}80, transparent);
      animation: tour-particle-flow 2s ease-out infinite;
      animation-delay: ${delay}s;
      transform: rotate(${angle}deg) translateX(-10px);
      transform-origin: center;
      opacity: 0.6;
    `;
    container.appendChild(trail);
  }

  // Central hub
  const hub = document.createElement('div');
  hub.style.cssText = `
    width: ${25 * scale}px;
    height: ${25 * scale}px;
    border-radius: 50%;
    background: radial-gradient(circle, white 0%, ${color} 50%, transparent 100%);
    box-shadow: 0 0 ${15 * scale}px ${color}, 0 0 ${30 * scale}px ${color}40;
    animation: tour-hub-pulse 1s ease-in-out infinite;
    z-index: 3;
  `;
  container.appendChild(hub);

  // Pulsing rings
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement('div');
    ring.style.cssText = `
      position: absolute;
      width: ${40 * scale}px;
      height: ${40 * scale}px;
      border-radius: 50%;
      border: 2px solid ${color};
      animation: tour-ring-expand 2s ease-out infinite;
      animation-delay: ${i * 0.6}s;
      opacity: 0;
    `;
    container.appendChild(ring);
  }

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

      /* 3D Building Effects */
      @keyframes tour-building-float {
        0%, 100% { transform: translateY(0px) rotateY(0deg); }
        50% { transform: translateY(-8px) rotateY(2deg); }
      }

      @keyframes tour-scan-line {
        0% { top: 0; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }

      @keyframes tour-power-glow {
        0%, 100% { box-shadow: 0 0 20px var(--glow-color, #3b82f6)40, inset 0 0 20px var(--glow-color, #3b82f6)10; }
        50% { box-shadow: 0 0 30px var(--glow-color, #3b82f6)60, inset 0 0 30px var(--glow-color, #3b82f6)20; }
      }

      @keyframes tour-power-bar {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(-10%); }
      }

      @keyframes tour-ground-pulse {
        0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
        50% { opacity: 0.7; transform: translateX(-50%) scale(1.1); }
      }

      @keyframes tour-label-shine {
        0% { left: -100%; }
        100% { left: 200%; }
      }

      /* Energy Arc Effects */
      @keyframes tour-arc-flicker {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      @keyframes tour-core-pulse {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.2); filter: brightness(1.5); }
      }

      @keyframes tour-ring-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Power Pulse Line Effects */
      @keyframes tour-particle-flow {
        0% {
          transform: rotate(var(--particle-angle, 0deg)) translateX(0);
          opacity: 0;
        }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% {
          transform: rotate(var(--particle-angle, 0deg)) translateX(50px);
          opacity: 0;
        }
      }

      @keyframes tour-hub-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }

      @keyframes tour-ring-expand {
        0% {
          transform: scale(0.5);
          opacity: 0.8;
        }
        100% {
          transform: scale(2.5);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export { TourVisualEffects as default };
