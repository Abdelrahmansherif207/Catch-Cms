import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { ChartType } from './chart-switcher';

const TM_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

interface BaseChartDataItem {
  name: string;
  [key: string]: string | number;
}

interface SimpleChartProps {
  data: { name: string; value: number }[];
  chartType: ChartType;
  color?: string;
  formatter?: (value: number) => string;
  height?: number;
}

interface MultiSeriesChartProps {
  data: BaseChartDataItem[];
  chartType: ChartType;
  dataKeys: { key: string; name: string; color: string }[];
  formatter?: (value: number) => string;
  height?: number;
}

function ChartTooltipContent({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">
        {formatter ? formatter(payload[0].value) : payload[0].value}
      </p>
    </div>
  );
}

function SimpleTreemap({ data, formatter }: { data: { name: string; value: number }[]; formatter?: (v: number) => string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const rows = nest(data, total, 4);
  return (
    <div className="flex flex-col gap-0.5 w-full h-full">
      {rows.map((row, ri) => {
        const rowTotal = row.reduce((s, d) => s + d.value, 0);
        return (
          <div key={ri} className="flex gap-0.5" style={{ flex: rowTotal }}>
            {row.map((item, ci) => {
              const idx = ri * 2 + ci;
              return (
                <div
                  key={ci}
                  className="relative rounded-md flex items-center justify-center overflow-hidden"
                  style={{
                    flex: item.value,
                    backgroundColor: TM_COLORS[idx % TM_COLORS.length],
                    minHeight: 36,
                  }}
                  title={`${item.name}: ${formatter ? formatter(item.value) : item.value}`}
                >
                  <span className="text-[10px] font-medium text-white leading-tight text-center px-1 pointer-events-none">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function MultiTreemap({ data, formatter }: { data: { name: string; value: number }[]; formatter?: (v: number) => string }) {
  const colCount = Math.max(1, Math.min(data.length, 4));
  const perCol = Math.ceil(data.length / colCount);
  const cols: typeof data[] = [];
  for (let i = 0; i < data.length; i += perCol) {
    cols.push(data.slice(i, i + perCol));
  }
  return (
    <div className="flex gap-0.5 w-full h-full">
      {cols.map((col, ci) => {
        const colTotal = col.reduce((s, d) => s + d.value, 0);
        return (
          <div key={ci} className="flex flex-col gap-0.5" style={{ flex: colTotal }}>
            {col.map((item, ri) => (
              <div
                key={ri}
                className="relative rounded-md flex items-center justify-center overflow-hidden"
                style={{
                  flex: item.value,
                  backgroundColor: TM_COLORS[(ci + ri * 2) % TM_COLORS.length],
                  minHeight: 30,
                }}
                title={`${item.name}: ${formatter ? formatter(item.value) : item.value}`}
              >
                <span className="text-[9px] font-medium text-white leading-tight text-center px-0.5 pointer-events-none">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function nest(data: { name: string; value: number }[], total: number, targetRows: number) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const rows: typeof data[] = [];
  let row: typeof data = [];
  let rowSum = 0;
  const targetPerRow = total / targetRows;
  for (const item of sorted) {
    if (rowSum > 0 && rowSum + item.value > targetPerRow * 1.3 && rows.length < targetRows - 1) {
      rows.push(row);
      row = [item];
      rowSum = item.value;
    } else {
      row.push(item);
      rowSum += item.value;
    }
  }
  if (row.length) rows.push(row);
  return rows;
}

export function SimpleChartRenderer({ data, chartType, color, formatter, height = 220 }: SimpleChartProps) {
  const fill = color || 'var(--chart-1)';

  if (chartType === 'radar') {
    return (
      <div className="h-[220px] w-full" style={{ height }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
            <PolarRadiusAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={formatter} />
            <Radar dataKey="value" fill={fill} fillOpacity={0.3} stroke={fill} strokeWidth={2} />
            <Tooltip content={<ChartTooltipContent formatter={formatter} />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === 'treemap') {
    return (
      <div className="h-[220px] w-full" style={{ height }} dir="ltr">
        <SimpleTreemap data={data} formatter={formatter} />
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full" style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={formatter} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={120} />
          <Tooltip content={<ChartTooltipContent formatter={formatter} />} />
          <Bar dataKey="value" fill={fill} radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiSeriesChartRenderer({ data, chartType, dataKeys, formatter, height = 220 }: MultiSeriesChartProps) {
  if (chartType === 'radar') {
    return (
      <div className="h-[220px] w-full" style={{ height }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
            <PolarRadiusAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={formatter} />
            {dataKeys.map((dk) => (
              <Radar key={dk.key} dataKey={dk.key} fill={dk.color} fillOpacity={0.2} stroke={dk.color} strokeWidth={2} name={dk.name} />
            ))}
            <Tooltip content={<MultiTooltipContent formatter={formatter} />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === 'treemap') {
    const treemapData = data.flatMap((item) =>
      dataKeys.map((dk) => ({
        name: `${item.name}`,
        value: Number(item[dk.key]) || 0,
      }))
    );
    return (
      <div className="h-[220px] w-full" style={{ height }} dir="ltr">
        <MultiTreemap data={treemapData} formatter={formatter} />
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full" style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={formatter} tickLine={false} axisLine={false} width={60} />
          <Tooltip content={<MultiTooltipContent formatter={formatter} />} />
          {dataKeys.map((dk) => (
            <Bar key={dk.key} dataKey={dk.key} fill={dk.color} radius={[4, 4, 0, 0]} barSize={12} name={dk.name} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MultiTooltipContent({ active, payload, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold text-foreground" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}
