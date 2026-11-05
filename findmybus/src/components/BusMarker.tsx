import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Marker } from '@maplibre/maplibre-react-native';
import { useTripStore } from '../store/tripStore';
import {
  computeBearing,
  distanceMeters,
  lerpAngle,
  clamp,
  type LatLng,
} from '../utils/geoMath';

/**
 * Isolated, self-animating bus marker.
 *
 * Subscribes to the raw target in tripStore and interpolates its own pose with
 * requestAnimationFrame. Only this tiny component re-renders per animation
 * frame — the map, camera, path layers and info panel never see these updates.
 *
 * Behaviour (per spec):
 * - Adaptive duration: matches the observed GPS update interval, clamped.
 * - No jumps: a new target mid-animation continues from the current pose.
 * - Out-of-order / stale targets are ignored.
 * - Trip change snaps immediately (no fly-across from the previous trip).
 * - Heading: GPS heading when moving, computed bearing when displaced,
 *   otherwise held (prevents stationary jitter and 359°->0° spins).
 */

interface Pose {
  lat: number;
  lng: number;
  heading: number;
}

const MIN_DURATION_MS = 400;
const MAX_DURATION_MS = 4000;
const DEFAULT_DURATION_MS = 1500;
const STALE_AFTER_MS = 120_000;
const HEADING_MIN_SPEED_MS = 1;      // m/s — below this GPS heading is unreliable
const BEARING_MIN_DISTANCE_M = 5;    // below this, computed bearing is noise
const SNAP_MAX_DISTANCE_M = 1500;    // larger displacement = teleport (new trip / gap), no fly

function easeLinear(t: number): number {
  return t;
}

export default function BusMarker() {
  const busLocation = useTripStore((s) => s.busLocation);

  const [pose, setPose] = useState<Pose | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTargetTsRef = useRef(0);
  const lastTargetArrivalRef = useRef(0);
  const currentTripIdRef = useRef<string | undefined>(undefined);

  const { latitude, longitude, heading, speed, tripId, updatedAt, active } =
    busLocation ?? {};

  useEffect(() => {
    if (!active || latitude == null || longitude == null) return;

    const target: LatLng = { latitude, longitude };

    // Freshness + ordering. Socket payloads carry updatedAt (or timestamp);
    // missing timestamps fall back to arrival time.
    const parsed = updatedAt ? Date.parse(String(updatedAt)) : NaN;
    const targetTs = Number.isFinite(parsed) ? parsed : Date.now();
    if (targetTs <= lastTargetTsRef.current) return; // out-of-order
    if (Date.now() - targetTs > STALE_AFTER_MS) return; // stale — do not animate toward it
    lastTargetTsRef.current = targetTs;

    const now = Date.now();
    const interval = lastTargetArrivalRef.current
      ? now - lastTargetArrivalRef.current
      : DEFAULT_DURATION_MS;
    lastTargetArrivalRef.current = now;

    const prev = poseRef.current;
    const tripChanged =
      currentTripIdRef.current !== undefined &&
      tripId !== undefined &&
      String(currentTripIdRef.current) !== String(tripId);
    currentTripIdRef.current = tripId;

    // Cancel any in-flight animation before deciding the new one.
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // --- Heading selection ---
    const prevLatLng: LatLng | null = prev
      ? { latitude: prev.lat, longitude: prev.lng }
      : null;
    const nextHeadingOf = (): number => {
      if (!prev || !prevLatLng) return 0;
      const dist = distanceMeters(prevLatLng, target);
      // Moving fast enough and the device reports a heading: trust it.
      if (
        heading != null &&
        speed != null &&
        speed >= HEADING_MIN_SPEED_MS &&
        dist > 0.5
      ) {
        return ((heading % 360) + 360) % 360;
      }
      // Displaced meaningfully: derive bearing from the actual movement.
      if (dist >= BEARING_MIN_DISTANCE_M) {
        return computeBearing(prevLatLng, target);
      }
      // Barely moved: hold orientation (stationary jitter prevention).
      return prev.heading;
    };

    const startPose: Pose = prev ?? {
      lat: latitude,
      lng: longitude,
      heading: heading ?? 0,
    };
    const nextHeading = nextHeadingOf();

    const dist = prevLatLng ? distanceMeters(prevLatLng, target) : 0;
    const shouldSnap =
      !prev || tripChanged || dist > SNAP_MAX_DISTANCE_M;

    if (shouldSnap) {
      const snapped: Pose = {
        lat: latitude,
        lng: longitude,
        heading: tripChanged || !prev ? nextHeading : prev?.heading ?? nextHeading,
      };
      poseRef.current = snapped;
      setPose(snapped);
      return;
    }

    // Adaptive: cover the distance in roughly the time until the next fix.
    const duration = clamp(interval, MIN_DURATION_MS, MAX_DURATION_MS);
    const from = { ...startPose };
    const startTime = now;

    const step = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const e = easeLinear(t);
      const next: Pose = {
        lat: from.lat + (latitude - from.lat) * e,
        lng: from.lng + (longitude - from.lng) * e,
        heading: lerpAngle(from.heading, nextHeading, e),
      };
      poseRef.current = next;
      setPose(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [latitude, longitude, heading, speed, tripId, updatedAt, active]);

  // Cleanup on unmount (screen exit / logout).
  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  if (!pose) return null;

  return (
    <Marker key="busMarker" id="busMarker" lngLat={[pose.lng, pose.lat]}>
      {/* 🚌 faces west; +90° aligns it with the 0° = north heading convention */}
      <View
        style={{ transform: [{ rotate: `${pose.heading + 90}deg` }] }}
        className="w-12 h-12 bg-white rounded-full border-2 border-blue-500 justify-center items-center shadow-xl"
      >
        <Text className="text-2xl">🚌</Text>
      </View>
    </Marker>
  );
}
