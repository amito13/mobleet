import { supabase } from './supabase';
import type { Session, Provider } from '@supabase/supabase-js';
import {makeRedirectUri} from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';


WebBrowser.maybeCompleteAuthSession();
const codeExchanges = new Map <string,Promise<Session | null>>();
export function getAuthRedirectUri() {
    return makeRedirectUri({path: 'auth/callback'})
}

export function isAuthCallbackUrl(url: string) {
    const {params} = QueryParams.getQueryParams(url);
    return !!(params.code || (params.access_token && params.refresh_token)) 
}

export async function createSessionFromUrl(url: string) {
    const { params, errorCode } = QueryParams.getQueryParams(url)
    if (errorCode) throw new Error(errorCode)

    if (params.code) {
        const existing = codeExchanges.get(params.code)
        if (existing) return existing

        const exchange = (async () => {
            const { data, error } = await supabase.auth.exchangeCodeForSession(params.code)
            if (error) {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) return session
                throw error
            }
            return data.session
        })()

        codeExchanges.set(params.code, exchange)

        try {
            return await exchange
        } finally {
            codeExchanges.delete(params.code)
        }
    }

    if (params.access_token && params.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
        })
        if (error) throw error
        return data.session
    }
}