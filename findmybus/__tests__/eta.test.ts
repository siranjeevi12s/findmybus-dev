import { estimateETA, formatETA } from '../src/utils/eta';

describe('estimateETA', () => {
  // 0.1° of latitude at the equator ≈ 11.1195 km
  const bus = { lat: 0, lon: 0 };
  const parent = { lat: 0.1, lon: 0 };

  it('returns 0 minutes at zero distance', () => {
    expect(estimateETA(12.9716, 77.5946, 12.9716, 77.5946)).toBe(0);
  });

  it('uses the default 20 km/h speed (~33 min for 11.1 km)', () => {
    expect(estimateETA(bus.lat, bus.lon, parent.lat, parent.lon)).toBe(33);
  });

  it('honours a custom average speed (60 km/h → ~11 min for 11.1 km)', () => {
    expect(estimateETA(bus.lat, bus.lon, parent.lat, parent.lon, 60)).toBe(11);
  });

  it('scales with distance (0.2° → about double the 0.1° estimate, ±1 rounding)', () => {
    const near = estimateETA(0, 0, 0.1, 0);
    const far = estimateETA(0, 0, 0.2, 0);
    expect(far).toBeGreaterThan(near);
    expect(Math.abs(far - 2 * near)).toBeLessThanOrEqual(1);
  });
});

describe('formatETA', () => {
  it('says "Arriving now" below 1 minute', () => {
    expect(formatETA(0)).toBe('Arriving now');
    expect(formatETA(0.9)).toBe('Arriving now');
  });

  it('says "X min" from 1 up to 59', () => {
    expect(formatETA(1)).toBe('1 min');
    expect(formatETA(45)).toBe('45 min');
    expect(formatETA(59)).toBe('59 min');
  });

  it('says "Xh Ym" at 60+ minutes', () => {
    expect(formatETA(60)).toBe('1h 0m');
    expect(formatETA(125)).toBe('2h 5m');
  });
});
