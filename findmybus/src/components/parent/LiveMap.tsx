import type { RefObject } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { View, Text } from 'react-native';
import { memo } from 'react';
import {
  Map,
  Camera,
  Marker,
  GeoJSONSource,
  Layer,
  type CameraRef,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import BusMarker from '../BusMarker';
import MapControls from '../MapControls';
import env from '../../env';
import { ZOOM_MIN, ZOOM_MAX } from './constants';

interface LiveMapProps {
  /**
   * Raw latest bus target, typed as required `number`: LiveMap only mounts
   * while `hasLocation` is true, and the caller narrows the fix to `number`
   * in that branch (same guarantee the original inline map had). Per-frame
   * motion itself lives inside <BusMarker/>.
   */
  busLat: number;
  busLng: number;
  /** Parent GPS position — renders the "ME" marker when available. */
  parentLoc: { latitude: number; longitude: number } | null;
  /** Validated travelled-path coordinates (historical GPS + current position). */
  routeCoordinates: number[][];
  /** Current zoom used for the initial native camera state and controls. */
  zoom: number;
  /** Live follow flag for <BusMarker/>, read without triggering re-renders. */
  isFollowingRef: RefObject<boolean>;
  cameraRef: RefObject<CameraRef | null>;
  onRegionWillChange: (e: NativeSyntheticEvent<ViewStateChangeEvent>) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  locateBusy: boolean;
}

/**
 * The live map surface and its floating controls.
 *
 * Only mounted while a valid, active bus location exists, so it renders the
 * map + controls directly (no internal hasLocation branch needed). All camera
 * follow / zoom logic stays in the parent screen — this component owns the map
 * subtree (including <BusMarker/>'s isolated re-render scope) and the control
 * overlay only.
 */
function LiveMap({
  busLat,
  busLng,
  parentLoc,
  routeCoordinates,
  zoom,
  isFollowingRef,
  cameraRef,
  onRegionWillChange,
  onZoomIn,
  onZoomOut,
  onLocate,
  locateBusy,
}: LiveMapProps) {
  return (
    <>
      <Map
        style={{ flex: 1 }}
        mapStyle={env.MAPTILER_STYLE_URL}
        logo={false}
        attribution={true}
        onRegionWillChange={onRegionWillChange}
      >
        {/* The camera is driven imperatively by <BusMarker/>, which owns the
            single animation clock shared with the marker. Keeping center and
            zoom out of changing props prevents native animation queues and
            declarative updates from competing with the user's gestures. */}
        <Camera
          ref={cameraRef}
          minZoom={ZOOM_MIN}
          maxZoom={ZOOM_MAX}
          initialViewState={{
            center: [busLng, busLat],
            zoom,
          }}
        />

        {/* Parent Location Marker */}
        {parentLoc && (
          <Marker
            key="parentMarker"
            id="parentMarker"
            lngLat={[parentLoc.longitude, parentLoc.latitude]}
          >
            <View className="w-8 h-8 bg-green-500 rounded-full border-2 border-white justify-center items-center shadow-md">
              <Text className="text-white text-[10px] font-bold">ME</Text>
            </View>
          </Marker>
        )}

        {/* Breadcrumb trail of the bus's travelled path (historical GPS
            points + current position). No parent-to-bus connector line —
            the route only ever follows the bus's own coordinates. */}
        {routeCoordinates.length >= 2 && (
          <GeoJSONSource
            key="busPathSource"
            id="busPathSource"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates,
              },
            }}
          >
            <Layer
              key="busPathLayer"
              id="busPathLayer"
              type="line"
              paint={{
                "line-color": '#3B82F6',
                "line-width": 4,
                "line-opacity": 0.7,
              }}
            />
          </GeoJSONSource>
        )}

        {/* Self-animating bus marker; also drives the follow camera so the two
            stay frame-locked (isolated re-render scope). */}
        <BusMarker cameraRef={cameraRef} isFollowingRef={isFollowingRef} />
      </Map>

      {/* Floating controls rendered AFTER the Map so they sit above the
          native map surface; LiveMap is only mounted while the live map is
          visible, so no additional gating is needed here. */}
      <MapControls
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onLocate={onLocate}
        zoomInDisabled={zoom >= ZOOM_MAX}
        zoomOutDisabled={zoom <= ZOOM_MIN}
        locateBusy={locateBusy}
      />
    </>
  );
}

export default memo(LiveMap);
