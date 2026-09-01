import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'findmybus_location_queue';
const MAX_QUEUE_SIZE = 50;

export interface QueuedLocation {
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export async function enqueueLocation(item: QueuedLocation): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedLocation[] = raw ? JSON.parse(raw) : [];
    queue.push(item);
    // Cap at max size — drop oldest
    const trimmed = queue.slice(-MAX_QUEUE_SIZE);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
  } catch {}
}

export async function dequeueAll(): Promise<QueuedLocation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    await AsyncStorage.removeItem(QUEUE_KEY);
    return JSON.parse(raw) as QueuedLocation[];
  } catch {
    return [];
  }
}

export async function getQueueSize(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    return (JSON.parse(raw) as QueuedLocation[]).length;
  } catch {
    return 0;
  }
}
