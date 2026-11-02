import { AntDesign } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BlinkingCursor, CodeButton, Comment, Panel } from '@/components/code-ui'
import { SignInWithOAuth } from '@/lib/auth'
import { colors, fonts, radius } from '@/lib/theme'

type Provider = 'github' | 'google'

type Token = [text: string, color: string]

const SNIPPET: Token[][] = [
  [['const ', colors.keyword], ['you', colors.foreground], [' = {', colors.muted]],
  [['  practice', colors.mint], [': ', colors.muted], ["'anywhere'", colors.string], [',', colors.muted]],
  [['  streak', colors.mint], [': ', colors.muted], ['Infinity', colors.number], [',', colors.muted]],
  [['  progress', colors.mint], [': ', colors.muted], ['track', colors.fn], ['()', colors.muted], [',', colors.muted]],
  [['  auth', colors.mint], [': ', colors.muted], ["'supabase'", colors.string], [',', colors.muted]],
  [['}', colors.muted]],
]

export default function SignInScreen() {
  const [loading, setLoading] = useState<Provider | null>(null)

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])

  async function handleSignIn(provider: Provider) {
    if (loading) return
    setLoading(provider)
    try {
      await SignInWithOAuth(provider)
    } catch (err) {
      Alert.alert(
        'Sign in failed',
        err instanceof Error ? err.message : 'Unknown error'
      )
    } finally {
      setLoading(null)
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.version}>v1.0.0</Text>
          </View>

          <View style={styles.hero}>
            <Comment>solve smarter</Comment>
            <Text style={styles.title}>
              <Text style={styles.titleBracket}>{'<'}</Text>
              MobLeet
              <Text style={styles.titleBracket}>{' />'}</Text>
            </Text>
            <Text style={styles.subtitle}>
              Practice coding problems anywhere, keep your streak alive, and
              revisit every solution.
            </Text>
          </View>

          <Panel title="welcome.ts" windowControls style={styles.terminal}>
            <View style={styles.code}>
              {SNIPPET.map((line, i) => (
                <View key={i} style={styles.codeLine}>
                  <Text style={styles.lineNumber}>{i + 1}</Text>
                  <Text style={styles.codeText}>
                    {line.map(([text, color], j) => (
                      <Text key={j} style={{ color }}>
                        {text}
                      </Text>
                    ))}
                  </Text>
                </View>
              ))}
              <View style={styles.codeLine}>
                <Text style={styles.lineNumber}>{SNIPPET.length + 1}</Text>
                <BlinkingCursor height={16} />
              </View>
            </View>
          </Panel>

          <View style={styles.actions}>
            <Comment>sign in to continue</Comment>
            <CodeButton
              label="Continue with GitHub"
              loading={loading === 'github'}
              disabled={loading !== null}
              onPress={() => handleSignIn('github')}
              icon={(color) => <AntDesign name="github" size={18} color={color} />}
            />
            <CodeButton
              label="Continue with Google"
              variant="secondary"
              loading={loading === 'google'}
              disabled={loading !== null}
              onPress={() => handleSignIn('google')}
              icon={(color) => <AntDesign name="google" size={18} color={color} />}
            />
          </View>

          <Text style={styles.legal}>
            By continuing you agree to MobLeet&apos;s{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://example.com/terms')}
            >
              Terms
            </Text>{' '}
            and{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://example.com/privacy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.limeSoft,
    borderWidth: 1,
    borderColor: colors.limeBorder,
  },
  logoImage: {
    width: 26,
    height: 26,
  },
  version: {
    color: colors.mutedDark,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  hero: {
    marginTop: 36,
  },
  title: {
    marginTop: 8,
    color: colors.foreground,
    fontFamily: fonts.monoBold,
    fontSize: 36,
    lineHeight: 44,
  },
  titleBracket: {
    color: colors.lime,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  terminal: {
    marginTop: 28,
  },
  code: {
    paddingVertical: 12,
  },
  codeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 22,
  },
  lineNumber: {
    width: 36,
    paddingRight: 12,
    textAlign: 'right',
    color: colors.mutedDark,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  codeText: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 22,
  },
  actions: {
    marginTop: 28,
    gap: 12,
  },
  legal: {
    color: colors.mutedDark,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 24,
  },
  legalLink: {
    color: colors.muted,
    textDecorationLine: 'underline',
  },
})
