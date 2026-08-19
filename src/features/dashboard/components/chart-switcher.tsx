import { BarChart3, Radar, Grid3x3, ChartPie } from 'lucide-react';

export type ChartType = 'bar' | 'radar' | 'treemap' | 'pie';

interface ChartSwitcherProps {
  type: ChartType;
  onChange: (type: ChartType) => void;
  showPie?: boolean;
}

const BASE_OPTIONS: { type: ChartType; icon: typeof BarChart3; label: string }[] = [
  { type: 'bar', icon: BarChart3, label: 'Bar chart' },
  { type: 'radar', icon: Radar, label: 'Radar chart' },
  { type: 'treemap', icon: Grid3x3, label: 'Treemap' },
];

export function ChartSwitcher({ type, onChange, showPie }: ChartSwitcherProps) {
  const options = showPie
    ? [{ type: 'pie' as ChartType, icon: ChartPie, label: 'Pie chart' }, ...BASE_OPTIONS]
    : BASE_OPTIONS;
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-muted/30">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = type === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => onChange(opt.type)}
            title={opt.label}
            className={`rounded-md p-1.5 transition-colors ${
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
