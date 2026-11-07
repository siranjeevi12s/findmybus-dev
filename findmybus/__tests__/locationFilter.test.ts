import { isAccurateLocation, shouldUpdateLocation } from '../src/utils/locationFilter';

describe('isAccurateLocation', () => {
  it('passes when accuracy is unknown (undefined/null)', () => {
    expect(isAccurateLocation(undefined)).toBe(true);
    // null is intentionally allowed via loose == null check
    expect(isAccurateLocation(null as unknown as number | undefined)).toBe(true);
  });

  it('passes at the 100 m threshold (inclusive)', () => {
    expect(isAccurateLocation(100)).toBe(true);
    expect(isAccurateLocation(0)).toBe(true);
  });

  it('fails just above the threshold', () => {
    expect(isAccurateLocation(101)).toBe(false);
    expect(isAccurateLocation(5000)).toBe(false);
  });
});

describe('shouldUpdateLocation', () => {
  const prev = { latitude: 12.9716, longitude: 77.5946 };

  it('passes when there is no previous fix', () => {
    expect(shouldUpdateLocation(null, prev)).toBe(true);
  });

  it('suppresses movement below 10 m (~0.00005° lat ≈ 5.5 m)', () => {
    expect(shouldUpdateLocation(prev, { latitude: prev.latitude + 0.00005, longitude: prev.longitude })).toBe(false);
  });

  it('passes movement above 10 m (~0.0002° lat ≈ 22 m)', () => {
    expect(shouldUpdateLocation(prev, { latitude: prev.latitude + 0.0002, longitude: prev.longitude })).toBe(true);
  });

  it('suppresses an identical position', () => {
    expect(shouldUpdateLocation(prev, { ...prev })).toBe(false);
  });
});
