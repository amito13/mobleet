import { colors } from '@/lib/theme'
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_400Regular_Italic,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
  useFonts,
} from '@expo-google-fonts/jetbrains-mono'
import { useAuthStore } from '@/state/auth-store'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import 'react-native-url-polyfill/auto'

SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)
  const initialize = useAuthStore((s) => s.initialize)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    const cleanup = initialize()
    return cleanup
  }, [initialize])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'
    const inAuthCallback = segments[0] === 'auth'

    if (!session && !inAuthGroup && !inAuthCallback) {
      router.replace('/(auth)/sign-in' as never)
    } else if (session && inAuthGroup) {
      router.replace('/' as never)
    }

    SplashScreen.hideAsync()
  }, [session, isLoading, segments, router])

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.lime} />
      </View>
    )
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="auth/callback" />
    </Stack>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_400Regular_Italic,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  })

  // Splash stays up (preventAutoHideAsync) until fonts are ready.
  if (!fontsLoaded && !fontError) return null

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  )
}
