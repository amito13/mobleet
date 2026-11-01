import Constants from 'expo-constants'
import { Platform } from 'react-native'

import type { CaseResult } from '@/lib/judge'
import type { LanguageId } from '@/lib/problems'
import { supabase } from '@/lib/supabase'

export type { CaseResult } from '@/lib/judge'

export type SubmitResponse = {
  submissionId: string
  status: string
  solved: boolean
  passed: number
  total: number
  results: CaseResult[]
}

export function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
    || Constants.expoConfig?.extra?.router?.origin
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '')

  // Web can use its own origin; installed native apps need a hosted API.
  if (Platform.OS === 'web') return ''
  if (!__DEV__) {
    throw new Error('The submission server is not configured for this build. Set EXPO_PUBLIC_API_BASE_URL to the hosted API URL and rebuild the app.')
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest?: { hostUri?: string } }).manifest?.hostUri

  if (!hostUri) throw new Error('Cannot find the development server. Set EXPO_PUBLIC_API_BASE_URL to a server reachable from this device.')
  return `http://${hostUri.split('/')[0]}`
}

export async function submitSolution(params: {
  problemId: string
  language: LanguageId
  sourceCode: string
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('You must be signed in to submit.')

  const apiBaseUrl = resolveApiBaseUrl()
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    })
  } catch {
    throw new Error('Could not reach the submission server. Check your connection and try again.')
  }

  const text = await response.text()
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    if (response.status === 401) {
      throw new Error('Your session was rejected. Sign out and sign in again, then retry.')
    }
    throw new Error(
      `Submit failed (${response.status}): ${text.trim().slice(0, 200) || 'Empty server response'}`,
    )
  }
  if (!response.ok) {
    const error = payload && typeof payload === 'object'
      ? (payload as { error?: unknown; message?: unknown })
      : null
    const message = error?.error ?? error?.message
    throw new Error(typeof message === 'string' ? message : `Submit failed (${response.status})`)
  }
  return payload as SubmitResponse
}
