import { CodeButton, Panel, PathHeader, StatusBlock } from '@/components/code-ui'
import { useScreenInsets } from '@/hooks/use-screen-insets'
import {
  difficultyTint,
  fetchProblems,
  type Difficulty,
  type ProblemListItem,
} from '@/lib/problems'
import { colors, fonts, radius } from '@/lib/theme'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD']

export default function ProblemsScreen() {
  const { contentPadding } = useScreenInsets({
    bottomExtra: 24,
    topExtra: 12,
  })
  const [problems, setProblems] = useState<ProblemListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeDifficulties, setActiveDifficulties] = useState<Set<Difficulty>>(
    new Set()
  )

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await fetchProblems()
      setProblems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return problems.filter((problem) => {
      if (
        activeDifficulties.size > 0 &&
        !activeDifficulties.has(problem.difficulty)
      ) {
        return false
      }
      if (!query) return true
      return (
        problem.title.toLowerCase().includes(query) ||
        problem.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    })
  }, [problems, search, activeDifficulties])

  const toggleDifficulty = (difficulty: Difficulty) => {
    setActiveDifficulties((prev) => {
      const next = new Set(prev)
      if (next.has(difficulty)) next.delete(difficulty)
      else next.add(difficulty)
      return next
    })
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, contentPadding]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.lime}
            />
          }
        >
          <PathHeader
            path="problems"
            title="Problems"
            right={
              <Text style={styles.count}>
                [<Text style={styles.countValue}>{problems.length}</Text>]
              </Text>
            }
          />

          <View style={styles.searchBox}>
            <Text style={styles.searchPrompt}>{'>'}</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="grep problems or tags..."
              placeholderTextColor={colors.mutedDark}
              style={styles.searchInput}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedDark} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filters}>
            <FilterChip
              label="all"
              active={activeDifficulties.size === 0}
              fg={colors.lime}
              bg={colors.limeSoft}
              onPress={() => setActiveDifficulties(new Set())}
            />
            {DIFFICULTIES.map((difficulty) => {
              const tint = difficultyTint(difficulty)
              return (
                <FilterChip
                  key={difficulty}
                  label={difficulty.toLowerCase()}
                  active={activeDifficulties.has(difficulty)}
                  fg={tint.fg}
                  bg={tint.bg}
                  onPress={() => toggleDifficulty(difficulty)}
                />
              )
            })}
          </View>

          <View style={styles.list}>
            {loading ? (
              <ActivityIndicator color={colors.lime} style={{ marginTop: 40 }} />
            ) : error ? (
              <StatusBlock
                icon="alert-triangle"
                title="error: could not load problems"
                subtitle={error}
                action={
                  <CodeButton
                    label="Retry"
                    onPress={() => load()}
                    icon={(color) => (
                      <Feather name="rotate-cw" size={14} color={color} />
                    )}
                  />
                }
              />
            ) : filtered.length === 0 ? (
              <StatusBlock
                icon="search"
                title="0 results"
                subtitle="Try a different keyword or clear the filters."
              />
            ) : (
              <Panel
                title={`${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
                icon="list"
              >
                {filtered.map((problem, index) => (
                  <ProblemRow
                    key={problem.id}
                    problem={problem}
                    index={problems.indexOf(problem)}
                    last={index === filtered.length - 1}
                  />
                ))}
              </Panel>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function FilterChip({
  label,
  active,
  fg,
  bg,
  onPress,
}: {
  label: string
  active: boolean
  fg: string
  bg: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: bg, borderColor: fg },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, { color: active ? fg : colors.muted }]}>
        {label}
      </Text>
    </Pressable>
  )
}

function ProblemRow({
  problem,
  index,
  last,
}: {
  problem: ProblemListItem
  index: number
  last: boolean
}) {
  const tint = difficultyTint(problem.difficulty)

  return (
    <Pressable
      onPress={() => router.push(`/problems/${problem.id}` as never)}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
    >
      <Text style={styles.rowIndex}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {problem.title}
          </Text>
          <Text style={[styles.rowDifficulty, { color: tint.fg }]}>
            {problem.difficulty.toLowerCase()}
          </Text>
        </View>
        {problem.tags.length > 0 ? (
          <Text style={styles.rowTags} numberOfLines={1}>
            {problem.tags
              .slice(0, 3)
              .map((tag) => `#${tag}`)
              .join('  ')}
          </Text>
        ) : null}
      </View>
    </Pressable>
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
  scroll: {
    flexGrow: 1,
  },
  count: {
    color: colors.mutedDark,
    fontFamily: fonts.mono,
    fontSize: 14,
  },
  countValue: {
    color: colors.number,
  },
  searchBox: {
    marginTop: 20,
    height: 46,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  searchPrompt: {
    color: colors.lime,
    fontFamily: fonts.mono,
    fontSize: 15,
    fontWeight: '700',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: colors.foreground,
    fontFamily: fonts.mono,
    fontSize: 14,
  },
  filters: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  chipText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  list: {
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  rowPressed: {
    backgroundColor: colors.cardHeader,
  },
  rowIndex: {
    width: 28,
    color: colors.mutedDark,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 20,
  },
  rowBody: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    flex: 1,
    color: colors.foreground,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  rowDifficulty: {
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '700',
  },
  rowTags: {
    marginTop: 4,
    color: colors.comment,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
})
