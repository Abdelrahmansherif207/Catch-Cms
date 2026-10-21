import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber } from '../lib/dashboard-utils';

describe('formatCurrency', () => {
  it('formats positive values as USD with 2 decimals', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('adds thousands separators for large values', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative values', () => {
    expect(formatCurrency(-1234.5)).toBe('-$1,234.50');
  });

  it('rounds values with more than 2 decimals', () => {
    expect(formatCurrency(10.999)).toBe('$11.00');
    expect(formatCurrency(10.994)).toBe('$10.99');
  });
});

describe('formatNumber', () => {
  it('adds thousands separators for large values', () => {
    expect(formatNumber(1500)).toBe('1,500');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('leaves small integers untouched', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('formats negative numbers', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
  });
});
