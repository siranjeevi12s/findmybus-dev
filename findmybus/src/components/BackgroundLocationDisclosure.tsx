import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  /** User pressed "Allow" — caller should then call requestBackgroundPermissionsAsync() */
  onAllow: () => void;
  /** User pressed "Not now" — caller should handle gracefully (trip won't start with background tracking) */
  onDeny: () => void;
}

export default function BackgroundLocationDisclosure({ visible, onAllow, onDeny }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDeny}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <Text style={styles.title}>📍 Background Location Required</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.sectionTitle}>Why this is needed:</Text>
            <Text style={styles.body}>
              FindMyBus tracks the school bus route in the background so parents can see
              the bus position even when you put the app away or switch to another app
              during the trip.
            </Text>

            <Text style={styles.sectionTitle}>What is collected:</Text>
            <Text style={styles.body}>
              Your device&apos;s GPS coordinates are sent to the FindMyBus server only while
              an active trip is running. Location updates stop automatically when the
              trip ends or you log out.
            </Text>

            <Text style={styles.sectionTitle}>Who can see it:</Text>
            <Text style={styles.body}>
              Only parents whose children are assigned to your bus can see the live
              position. No location history is retained by the app after a trip ends.
            </Text>

            <Text style={styles.note}>
              After tapping &quot;Allow in Settings&quot;, choose <Text style={styles.noteHighlight}>&quot;Allow all the time&quot;</Text>{' '}
              to enable background tracking.
            </Text>
          </ScrollView>

          <TouchableOpacity
            onPress={onAllow}
            style={styles.allowButton}
            activeOpacity={0.8}
          >
            <Text style={styles.allowText}>Allow in Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDeny}
            style={styles.denyButton}
            activeOpacity={0.8}
          >
            <Text style={styles.denyText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingBottom: 16,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  body: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  note: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 24,
  },
  noteHighlight: {
    color: '#2563eb',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  allowButton: {
    backgroundColor: '#22c55e',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  allowText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  denyButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  denyText: {
    color: '#64748b',
    fontSize: 15,
  },
});
