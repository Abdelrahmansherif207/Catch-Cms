import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { getLocalizedName } from '@/shared/lib/localize';
import type { TopProduct } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';
import { ChartCard, ChartCardError } from './chart-card';

interface TopProductsTableProps {
  data: TopProduct[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ value: number }>;
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">{payload[0].value} sold</p>
    </div>
  );
};

export function TopProductsTable({ data, isLoading, error }: TopProductsTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return <ChartCardError title={t('dashboard.topProducts.title')} />;
  }

  return (
    <ChartCard title={t('dashboard.topProducts.title')}>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-8 w-full rounded-xl" />
        </div>
      ) : data && data.length > 0 ? (
        <>
          {/* Horizontal bar chart */}
          <div className="h-[200px] w-full mb-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.slice(0, 8).map((p) => ({ ...p, displayName: getLocalizedName(p.name, lang) }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="displayName"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="sold_quantity"
                  fill="var(--chart-4)"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Data table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.topProducts.product')}</TableHead>
                  <TableHead className="text-end">{t('dashboard.topProducts.price')}</TableHead>
                  <TableHead className="text-end">{t('dashboard.topProducts.sold')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium text-foreground">
                      {getLocalizedName(product.name, lang)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-end font-medium tabular-nums">
                      {product.sold_quantity.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          {t('dashboard.errors.noData')}
        </div>
      )}
    </ChartCard>
  );
}
