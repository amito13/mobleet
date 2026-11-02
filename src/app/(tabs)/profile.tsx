import { ActivityHeatmap } from '@/components/activity-heatmap'
import { CodeButton, Comment, Panel, PathHeader } from '@/components/code-ui'
import { useAuth } from '@/hooks/use-auth'
import { useScreenInsets } from '@/hooks/use-screen-insets'
import { fetchSolvedCount, fetchUserSubmissionActivity } from '@/lib/problems'
import { colors, fonts, radius } from '@/lib/theme'
import { getAvatar, getDisplayName, getInitials } from '@/lib/user'
import { Feather } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProfileScreen() {
  const { contentPadding } = useScreenInsets({ bottomExtra: 24, topExtra: 12 })
  const { user, isLoading, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [activity, setActivity] = useState<Map<string, number>>(new Map())
  const [solvedCount, setSolvedCount] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return
      setStatsLoading(true)
      Promise.all([
        fetchUserSubmissionActivity(user.id),
        fetchSolvedCount(user.id),
      ])
        .then(([activityMap, solved]) => {
          setActivity(activityMap)
          setSolvedCount(solved)
        })
        .finally(() => setStatsLoading(false))
    }, [user?.id])
  )

  const totalSubmissions = useMemo(() => {
    let total = 0
    activity.forEach((n) => {
      total += n
    })
    return total
  }, [activity])

  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.lime} />
      </SafeAreaView>
    )
  }

  const displayName = getDisplayName(user)
  const avatarUrl = getAvatar(user)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      Alert.alert('Sign out failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, contentPadding]}
          showsVerticalScrollIndicator={false}
        >
          <PathHeader path="profile" title="Profile" />

          <Panel title="user.json" icon="user" style={styles.userPanel}>
            <View style={styles.userBody}>
              <View style={styles.avatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
                )}
              </View>
              <View style={styles.json}>
                <Text style={styles.jsonLine}>{'{'}</Text>
                <JsonField name="name" value={displayName} />
                <JsonField name="email" value={user.email ?? ''} last />
                <Text style={styles.jsonLine}>{'}'}</Text>
              </View>
            </View>
          </Panel>

          <Comment style={styles.sectionLabel}>stats</Comment>
          <View style={styles.statsRow}>
            <StatCard label="solved" value={statsLoading ? '--' : String(solvedCount)} tint={colors.lime} />
            <StatCard label="runs" value={statsLoading ? '--' : String(totalSubmissions)} tint={colors.peach} />
            <StatCard label="active_days" value={statsLoading ? '--' : String(activity.size)} tint={colors.mint} />
          </View>

          <ActivityHeatmap activity={activity} loading={statsLoading} />

          <CodeButton
            label="logout"
            variant="danger"
            loading={signingOut}
            onPress={handleSignOut}
            icon={(color) => <Feather name="log-out" size={16} color={color} />}
            style={styles.signOutButton}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function JsonField({ name, value, last }: { name: string; value: string; last?: boolean }) {
  return (
    <Text style={styles.jsonLine} numberOfLines={1}>
      {'  '}
      <Text style={{ color: colors.mint }}>&quot;{name}&quot;</Text>
      <Text style={{ color: colors.muted }}>: </Text>
      <Text style={{ color: colors.string }}>&quot;{value}&quot;</Text>
      {last ? '' : ','}
    </Text>
  )
}

function StatCard({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scroll: { flexGrow: 1 },
  userPanel: { marginTop: 20 },
  userBody: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.limeSoft,
    borderWidth: 1,
    borderColor: colors.limeBorder,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { color: colors.lime, fontFamily: fonts.monoBold, fontSize: 18, },
  json: { flex: 1 },
  jsonLine: { color: colors.muted, fontFamily: fonts.mono, fontSize: 12, lineHeight: 19 },
  sectionLabel: { marginTop: 24, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: { fontFamily: fonts.monoBold, fontSize: 22, lineHeight: 28, },
  statLabel: { color: colors.muted, fontFamily: fonts.mono, fontSize: 11, marginTop: 2 },
  signOutButton: { marginTop: 24 },
})
