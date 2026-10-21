import { beforeEach, describe, expect, it } from 'vitest';
import { clearLayout, loadLayout, saveLayout } from '../lib/map-layout-store';

function positions(entries: [id: number, x: number, y: number][]) {
  return new Map(entries.map(([id, x, y]) => [id, { x, y }]));
}

describe('map layout store', () => {
  beforeEach(() => {
    clearLayout(7);
    clearLayout(9);
  });

  it('round-trips positions per warehouse', () => {
    expect(loadLayout(7).size).toBe(0);

    saveLayout(7, positions([[12, 320, 160], [13, 488, 160]]));
    expect(loadLayout(7)).toEqual(positions([[12, 320, 160], [13, 488, 160]]));

    // Separate scope — warehouse 9 stays untouched.
    expect(loadLayout(9).size).toBe(0);
  });

  it('overwrites the previous saved arrangement', () => {
    saveLayout(7, positions([[1, 10, 20]]));
    saveLayout(7, positions([[1, 30, 40]]));
    expect(loadLayout(7)).toEqual(positions([[1, 30, 40]]));
  });

  it('drops malformed entries instead of crashing', () => {
    const raw = JSON.stringify({
      version: 1,
      positions: {
        '5': { x: 10, y: 0 },
        'oops': { x: 1, y: 2 },
        'bad': { x: 'nope', y: 2 },
      },
    });
    window.localStorage.setItem('warehouse-map-v1:layout:9', raw);
    expect(loadLayout(9)).toEqual(positions([[5, 10, 0]]));
  });

  it('tolerates corrupted JSON and clears back to auto', () => {
    window.localStorage.setItem('warehouse-map-v1:layout:9', '{not json');
    expect(loadLayout(9).size).toBe(0);

    saveLayout(9, positions([[3, 1, 2]]));
    clearLayout(9);
    expect(loadLayout(9).size).toBe(0);
  });
});
