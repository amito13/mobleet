import Constants from 'expo-constants'

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
  if (process.env.EXPO_PUBLIC_API_BASE_URL) return process.env.EXPO_PUBLIC_API_BASE_URL

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest?: { hostUri?: string } }).manifest?.hostUri

  return hostUri ? `http://${hostUri.split('/')[0]}` : 'http://localhost:8081'
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

  const response = await fetch(`${resolveApiBaseUrl()}/api/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(params),
  })

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
