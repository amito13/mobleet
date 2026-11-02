import { useTabBarStyle } from '@/hooks/use-tab-bar-styles'
import { colors, fonts } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

export default function TabsLayout() {
  const tabBarStyle = useTabBarStyle()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: colors.mutedDark,
        tabBarLabelStyle: {
          fontFamily: fonts.monoSemiBold,
          fontSize: 10,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="terminal-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="problems"
        options={{
          title: 'problems',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="code-slash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
