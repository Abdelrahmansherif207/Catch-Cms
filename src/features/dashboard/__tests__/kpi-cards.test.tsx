import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { initTestI18n } from '@/test/mocks';
import { KpiCards } from '../components/kpi-cards';
import { apiResponse, buildOverview } from '@/test/mocks';

beforeAll(async () => {
  await initTestI18n();
});

describe('KpiCards', () => {
  it('shows translated labels and formatted values when data is ready', () => {
    render(<KpiCards data={buildOverview()} isLoading={false} error={null} />);

    // labels
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Refunds')).toBeInTheDocument();

    // formatted values (via Intl formatters)
    expect(screen.getByText('$12,345.67')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('$45.00')).toBeInTheDocument();

    // secondary KPI rows
    expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
    expect(screen.getByText('$500.50')).toBeInTheDocument();
    expect(screen.getByText('New Customers')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders 5 skeletons while loading and no raw values', () => {
    const { container } = render(
      <KpiCards data={apiResponse(buildOverview()).data} isLoading error={null} />
    );

    // Skeleton renders <div data-slot="skeleton">
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(5);
    expect(screen.queryByText('$12,345.67')).not.toBeInTheDocument();
  });

  it('shows the error message when the request fails', () => {
    render(<KpiCards data={undefined} isLoading={false} error={new Error('boom')} />);

    expect(screen.getByText('Failed to load data. Please try again.')).toBeInTheDocument();
  });

  it('renders an em-dash placeholder for missing values', () => {
    render(<KpiCards data={undefined} isLoading={false} error={null} />);

    expect(screen.getAllByText('—')).toHaveLength(5);
  });
});
