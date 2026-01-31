'use client';

interface StatCardProps {
  /** The label describing the stat */
  label: string;
  /** The value to display */
  value: string | number;
  /** Optional unit to display after value */
  unit?: string;
  /** Optional additional description */
  description?: string;
  /** Optional color theme */
  color?: 'default' | 'orange' | 'emerald' | 'amber' | 'red';
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  default: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-900',
    label: 'text-gray-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-900',
    label: 'text-orange-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    label: 'text-emerald-700',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    label: 'text-amber-700',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    label: 'text-red-700',
  },
};

const sizeClasses = {
  sm: {
    padding: 'px-2 py-1.5',
    value: 'text-lg',
    label: 'text-xs',
    gap: 'gap-0.5',
  },
  md: {
    padding: 'px-3 py-2',
    value: 'text-2xl',
    label: 'text-sm',
    gap: 'gap-1',
  },
  lg: {
    padding: 'px-4 py-3',
    value: 'text-3xl',
    label: 'text-base',
    gap: 'gap-1.5',
  },
};

/**
 * StatCard - A reusable component for displaying statistical values
 * Used in dashboards and aggregation panels
 */
export function StatCard({
  label,
  value,
  unit,
  description,
  color = 'default',
  icon,
  size = 'md',
}: StatCardProps) {
  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('en-GB')
    : value;

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} border rounded-lg ${sizes.padding}
        flex flex-col ${sizes.gap}
      `}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span className={`${colors.label} shrink-0`}>{icon}</span>
        )}
        <span className={`${sizes.label} font-medium ${colors.label} truncate`}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`${sizes.value} font-bold ${colors.text} tabular-nums`}>
          {formattedValue}
        </span>
        {unit && (
          <span className={`${sizes.label} font-medium ${colors.label}`}>
            {unit}
          </span>
        )}
      </div>
      {description && (
        <p className={`${sizes.label} ${colors.label} opacity-75 mt-0.5`}>
          {description}
        </p>
      )}
    </div>
  );
}

export { StatCard as default };
