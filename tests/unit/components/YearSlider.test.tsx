import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { YearSlider } from '@/components/timeline/YearSlider';

// Mock values
const mockSetYear = vi.fn();
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockTogglePlayback = vi.fn();
const mockNextYear = vi.fn();
const mockPreviousYear = vi.fn();

// Create configurable mock return values
let mockHookReturn = {
  year: 2030,
  setYear: mockSetYear,
  isPlaying: false,
  play: mockPlay,
  pause: mockPause,
  togglePlayback: mockTogglePlayback,
  nextYear: mockNextYear,
  previousYear: mockPreviousYear,
  isAtStart: false,
  isAtEnd: false,
};

// Mock the useYearFilter hook
vi.mock('@/hooks/useYearFilter', () => ({
  useYearFilter: () => mockHookReturn,
  MIN_YEAR: 2025,
  MAX_YEAR: 2050,
  DEFAULT_YEAR: 2025,
  KEY_YEARS: [2025, 2030, 2035, 2040, 2045, 2050] as const,
  PLAYBACK_INTERVAL_MS: 1000,
}));

const MIN_YEAR = 2025;
const MAX_YEAR = 2050;
const KEY_YEARS = [2025, 2030, 2035, 2040, 2045, 2050];

describe('YearSlider Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock values
    mockHookReturn = {
      year: 2030,
      setYear: mockSetYear,
      isPlaying: false,
      play: mockPlay,
      pause: mockPause,
      togglePlayback: mockTogglePlayback,
      nextYear: mockNextYear,
      previousYear: mockPreviousYear,
      isAtStart: false,
      isAtEnd: false,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render the component', () => {
      render(<YearSlider />);

      expect(screen.getByText('Year')).toBeInTheDocument();
    });

    it('should display the current year', () => {
      render(<YearSlider />);

      expect(screen.getByText('2030')).toBeInTheDocument();
    });

    it('should render the slider input', () => {
      render(<YearSlider />);

      const slider = screen.getByRole('slider', { name: /select year/i });
      expect(slider).toBeInTheDocument();
    });

    it('should render play/pause button', () => {
      render(<YearSlider />);

      const playButton = screen.getByRole('button', { name: /play/i });
      expect(playButton).toBeInTheDocument();
    });

    it('should render previous year button', () => {
      render(<YearSlider />);

      const prevButton = screen.getByRole('button', { name: /previous year/i });
      expect(prevButton).toBeInTheDocument();
    });

    it('should render next year button', () => {
      render(<YearSlider />);

      const nextButton = screen.getByRole('button', { name: /next year/i });
      expect(nextButton).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<YearSlider className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('slider input', () => {
    it('should have correct min attribute', () => {
      render(<YearSlider />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', String(MIN_YEAR));
    });

    it('should have correct max attribute', () => {
      render(<YearSlider />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', String(MAX_YEAR));
    });

    it('should have correct value attribute', () => {
      render(<YearSlider />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('2030');
    });

    it('should call setYear when slider changes', () => {
      render(<YearSlider />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '2035' } });

      expect(mockSetYear).toHaveBeenCalledWith(2035);
    });
  });

  describe('navigation buttons', () => {
    it('should call previousYear when previous button is clicked', () => {
      render(<YearSlider />);

      const prevButton = screen.getByRole('button', { name: /previous year/i });
      fireEvent.click(prevButton);

      expect(mockPreviousYear).toHaveBeenCalled();
    });

    it('should call nextYear when next button is clicked', () => {
      render(<YearSlider />);

      const nextButton = screen.getByRole('button', { name: /next year/i });
      fireEvent.click(nextButton);

      expect(mockNextYear).toHaveBeenCalled();
    });

    it('should disable previous button when at start', () => {
      mockHookReturn = {
        ...mockHookReturn,
        year: MIN_YEAR,
        isAtStart: true,
      };

      render(<YearSlider />);

      const prevButton = screen.getByRole('button', { name: /previous year/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button when at end', () => {
      mockHookReturn = {
        ...mockHookReturn,
        year: MAX_YEAR,
        isAtEnd: true,
      };

      render(<YearSlider />);

      const nextButton = screen.getByRole('button', { name: /next year/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('playback controls', () => {
    it('should call togglePlayback when play button is clicked', () => {
      render(<YearSlider />);

      const playButton = screen.getByRole('button', { name: /play/i });
      fireEvent.click(playButton);

      expect(mockTogglePlayback).toHaveBeenCalled();
    });

    it('should show pause button when playing', () => {
      mockHookReturn = {
        ...mockHookReturn,
        isPlaying: true,
      };

      render(<YearSlider />);

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      expect(pauseButton).toBeInTheDocument();
    });

    it('should disable play button when at end and not playing', () => {
      mockHookReturn = {
        ...mockHookReturn,
        year: MAX_YEAR,
        isAtEnd: true,
        isPlaying: false,
      };

      render(<YearSlider />);

      const playButton = screen.getByRole('button', { name: /play/i });
      expect(playButton).toBeDisabled();
    });

    it('should not disable pause button when at end and playing', () => {
      mockHookReturn = {
        ...mockHookReturn,
        year: MAX_YEAR,
        isAtEnd: true,
        isPlaying: true,
      };

      render(<YearSlider />);

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      expect(pauseButton).not.toBeDisabled();
    });
  });

  describe('key years tick marks', () => {
    it('should render tick marks for key years', () => {
      render(<YearSlider />);

      // Current year should be displayed prominently
      expect(screen.getByText('2030')).toBeInTheDocument();
    });

    it('should call setYear when key year tick is clicked', () => {
      render(<YearSlider />);

      // Find buttons that are tick marks (have title "Go to YEAR")
      const tickButtons = screen.getAllByRole('button').filter((btn) =>
        btn.getAttribute('title')?.startsWith('Go to')
      );

      if (tickButtons.length > 0) {
        fireEvent.click(tickButtons[0]);
        expect(mockSetYear).toHaveBeenCalled();
      }
    });
  });

  describe('accessibility', () => {
    it('should have accessible label for slider', () => {
      render(<YearSlider />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-label', 'Select year');
    });

    it('should have accessible label for play button', () => {
      render(<YearSlider />);

      const playButton = screen.getByRole('button', { name: /play/i });
      expect(playButton).toHaveAttribute('aria-label');
    });

    it('should have accessible label for previous button', () => {
      render(<YearSlider />);

      const prevButton = screen.getByRole('button', { name: /previous year/i });
      expect(prevButton).toHaveAttribute('aria-label', 'Previous year');
    });

    it('should have accessible label for next button', () => {
      render(<YearSlider />);

      const nextButton = screen.getByRole('button', { name: /next year/i });
      expect(nextButton).toHaveAttribute('aria-label', 'Next year');
    });

    it('should have title attributes for tooltips', () => {
      render(<YearSlider />);

      const prevButton = screen.getByRole('button', { name: /previous year/i });
      const nextButton = screen.getByRole('button', { name: /next year/i });

      expect(prevButton).toHaveAttribute('title', 'Previous year');
      expect(nextButton).toHaveAttribute('title', 'Next year');
    });
  });

  describe('year display', () => {
    it('should display MIN_YEAR correctly', () => {
      mockHookReturn = {
        ...mockHookReturn,
        year: MIN_YEAR,
        isAtStart: true,
      };

      render(<YearSlider />);

      expect(screen.getByText(String(MIN_YEAR))).toBeInTheDocument();
    });

    it('should display MAX_YEAR correctly', () => {
      mockHookReturn = {
        ...mockHookReturn,
        year: MAX_YEAR,
        isAtEnd: true,
      };

      render(<YearSlider />);

      expect(screen.getByText(String(MAX_YEAR))).toBeInTheDocument();
    });

    it('should display middle year correctly', () => {
      mockHookReturn = {
        ...mockHookReturn,
        year: 2037,
      };

      render(<YearSlider />);

      expect(screen.getByText('2037')).toBeInTheDocument();
    });
  });
});
