import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Image, View } from 'react-native';
import { Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { useTripStore } from '../store/tripStore';
import {
  computeBearing,
  distanceMeters,
  lerpAngle,
  clamp,
  type LatLng,
} from '../utils/geoMath';

/**
 * Isolated, self-animating bus marker — and the single driver of the follow
 * camera.
 *
 * WHY the camera lives here too: the marker pose and the camera must move as
 * ONE motion model or they visibly desync (the marker races ahead while the
 * camera "slowly catches up"). Previously the camera was eased from a separate
 * effect in LiveMap with a different easing curve and a different trigger path
 * (a parent re-render), so the two clocks could never stay frame-locked. Now a
 * new GPS fix starts the marker's rAF and the camera's easeTo in the SAME tick,
 * with the SAME linear curve and the SAME adaptive duration, so they track each
 * other exactly. Only this tiny component re-renders per animation frame — the
 * map subtree, path layers and info panel never see those updates.
 *
 * Behaviour (per spec):
 * - Marker + camera share one duration derived from the real GPS interval, so
 *   rapid or irregular updates neither stack animations nor lag behind.
 * - No jumps: a new target mid-animation continues from the current pose.
 * - Out-of-order / stale targets are ignored; sub-2 m noise is held (no move).
 * - Trip change snaps both marker and camera (no fly-across from the old trip).
 * - Heading: GPS heading when moving, computed bearing when displaced, else held
 *   (prevents stationary jitter and 359° -> 0° spins).
 * - The camera is only touched while following; a manual gesture stops it
 *   instantly while the marker keeps moving so map and bus stay independent.
 */

interface Pose {
  lat: number;
  lng: number;
  heading: number;
}

interface BusMarkerProps {
  cameraRef: RefObject<CameraRef | null>;
  /** Read (never subscribed) so toggling follow does not restart the marker. */
  isFollowingRef: RefObject<boolean>;
}

const STALE_AFTER_MS = 120_000;
const HEADING_MIN_SPEED_MS = 1;      // m/s — below this GPS heading is unreliable
const BEARING_MIN_DISTANCE_M = 5;    // below this, computed bearing is noise
const SNAP_MAX_DISTANCE_M = 1500;    // larger displacement = teleport (new trip / gap), no fly
const HOLD_MAX_DISTANCE_M = 1.5;     // below this, GPS noise — hold pose, do not move camera
// Adaptive animation window. The marker and camera ease over a duration that
// tracks the observed GPS interval (0.9x, so each hop settles just before the
// next arrives) bounded to stay responsive without crawling or snapping.
const MIN_ANIM_MS = 300;
const MAX_ANIM_MS = 1500;
const DEFAULT_ANIM_MS = 450;

export const BUS_FOLLOW_DURATION_MS = DEFAULT_ANIM_MS;

function easeLinear(t: number): number {
  return t;
}

export default function BusMarker({ cameraRef, isFollowingRef }: BusMarkerProps) {
  const busLocation = useTripStore((s) => s.busLocation);

  const [pose, setPose] = useState<Pose | null>(() => {
    const { latitude, longitude, heading } = busLocation ?? {};
    if (latitude != null && longitude != null) {
      return { lat: latitude, lng: longitude, heading: heading ?? 0 };
    }
    return null;
  });
  const poseRef = useRef<Pose | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTargetTsRef = useRef(0);   // payload timestamp — ordering / staleness
  const lastArrivalRef = useRef(0);    // wall clock — adaptive duration estimate
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

    const prevLatLng: LatLng | null = prev
      ? { latitude: prev.lat, longitude: prev.lng }
      : null;
    const dist = prevLatLng ? distanceMeters(prevLatLng, target) : 0;

    // Adaptive duration from the previous update interval (first fix falls back
    // to the default). Shared verbatim by the marker rAF and the camera easeTo.
    const interval = lastArrivalRef.current ? now - lastArrivalRef.current : DEFAULT_ANIM_MS;
    lastArrivalRef.current = now;
    const duration = clamp(interval * 0.9, MIN_ANIM_MS, MAX_ANIM_MS);

    // --- Heading selection ---
    const nextHeadingOf = (): number => {
      if (!prev || !prevLatLng) {
        return heading != null ? ((heading % 360) + 360) % 360 : 0;
      }
      // Moving fast enough and the device reports a heading: trust it.
      if (heading != null && speed != null && speed >= HEADING_MIN_SPEED_MS && dist > 0.5) {
        return ((heading % 360) + 360) % 360;
      }
      // Displaced meaningfully: derive bearing from the actual movement.
      if (dist >= BEARING_MIN_DISTANCE_M) {
        return computeBearing(prevLatLng, target);
      }
      // Barely moved: hold orientation (stationary jitter prevention).
      return prev.heading;
    };

    const shouldSnap = !prev || tripChanged || dist > SNAP_MAX_DISTANCE_M;

    if (shouldSnap) {
      const snapped: Pose = {
        lat: latitude,
        lng: longitude,
        heading: nextHeadingOf(),
      };
      poseRef.current = snapped;
      setPose(snapped);
      // Snap the camera too so a new trip never flies across the map.
      if (isFollowingRef.current) {
        cameraRef.current?.jumpTo({ center: [snapped.lng, snapped.lat] });
      }
      return;
    }

    const nextHeading = nextHeadingOf();

    // GPS noise: the bus has not meaningfully moved. Hold the pose and leave the
    // camera completely still — no animation, no bridge traffic, no jitter.
    if (dist < HOLD_MAX_DISTANCE_M) {
      const held: Pose = { lat: prev!.lat, lng: prev!.lng, heading: nextHeading };
      poseRef.current = held;
      setPose(held);
      return;
    }

    const from: Pose = { ...prev! };
    const startTime = now;

    // Frame-locked motion: ONE interpolation drives both the marker and the
    // camera. Each animation frame sets the marker pose and, while following,
    // commands the camera to that EXACT same coordinate via jumpTo. Because
    // they consume the identical value in the identical tick, the bus cannot
    // outrun the camera (the original desync), and jumpTo carries no animation
    // of its own, so rapid fixes can never stack or "slowly catch up." Manual
    // gestures flip isFollowingRef false, which stops all camera commands
    // instantly while the marker keeps moving — map and bus stay independent.
    const step = () => {
      // Manual gesture took over: stop issuing camera commands immediately so
      // the map and marker no longer fight each other while the user pans.
      if (!isFollowingRef.current) {
        rafRef.current = null;
        return;
      }
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const e = easeLinear(t);
      const next: Pose = {
        lat: from.lat + (latitude - from.lat) * e,
        lng: from.lng + (longitude - from.lng) * e,
        heading: lerpAngle(from.heading, nextHeading, e),
      };
      poseRef.current = next;
      setPose(next);
      if (isFollowingRef.current) {
        cameraRef.current?.jumpTo({ center: [next.lng, next.lat] });
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [latitude, longitude, heading, speed, tripId, updatedAt, active, cameraRef, isFollowingRef]);

  // Cleanup on unmount (screen exit / logout).
  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  if (!pose) return null;

  return (
    <Marker key="busMarker" id="busMarker" lngLat={[pose.lng, pose.lat]} anchor="bottom">
      {/* The pin tip stays anchored to the bus coordinate while the map moves. */}
      <View style={{ width: 64, height: 76, alignItems: 'center' }}>
        <Image
          source={require('../../assets/images/bus-pin.png')}
          style={{ width: 64, height: 76 }}
          resizeMode="contain"
        />
      </View>
    </Marker>
  );
}
