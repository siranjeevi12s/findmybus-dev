import {
  LatLng,
  clamp,
  computeBearing,
  distanceMeters,
  lerpAngle,
  shortestAngleDelta,
} from '../src/utils/geoMath';

describe('distanceMeters', () => {
  it('is ~111 km per degree of latitude at the equator (±2%)', () => {
    const oneDegree = distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
    expect(oneDegree).toBeGreaterThan(111000 * 0.98);
    expect(oneDegree).toBeLessThan(111000 * 1.02);
  });

  it('returns 0 for the same point', () => {
    const p: LatLng = { latitude: 12.97, longitude: 77.59 };
    expect(distanceMeters(p, p)).toBeCloseTo(0, 10);
  });

  it('is symmetric', () => {
    const a: LatLng = { latitude: 12.9, longitude: 77.5 };
    const b: LatLng = { latitude: 13.1, longitude: 77.7 };
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 6);
  });
});

describe('computeBearing', () => {
  const origin: LatLng = { latitude: 0, longitude: 0 };

  it('due north is 0°', () => {
    expect(computeBearing(origin, { latitude: 1, longitude: 0 })).toBeCloseTo(0, 6);
  });

  it('due east is 90°', () => {
    expect(computeBearing(origin, { latitude: 0, longitude: 1 })).toBeCloseTo(90, 6);
  });

  it('due south is 180°', () => {
    expect(computeBearing(origin, { latitude: -1, longitude: 0 })).toBeCloseTo(180, 6);
  });

  it('due west is 270°', () => {
    expect(computeBearing(origin, { latitude: 0, longitude: -1 })).toBeCloseTo(270, 6);
  });
});

describe('shortestAngleDelta', () => {
  it('goes +2° across the 359°→1° wrap, not -358°', () => {
    expect(shortestAngleDelta(359, 1)).toBeCloseTo(2, 10);
  });

  it('goes -2° across the 1°→359° wrap', () => {
    expect(shortestAngleDelta(1, 359)).toBeCloseTo(-2, 10);
  });

  it('handles plain non-wrapping deltas', () => {
    expect(shortestAngleDelta(10, 40)).toBeCloseTo(30, 10);
    expect(shortestAngleDelta(40, 10)).toBeCloseTo(-30, 10);
  });

  it('returns 0 for identical angles', () => {
    expect(shortestAngleDelta(275, 275)).toBeCloseTo(0, 10);
  });

  it('stays within (-180, 180] for random pairs', () => {
    for (const [from, to] of [[0, 359], [359, 0], [45, 200], [200, 45], [100, 100]] as const) {
      const d = shortestAngleDelta(from, to);
      expect(d).toBeGreaterThan(-181);
      expect(d).toBeLessThanOrEqual(180);
    }
  });
});

describe('lerpAngle', () => {
  it('midpoint of 359°→1° wraps through 0° (~0/360), not through 180°', () => {
    const mid = lerpAngle(359, 1, 0.5);
    expect(mid).toBeCloseTo(0, 6); // (359 + 1) % 360 === 0
  });

  it('endpoints are preserved', () => {
    expect(lerpAngle(359, 1, 0)).toBeCloseTo(359, 6);
    expect(lerpAngle(359, 1, 1)).toBeCloseTo(1, 6);
  });

  it('interpolates along a non-wrapping arc', () => {
    expect(lerpAngle(10, 40, 0.5)).toBeCloseTo(25, 6);
  });

  it('always returns a value in [0, 360)', () => {
    const v = lerpAngle(300, 100, 0.3);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(360);
  });
});

describe('clamp', () => {
  it('passes through in-range values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps below min and above max', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('clamps at the exact boundaries', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
