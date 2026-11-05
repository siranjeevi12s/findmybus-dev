import { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Floating map controls (zoom in / zoom out / find my location).
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

const BTN = 36; // dp — compact floating controls

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
      style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, gap: 8 }}
      // Android elevation so the column floats above the native map surface
      className="elevation-4"
    >
      <ControlButton label="+" onPress={onZoomIn} disabled={zoomInDisabled} testID="zoomIn" />
      <ControlButton label="−" onPress={onZoomOut} disabled={zoomOutDisabled} testID="zoomOut" />
      <ControlButton label="◎" onPress={onLocate} disabled={locateBusy} testID="locate" />
    </View>
  );
}

function ControlButton({
  label,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{
        width: BTN,
        height: BTN,
        borderRadius: BTN / 2,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0F172A',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#334155', lineHeight: 18 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export const MapControls = memo(MapControlsBase);
export default MapControls;
