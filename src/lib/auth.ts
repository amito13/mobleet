import { supabase } from './supabase';
import type { Session, Provider } from '@supabase/supabase-js';
import {makeRedirectUri} from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';


WebBrowser.maybeCompleteAuthSession();
const codeExchanges = new Map <string,Promise<Session | null>>();
export function getAuthRedirectUri() {
    return makeRedirectUri({scheme: 'mobleet', path: 'auth/callback'})
}

export function isAuthCallbackUrl(url: string) {
    const {params, errorCode} = QueryParams.getQueryParams(url);
    return !!(errorCode || params.error || params.code || (params.access_token && params.refresh_token))
}

export async function createSessionFromUrl(url: string) {
    const { params, errorCode } = QueryParams.getQueryParams(url)
    if (errorCode || params.error) {
        throw new Error(params.error_description || errorCode || params.error)
    }

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
function getRedirectSetupMessage(redirectUri: string) {
    return [
        'Sign-in did not return an authentication callback. If the browser showed localhost, check the Supabase redirect settings.',
        '',
        'Open Supabase Dashboard → Authentication → URL Configuration and add:',
        `  ${redirectUri}`,
        '',
        'Then try signing in again.',
    ].join('\n')
}
export async function SignInWithOAuth(provider: Provider) {
    if (Platform.OS !== 'web' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
        throw new Error(
            'Google and GitHub sign-in require the Mobleet development build. ' +
            'This app is running in Expo Go, which uses an exp:// redirect. ' +
            'Install the development build, run npx expo start --dev-client, and open Mobleet to try again.'
        )
    }

    const redirectTo = getAuthRedirectUri();

    if (__DEV__) console.log('OAuth redirect URL:', redirectTo);

    if (!redirectTo) {
        throw new Error('Could not determine OAuth redirect URI for this platform.')
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo,
            skipBrowserRedirect: true
        }
    });

    if (error) throw error
    if (!data.url) throw new Error('No OAuth URL returned')

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
        showInRecents: true
    });

    if (result.type === 'success') {
        return createSessionFromUrl(result.url)
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
        return
    }

    throw new Error(getRedirectSetupMessage(redirectTo))
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}