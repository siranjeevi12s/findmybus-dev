import { formatCompletedDuration, formatDuration } from '../src/utils/formatters';

describe('formatDuration', () => {
  const startedAt = '2026-01-01T00:00:00.000Z';
  const startMs = new Date(startedAt).getTime();
  let nowSpy: jest.Spied<typeof Date.now>;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now');
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('formats HH:MM:SS for a fixed startedAt', () => {
    nowSpy.mockReturnValue(startMs + (1 * 3600 + 2 * 60 + 3) * 1000);
    expect(formatDuration(startedAt)).toBe('01:02:03');
  });

  it('pads sub-minute durations', () => {
    nowSpy.mockReturnValue(startMs + 45 * 1000);
    expect(formatDuration(startedAt)).toBe('00:00:45');
  });

  it('truncates partial seconds', () => {
    nowSpy.mockReturnValue(startMs + 65.9 * 1000);
    expect(formatDuration(startedAt)).toBe('00:01:05');
  });

  it('builds correctly relative to real Date.now (no mocking)', () => {
    const recent = new Date(Date.now() - 90 * 1000).toISOString();
    expect(formatDuration(recent)).toBe('00:01:30');
  });
});

describe('formatCompletedDuration', () => {
  const startedAt = '2026-01-01T08:00:00.000Z';

  it('shows only minutes when under an hour', () => {
    expect(formatCompletedDuration(startedAt, '2026-01-01T08:45:00.000Z')).toBe('45m');
  });

  it('shows 0m for sub-minute trips', () => {
    expect(formatCompletedDuration(startedAt, '2026-01-01T08:00:30.000Z')).toBe('0m');
  });

  it('shows hours and minutes past an hour', () => {
    expect(formatCompletedDuration(startedAt, '2026-01-01T09:05:00.000Z')).toBe('1h 5m');
    expect(formatCompletedDuration(startedAt, '2026-01-01T10:30:00.000Z')).toBe('2h 30m');
  });
});
