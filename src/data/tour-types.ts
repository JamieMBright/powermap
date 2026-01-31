/**
 * TypeScript interfaces for the guided tours/storytelling system.
 * These types define the structure of tour data and state management.
 */

/**
 * Easing function types for map camera transitions
 */
export type TransitionEasing = 'linear' | 'easeInOut' | 'fly';

/**
 * Annotation types that can be displayed on the map during a tour
 */
export type AnnotationType = 'marker' | 'popup' | 'line';

/**
 * Map camera state for a chapter
 */
export interface ChapterMapState {
  /** Center coordinates [longitude, latitude] */
  center: [number, number];
  /** Zoom level */
  zoom: number;
  /** Pitch angle in degrees (0-85) */
  pitch?: number;
  /** Bearing/rotation in degrees (0-360) */
  bearing?: number;
  /** Optional bounding box [west, south, east, north] */
  bounds?: [number, number, number, number];
}

/**
 * Annotations displayed during a chapter
 */
export interface ChapterAnnotation {
  /** Type of annotation */
  type: AnnotationType;
  /** Position on map [longitude, latitude] */
  position: [number, number];
  /** Content to display */
  content: string;
  /** Optional custom styling */
  style?: {
    color?: string;
    backgroundColor?: string;
  };
}

/**
 * Elements to highlight during a chapter
 */
export interface ChapterHighlights {
  /** Asset IDs to highlight */
  assets?: string[];
  /** Boundary codes to highlight */
  boundaries?: string[];
  /** Layer IDs to make visible */
  layers?: string[];
}

/**
 * Transition configuration between chapters
 */
export interface ChapterTransition {
  /** Duration of the transition in milliseconds */
  duration: number;
  /** Easing function for the camera animation */
  easing: TransitionEasing;
}

/**
 * A single chapter in a tour
 */
export interface TourChapter {
  /** Unique chapter identifier */
  id: string;
  /** Chapter title displayed in the narrative panel */
  title: string;
  /** Narrative text explaining this chapter */
  narrative: string;
  /** Map camera state for this chapter */
  mapState: ChapterMapState;
  /** Elements to highlight on the map */
  highlights?: ChapterHighlights;
  /** Annotations to display on the map */
  annotations?: ChapterAnnotation[];
  /** Transition configuration for entering this chapter */
  transition: ChapterTransition;
}

/**
 * A complete guided tour
 */
export interface Tour {
  /** Unique tour identifier (matches filename without .json) */
  id: string;
  /** Tour title for display */
  title: string;
  /** Brief summary of what the tour covers */
  summary: string;
  /** Estimated duration (e.g., "5 min") */
  duration: string;
  /** Path to thumbnail image */
  thumbnail: string;
  /** Category/tag for filtering tours */
  category?: string;
  /** List of chapters in the tour */
  chapters: TourChapter[];
}

/**
 * Tour index entry (lightweight metadata for the tour selector)
 */
export interface TourIndexEntry {
  /** Tour ID */
  id: string;
  /** Tour title */
  title: string;
  /** Brief summary */
  summary: string;
  /** Estimated duration */
  duration: string;
  /** Path to thumbnail image */
  thumbnail: string;
  /** Category/tag */
  category?: string;
  /** Number of chapters */
  chapterCount: number;
}

/**
 * Tour index catalog
 */
export interface TourIndex {
  /** List of available tours */
  tours: TourIndexEntry[];
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Tour playback state
 */
export type TourPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'transitioning';

/**
 * State for the tour hook
 */
export interface TourState {
  /** Currently active tour (null if no tour is active) */
  activeTour: Tour | null;
  /** Index of the current chapter */
  currentChapterIndex: number;
  /** Current playback status */
  status: TourPlaybackStatus;
  /** Error message if any */
  error: string | null;
}

/**
 * Actions available for tour management
 */
export interface TourActions {
  /** Start a tour by ID */
  startTour: (tourId: string) => Promise<void>;
  /** End the current tour */
  endTour: () => void;
  /** Go to the next chapter */
  nextChapter: () => void;
  /** Go to the previous chapter */
  previousChapter: () => void;
  /** Jump to a specific chapter by index */
  goToChapter: (index: number) => void;
  /** Pause the tour */
  pause: () => void;
  /** Resume the tour */
  resume: () => void;
}

/**
 * Combined tour hook return type
 */
export interface UseTourReturn extends TourState, TourActions {
  /** Current chapter (derived from state) */
  currentChapter: TourChapter | null;
  /** Whether we're at the first chapter */
  isFirstChapter: boolean;
  /** Whether we're at the last chapter */
  isLastChapter: boolean;
  /** Total number of chapters */
  totalChapters: number;
}
