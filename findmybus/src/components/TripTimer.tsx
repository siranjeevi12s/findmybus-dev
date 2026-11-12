import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { formatDuration } from '../utils/formatters';

/**
 * Self-contained elapsed-trip timer. Its per-second state update re-renders
 * only this <Text> node, not the whole driver dashboard (which previously
 * re-rendered every second and also blocked uiautomator from reaching an
 * idle state).
 */
export default function TripTimer({ startedAt }: { startedAt: string }) {
  const [duration, setDuration] = useState(() => formatDuration(startedAt));

  useEffect(() => {
    setDuration(formatDuration(startedAt));
    const id = setInterval(() => setDuration(formatDuration(startedAt)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <Text className="text-white text-4xl font-mono mb-8 font-bold">{duration}</Text>
  );
}
