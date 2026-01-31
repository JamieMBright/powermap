import type { Feature, Polygon, MultiPolygon, Point, LineString, Geometry } from 'geojson';

// Investment driver types
export type InvestmentDriver =
  | 'asset_replacement'
  | 'load_reinforcement'
  | 'proactive_investment'
  | 'fault_level'
  | 'reverse_power_flow'
  | 'connections';

// Asset types
export type AssetType =
  | 'substation'
  | 'transformer'
  | 'cable'
  | 'overhead_line'
  | 'switchgear';

// Boundary types
export type BoundaryType = 'resp' | 'gsp' | 'la' | 'lsoa';

// Asset investment record
export interface AssetInvestment {
  id: string;
  year: number;
  location: {
    lat: number;
    lng: number;
    geometry?: Geometry;
  };
  boundaries: {
    resp: string;
    gsp: string;
    la: string;
    lsoa: string;
  };
  investment: {
    amount: number;
    driver: InvestmentDriver;
    type: AssetType;
  };
  metadata: {
    projectName?: string;
    wbsCode?: string;
    description?: string;
  };
}

// Boundary feature properties
export interface BoundaryProperties {
  code: string;
  name: string;
  aggregates?: {
    totalInvestment: number;
    assetCount: number;
    byDriver: Record<InvestmentDriver, number>;
  };
}

// Boundary GeoJSON feature
export type BoundaryFeature = Feature<Polygon | MultiPolygon, BoundaryProperties>;

// Story tour types
export interface StoryTour {
  id: string;
  title: string;
  summary: string;
  duration: string;
  thumbnail: string;
  chapters: StoryChapter[];
}

export interface StoryChapter {
  id: string;
  title: string;
  narrative: string;
  mapState: {
    center: [number, number];
    zoom: number;
    pitch?: number;
    bearing?: number;
    bounds?: [number, number, number, number];
  };
  highlights: {
    assets?: string[];
    boundaries?: string[];
    layers?: string[];
  };
  annotations?: {
    type: 'marker' | 'popup' | 'line';
    position: [number, number];
    content: string;
  }[];
  transition: {
    duration: number;
    easing: 'linear' | 'easeInOut' | 'fly';
  };
}

// Map mode
export type MapMode = 'explore' | 'story';
