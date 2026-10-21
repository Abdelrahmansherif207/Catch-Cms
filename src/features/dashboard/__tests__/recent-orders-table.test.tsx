import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildRecentOrders, initTestI18n } from '@/test/mocks';
import { RecentOrdersTable } from '../components/recent-orders-table';

beforeAll(async () => {
  await initTestI18n();
});

describe('RecentOrdersTable', () => {
  it('renders the card title and one row per order', () => {
    render(
      <RecentOrdersTable
        data={buildRecentOrders(2)}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText('Recent Orders')).toBeInTheDocument();

    // headers
    expect(screen.getByText('Order ID')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();

    // rows: both localized-name orders appear
    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('#102')).toBeInTheDocument();
    expect(screen.getAllByText('Jane Doe')).toHaveLength(2);
    expect(screen.getAllByText('jane@example.com')).toHaveLength(2);
  });

  it('formats totals as currency and counts items per order', () => {
    render(
      <RecentOrdersTable data={buildRecentOrders(1)} isLoading={false} error={null} />
    );

    expect(screen.getByText('$99.98')).toBeInTheDocument();
    expect(screen.getByText('1 items')).toBeInTheDocument();
    expect(screen.getByText('May 15, 2026')).toBeInTheDocument();
  });

  it('shows the empty state when no data arrives', () => {
    render(<RecentOrdersTable data={[]} isLoading={false} error={null} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.queryByText('#101')).not.toBeInTheDocument();
  });

  it('shows skeletons while loading', () => {
    const { container } = render(
      <RecentOrdersTable data={undefined} isLoading error={null} />
    );

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(5);
    expect(screen.queryByText('No data available')).not.toBeInTheDocument();
  });

  it('shows the error message when the request fails', () => {
    render(<RecentOrdersTable data={undefined} isLoading={false} error={new Error('boom')} />);

    expect(screen.getByText('Failed to load data. Please try again.')).toBeInTheDocument();
    expect(screen.getByText('Recent Orders')).toBeInTheDocument();
  });
});
