import { formatDistance, haversineDistance } from '../src/utils/distance';

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance(12.9716, 77.5946, 12.9716, 77.5946)).toBeCloseTo(0, 10);
  });

  it('is symmetric', () => {
    const ab = haversineDistance(12.9, 77.5, 13.1, 77.7);
    const ba = haversineDistance(13.1, 77.7, 12.9, 77.5);
    expect(ab).toBeCloseTo(ba, 9);
  });

  it('is ~111 km per degree of latitude at the equator (±2%)', () => {
    const km = haversineDistance(0, 0, 1, 0);
    expect(km).toBeGreaterThan(111 * 0.98);
    expect(km).toBeLessThan(111 * 1.02);
  });
});

describe('formatDistance', () => {
  it('renders sub-km values in metres', () => {
    expect(formatDistance(0.5)).toBe('500 m');
  });

  it('renders km values with one decimal', () => {
    expect(formatDistance(2.34)).toBe('2.3 km');
  });
});
