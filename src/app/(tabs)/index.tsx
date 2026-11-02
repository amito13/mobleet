import { BlinkingCursor, CodeButton, Comment, Panel } from '@/components/code-ui'
import { useAuth } from '@/hooks/use-auth'
import { useScreenInsets } from '@/hooks/use-screen-insets'
import { fetchProblems, fetchSolvedCount } from '@/lib/problems'
import { colors, fonts, radius } from '@/lib/theme'
import { getAvatar, getDisplayName, getInitials } from '@/lib/user'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const { contentPadding } = useScreenInsets({ bottomExtra: 24, topExtra: 8 })
  const { user, isLoading } = useAuth()
  const [firstProblemId, setFirstProblemId] = useState<string | null>(null)
  const [solvedCount, setSolvedCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    fetchProblems().then((problems) => setFirstProblemId(problems[0]?.id ?? null))
    fetchSolvedCount(user.id).then(setSolvedCount)
  }, [user?.id])

  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.lime} />
      </SafeAreaView>
    )
  }

  const displayName = getDisplayName(user)
  const firstName = displayName.split(' ')[0] ?? 'dev'
  const initials = getInitials(displayName)
  const avatarUrl = getAvatar(user)

  const openDailyChallenge = () => {
    if (firstProblemId) {
      router.push(`/problems/${firstProblemId}` as never)
    } else {
      router.push('/problems' as never)
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, contentPadding]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.topRow}>
            <View style={styles.brandRow}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../../../assets/images/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brand}>
                <Text style={styles.brandBracket}>{'<'}</Text>
                MobLeet
                <Text style={styles.brandBracket}>{' />'}</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/profile' as never)}
              style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.greeting}>
            <Text style={styles.promptLine}>
              <Text style={styles.prompt}>$ </Text>whoami
            </Text>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {firstName}
              </Text>
              <BlinkingCursor height={24} />
            </View>
          </View>

          <Panel title="today.ts" icon="calendar" style={styles.hero}>
            <View style={styles.heroBody}>
              <Text style={styles.heroCode}>
                <Text style={{ color: colors.keyword }}>await </Text>
                <Text style={{ color: colors.fn }}>practice</Text>
                <Text style={{ color: colors.muted }}>(</Text>
                <Text style={{ color: colors.string }}>&apos;daily&apos;</Text>
                <Text style={{ color: colors.muted }}>)</Text>
              </Text>
              <Comment style={styles.heroComment}>
                one problem a day keeps the streak alive
              </Comment>
              <CodeButton
                label="Run daily challenge"
                onPress={openDailyChallenge}
                icon={(color) => <Feather name="play" size={14} color={color} />}
                style={styles.heroButton}
              />
            </View>
          </Panel>

          <Comment style={styles.sectionLabel}>quick_actions</Comment>
          <Panel>
            <ActionRow
              icon="folder"
              color={colors.peach}
              title="problems/"
              subtitle="browse the full problem set"
              onPress={() => router.push('/problems' as never)}
            />
            <ActionRow
              icon="activity"
              color={colors.mint}
              title="activity.log"
              subtitle="streak & submission history"
              onPress={() => router.push('/profile' as never)}
            />
            <ActionRow
              icon="bookmark"
              color={colors.keyword}
              title="saved.json"
              subtitle="bookmarks are coming soon"
              onPress={() => router.push('/problems' as never)}
              last
            />
          </Panel>

          <Comment style={styles.sectionLabel}>this_week</Comment>
          <View style={styles.statsRow}>
            <StatCard label="solved" value={String(solvedCount)} tint={colors.lime} />
            <StatCard label="streak" value="0" tint={colors.peach} />
            <StatCard label="saved" value="0" tint={colors.mint} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function ActionRow({
  icon,
  color,
  title,
  subtitle,
  onPress,
  last,
}: {
  icon: keyof typeof Feather.glyphMap
  color: string
  title: string
  subtitle: string
  onPress: () => void
  last?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        !last && styles.actionDivider,
        pressed && styles.rowPressed,
      ]}
    >
      <Feather name={icon} size={16} color={color} />
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedDark} />
    </Pressable>
  )
}

function StatCard({
  label,
  value,
  tint,
}: {
  label: string
  value: string
  tint: string
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.limeSoft,
    borderWidth: 1,
    borderColor: colors.limeBorder,
  },
  logoImage: {
    width: 22,
    height: 22,
  },
  brand: {
    color: colors.foreground,
    fontFamily: fonts.mono,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  brandBracket: {
    color: colors.lime,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: colors.lime,
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  greeting: {
    marginTop: 28,
  },
  promptLine: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 13,
  },
  prompt: {
    color: colors.lime,
    fontWeight: '700',
  },
  nameRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    color: colors.foreground,
    fontFamily: fonts.mono,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  hero: {
    marginTop: 24,
  },
  heroBody: {
    padding: 16,
  },
  heroCode: {
    fontFamily: fonts.mono,
    fontSize: 16,
    lineHeight: 22,
  },
  heroComment: {
    marginTop: 6,
  },
  heroButton: {
    marginTop: 16,
    height: 44,
  },
  sectionLabel: {
    marginTop: 28,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  rowPressed: {
    backgroundColor: colors.cardHeader,
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    color: colors.foreground,
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '600',
  },
  actionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 2,
  },
})
