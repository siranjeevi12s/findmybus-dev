import { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Floating map controls styled after Google Maps.
 *
 * Layout (bottom-right corner):
 *   • Large circular "My Location" button (primary action) with a target icon.
 *   • Stacked Zoom In (+) / Zoom Out (−) buttons directly below it.
 *
 * Pure presentational component — all camera logic lives in the parent
 * screen, so these buttons never trigger map-data re-renders themselves.
 * Memoized: only re-renders when a handler identity or busy flag changes.
 */
interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  zoomInDisabled?: boolean;
  zoomOutDisabled?: boolean;
  locateBusy?: boolean;
}

const LOCATE_BTN = 32; // dp — all controls same size
const ZOOM_BTN = 32;   // dp — all controls same size

const SHADOW = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.18,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 6,
} as const;

const BTN_BASE = {
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  ...SHADOW,
} as const;

const LOCATE_BTN_STYLE = {
  ...BTN_BASE,
  width: LOCATE_BTN,
  height: LOCATE_BTN,
  backgroundColor: '#f67322', // red
  borderColor: '#e6c45e',
} as const;

const ZOOM_BTN_STYLE = {
  ...BTN_BASE,
  width: ZOOM_BTN,
  height: ZOOM_BTN,
  backgroundColor: '#FFFFFF',
} as const;

function MapControlsBase({
  onZoomIn,
  onZoomOut,
  onLocate,
  zoomInDisabled,
  zoomOutDisabled,
  locateBusy,
}: MapControlsProps) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 58,
        right: 16,
        gap: 8,
        zIndex: 10,
      }}
      className="elevation-6"
    >
      {/* Primary: My Location (same size as zoom buttons, red) */}
      <TouchableOpacity
        testID="locate"
        onPress={onLocate}
        disabled={locateBusy}
        activeOpacity={0.7}
        style={{
          ...LOCATE_BTN_STYLE,
          opacity: locateBusy ? 0.5 : 1,
        }}
      >
        <Text style={{ fontSize: 20, color: '#FFFFFF', lineHeight: 20 }}>◎</Text>
      </TouchableOpacity>

      {/* Zoom controls stacked below the my-location button */}
      <View style={{ gap: 4 }}>
        <TouchableOpacity
          testID="zoomIn"
          onPress={onZoomIn}
          disabled={zoomInDisabled}
          activeOpacity={0.7}
          style={{
            ...ZOOM_BTN_STYLE,
            opacity: zoomInDisabled ? 0.5 : 1,
          }}
        >
          <Text style={{ fontSize: 18, color: '#0F172A', fontWeight: '700', lineHeight: 18 }}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="zoomOut"
          onPress={onZoomOut}
          disabled={zoomOutDisabled}
          activeOpacity={0.7}
          style={{
            ...ZOOM_BTN_STYLE,
            opacity: zoomOutDisabled ? 0.5 : 1,
          }}
        >
          <Text style={{ fontSize: 16, color: '#0F172A', fontWeight: '700', lineHeight: 16 }}>−</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const MapControls = memo(MapControlsBase);
export default MapControls;
