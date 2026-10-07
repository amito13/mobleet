import '@/lib/crypto-polyfill'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'
import { Platform } from 'react-native'

// Expo Router also evaluates this module in Node during server export.
const isServer = Platform.OS === 'web' && typeof window === 'undefined'

export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_KEY!,
    {
      auth: {
        storage: isServer ? undefined : AsyncStorage,
        autoRefreshToken: !isServer,
        persistSession: !isServer,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    }
  )
