import { Badge, CodeButton, Comment, Panel, StatusBlock } from '@/components/code-ui'
import { useAuth } from '@/hooks/use-auth'
import { useScreenInsets } from '@/hooks/use-screen-insets'
import {
  difficultyTint,
  fetchProblemById,
  fetchUserSubmissionsForProblem,
  getConstraintLines,
  getExamples,
  type LanguageExample,
  type Problem,
  type SubmissionListItem,
} from '@/lib/problems'
import { colors, fonts, radius } from '@/lib/theme'
import { Feather } from '@expo/vector-icons'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Tab = 'description' | 'solutions' | 'submissions'

const TABS: { id: Tab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'description', label: 'README.md', icon: 'file-text' },
  { id: 'solutions', label: 'solutions', icon: 'lock' },
  { id: 'submissions', label: 'runs.log', icon: 'terminal' },
]

export default function ProblemDetailsScreen() {
  const { contentPadding } = useScreenInsets({
    includeBottomInset: true,
    bottomExtra: 28,
    topExtra: 8,
  })
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const data = await fetchProblemById(id)
        if (!active) return
        setProblem(data)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load problem')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

  useFocusEffect(
    useCallback(() => {
      if (!id || !user?.id) return
      setSubmissionsLoading(true)
      fetchUserSubmissionsForProblem(user.id, id)
        .then(setSubmissions)
        .finally(() => setSubmissionsLoading(false))
    }, [id, user?.id])
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.lime} />
      </SafeAreaView>
    )
  }

  if (error || !problem) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <StatusBlock
          icon="alert-triangle"
          title="404: problem not found"
          subtitle={error ?? `The problem with id "${id}" doesn't exist yet.`}
          action={
            <CodeButton
              label="Back to problems"
              onPress={() => router.replace('/problems' as never)}
            />
          }
        />
      </SafeAreaView>
    )
  }

  const tint = difficultyTint(problem.difficulty)

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, contentPadding]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.navRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <Feather name="arrow-left" size={16} color={colors.foreground} />
            </Pressable>
            <Text style={styles.breadcrumb} numberOfLines={1}>
              problems <Text style={styles.breadcrumbSep}>/</Text>{' '}
              <Text style={styles.breadcrumbActive}>
                {problem.title.toLowerCase().replace(/\s+/g, '-')}
              </Text>
            </Text>
            <Pressable
              onPress={() =>
                Alert.alert('Report bug', 'Thanks! Bug reporting is coming soon.')
              }
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <Feather name="flag" size={14} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={styles.problemTitle}>{problem.title}</Text>
          <View style={styles.metaRow}>
            <Badge label={problem.difficulty} fg={tint.fg} bg={tint.bg} />
            <Text style={styles.metaText} numberOfLines={1}>
              {problem.tags.slice(0, 3).map((tag) => `#${tag}`).join('  ') ||
                '#general'}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabs}
            contentContainerStyle={styles.tabsContent}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.tabItem, active && styles.tabItemActive]}
                >
                  <Feather
                    name={tab.icon}
                    size={12}
                    color={active ? colors.lime : colors.mutedDark}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: active ? colors.foreground : colors.muted },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <View style={styles.tabBody}>
            {activeTab === 'description' ? (
              <DescriptionTab problem={problem} />
            ) : null}
            {activeTab === 'solutions' ? (
              <StatusBlock
                icon="lock"
                title="solutions are locked"
                subtitle="Submit a passing answer to unlock community solutions."
              />
            ) : null}
            {activeTab === 'submissions' ? (
              <SubmissionsTab
                submissions={submissions}
                loading={submissionsLoading}
              />
            ) : null}
          </View>

          <View style={styles.footer}>
            <CodeButton
              label="Open in editor"
              onPress={() =>
                router.push(`/problems/${problem.id}/solve` as never)
              }
              icon={(color) => <Feather name="code" size={16} color={color} />}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function DescriptionTab({ problem }: { problem: Problem }) {
  const examples = getExamples(problem)
  const constraints = getConstraintLines(problem.constraints)

  return (
    <View>
      <RichDescription text={problem.description} />

      {examples.map((example, index) => (
        <ExampleBlock key={index} example={example} index={index} />
      ))}

      {constraints.length > 0 ? (
        <View style={styles.section}>
          <Comment style={styles.sectionLabel}>constraints</Comment>
          <View style={styles.constraintsList}>
            {constraints.map((constraint, index) => (
              <View key={index} style={styles.constraintRow}>
                <Text style={styles.bullet}>-</Text>
                <Text style={styles.constraintText}>{constraint}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {problem.hints ? (
        <View style={styles.section}>
          <Comment style={styles.sectionLabel}>hint</Comment>
          <View style={styles.hintBox}>
            <Text style={styles.bodyText}>{problem.hints}</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

function ExampleBlock({
  example,
  index,
}: {
  example: LanguageExample
  index: number
}) {
  return (
    <Panel
      title={`example_${index + 1}.txt`}
      icon="file"
      style={styles.section}
      bodyStyle={styles.exampleBody}
    >
      <Text style={styles.codeLine}>
        <Text style={styles.codeKey}>input  </Text>
        {example.input}
      </Text>
      <Text style={[styles.codeLine, { marginTop: 4 }]}>
        <Text style={styles.codeKey}>output </Text>
        {example.output}
      </Text>
      {example.explanation ? (
        <Comment style={styles.explanation}>{example.explanation}</Comment>
      ) : null}
    </Panel>
  )
}

function RichDescription({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/)

  return (
    <View style={{ gap: 12 }}>
      {blocks.map((block, idx) => {
        const lines = block.split('\n')
        const isList = lines.every((line) => line.startsWith('- '))
        if (isList) {
          return (
            <View key={idx} style={{ gap: 6 }}>
              {lines.map((line, lineIdx) => (
                <View key={lineIdx} style={styles.constraintRow}>
                  <Text style={styles.bullet}>-</Text>
                  <BoldText text={line.slice(2)} style={styles.bodyText} />
                </View>
              ))}
            </View>
          )
        }

        return <BoldText key={idx} text={block} style={styles.bodyText} />
      })}
    </View>
  )
}

function BoldText({
  text,
  style,
}: {
  text: string
  style: { fontSize: number; lineHeight: number; color?: string }
}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <Text style={[styles.bodyText, style]}>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={idx} style={styles.boldPart}>
              {part.slice(2, -2)}
            </Text>
          )
        }
        return <Text key={idx}>{part}</Text>
      })}
    </Text>
  )
}

function statusTint(status: string) {
  if (status.toLowerCase().includes('accepted')) {
    return { fg: colors.success, bg: colors.successBg }
  }
  if (status.toLowerCase().includes('wrong')) {
    return { fg: colors.danger, bg: colors.dangerBg }
  }
  return { fg: colors.warning, bg: colors.warningBg }
}

function SubmissionsTab({
  submissions,
  loading,
}: {
  submissions: SubmissionListItem[]
  loading: boolean
}) {
  if (loading) {
    return (
      <View style={styles.submissionsLoading}>
        <ActivityIndicator color={colors.lime} />
      </View>
    )
  }

  if (submissions.length === 0) {
    return (
      <StatusBlock
        icon="terminal"
        title="runs.log is empty"
        subtitle="Once you submit your first attempt it will appear here."
      />
    )
  }

  return (
    <Panel title={`${submissions.length} runs`} icon="terminal">
      {submissions.map((submission, index) => {
        const tint = statusTint(submission.status)
        return (
          <View
            key={submission.id}
            style={[
              styles.submissionRow,
              index < submissions.length - 1 && styles.submissionDivider,
            ]}
          >
            <View style={styles.submissionTop}>
              <Badge label={submission.status} fg={tint.fg} bg={tint.bg} />
              <Text style={styles.submissionDate}>
                {new Date(submission.created_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Text style={styles.submissionMeta}>
              <Text style={{ color: colors.keyword }}>{submission.language}</Text>
              {submission.time ? `  ·  ${submission.time}` : ''}
              {submission.memory ? `  ·  ${submission.memory}` : ''}
            </Text>
          </View>
        )
      })}
    </Panel>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  navRow: {
    height: 48,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pressed: {
    opacity: 0.7,
  },
  breadcrumb: {
    flex: 1,
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  breadcrumbSep: {
    color: colors.mutedDark,
  },
  breadcrumbActive: {
    color: colors.foreground,
  },
  problemTitle: {
    color: colors.foreground,
    fontFamily: fonts.monoBold,
    fontSize: 22,
    lineHeight: 28,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    flex: 1,
    color: colors.comment,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  tabs: {
    marginTop: 20,
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  tabsContent: {
    gap: 2,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: colors.card,
    borderTopColor: colors.lime,
  },
  tabLabel: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 12,
  },
  tabBody: {
    marginTop: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  bodyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  boldPart: {
    color: colors.foreground,
    fontWeight: '700',
  },
  exampleBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  codeLine: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.mono,
  },
  codeKey: {
    color: colors.mint,
  },
  explanation: {
    marginTop: 10,
    lineHeight: 18,
  },
  constraintsList: {
    gap: 6,
  },
  constraintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    color: colors.lime,
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 20,
    marginRight: 8,
  },
  constraintText: {
    flex: 1,
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.mono,
  },
  hintBox: {
    borderLeftWidth: 2,
    borderLeftColor: colors.type,
    paddingLeft: 12,
  },
  submissionsLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  submissionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submissionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  submissionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  submissionDate: {
    color: colors.mutedDark,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  submissionMeta: {
    marginTop: 8,
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  footer: {
    marginTop: 28,
  },
})
