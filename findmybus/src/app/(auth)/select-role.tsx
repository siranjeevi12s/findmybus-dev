import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const roles = [
  {
    id: 'driver' as const,
    title: 'I drive a bus',
    description: 'Manage routes, trips, and student updates.',
    icon: { ios: 'steeringwheel', android: 'directions_bus', web: 'directions_bus' },
    iconColor: '#0F766E',
    iconBackground: 'bg-teal-50',
    accent: 'bg-teal-600',
  },
  {
    id: 'parent' as const,
    title: 'I am a parent',
    description: "Follow your child's bus and arrival updates.",
    icon: { ios: 'figure.and.child.holdinghands', android: 'family_restroom', web: 'family_restroom' },
    iconColor: '#2563EB',
    iconBackground: 'bg-blue-50',
    accent: 'bg-blue-600',
  },
] as const;

export default function SelectRoleScreen() {
  const router = useRouter();

  const handleSelect = (role: 'driver' | 'parent') => {
    router.push({ pathname: '/(auth)/login', params: { role } });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        contentContainerClassName="flex-grow justify-between px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View className="mb-12 flex-row items-center">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-amber-400">
              <SymbolView
                name={{ ios: 'bus.fill', android: 'directions_bus', web: 'directions_bus' }}
                tintColor="#0F172A"
                size={24}
              />
            </View>
            <Text className="text-lg font-bold tracking-wide text-white">FINDMYBUS</Text>
          </View>

          <Text className="mb-3 text-4xl font-bold leading-tight text-white">Your journey starts here.</Text>
          <Text className="max-w-sm text-base leading-6 text-slate-400">
            Choose how you use FindMyBus so we can set up the right experience for you.
          </Text>
        </View>

        <View className="mt-12">
          <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Continue as</Text>

          {roles.map((role) => (
            <Pressable
              key={role.id}
              accessibilityRole="button"
              accessibilityLabel={role.title}
              className="mb-4 overflow-hidden rounded-3xl bg-white active:opacity-90"
              onPress={() => handleSelect(role.id)}
            >
              <View className="flex-row items-center p-5">
                <View className={`mr-4 h-14 w-14 items-center justify-center rounded-2xl ${role.iconBackground}`}>
                  <SymbolView
                    name={role.icon}
                    tintColor={role.iconColor}
                    size={28}
                    type="hierarchical"
                  />
                </View>
                <View className="flex-1 pr-3">
                  <Text className="text-lg font-bold text-slate-900">{role.title}</Text>
                  <Text className="mt-1 text-sm leading-5 text-slate-500">{role.description}</Text>
                </View>
                <View className={`h-9 w-9 items-center justify-center rounded-full ${role.accent}`}>
                  <SymbolView
                    name={{ ios: 'arrow.up.right', android: 'arrow_forward', web: 'arrow_forward' }}
                    tintColor="#FFFFFF"
                    size={18}
                  />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <Text className="mt-10 text-center text-xs leading-5 text-slate-500">
          Secure access for families and school transport teams.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
