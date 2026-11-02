import { CodeEditor } from '@/components/code-editor'
import { CodeButton, Panel, StatusBlock } from '@/components/code-ui'
import { useScreenInsets } from '@/hooks/use-screen-insets'
import {
  submitSolution,
  type CaseResult,
} from '@/lib/codebox'
import {
  fetchProblemById,
  getAvailableLanguages,
  getExamples,
  getStarterCode,
  LANGUAGE_BADGE,
  LANGUAGE_LABEL,
  LANGUAGE_TINT,
  type LanguageId,
  type Problem,
} from '@/lib/problems'
import { colors, fonts, radius } from '@/lib/theme'
import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const FILE_EXTENSION: Record<LanguageId, string> = {
  javascript: 'js',
  python: 'py',
  java: 'java',
}

export default function SolveProblemScreen() {
  const { contentPadding } = useScreenInsets({
    includeBottomInset: true,
    bottomExtra: 28,
    topExtra: 6,
  })
  const { id } = useLocalSearchParams<{ id: string }>()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState<LanguageId>('javascript')
  const [code, setCode] = useState('')
  const [touched, setTouched] = useState(false)
  const languageDrafts = useRef<Partial<Record<LanguageId, string>>>({})
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeCase, setActiveCase] = useState(0)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<CaseResult[] | null>(null)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [solved, setSolved] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const data = await fetchProblemById(id)
        if (!active) return
        setProblem(data)
        if (data) {
          languageDrafts.current = {}
          const langs = getAvailableLanguages(data)
          const initial = langs[0] ?? 'javascript'
          setLanguage(initial)
          setCode(getStarterCode(data, initial))
          setTouched(false)
          setActiveCase(0)
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

  const availableLanguages = useMemo(
    () => (problem ? getAvailableLanguages(problem) : []),
    [problem]
  )

  const sampleCases = useMemo(
    () => (problem ? getExamples(problem) : []),
    [problem]
  )

  useEffect(() => {
    if (!problem || touched) return
    setCode(getStarterCode(problem, language))
  }, [language, problem, touched])

  const summary = useMemo(() => {
    if (!results) return null
    const passed = results.filter((r) => r.outcome === 'accepted').length
    return { passed, total: results.length }
  }, [results])

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.lime} />
      </SafeAreaView>
    )
  }

  if (!problem) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <StatusBlock
          icon="alert-triangle"
          title="404: problem not found"
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

  const currentCase = sampleCases[activeCase]
  const lineCount = code.split('\n').length
  const allPassed = summary !== null && summary.passed === summary.total
  const summaryColor = allPassed ? colors.success : colors.danger

  const handleReset = () => {
    Alert.alert(
      'Reset code?',
      'This will replace your edits with the starter code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setCode(getStarterCode(problem, language))
            setTouched(false)
            setResults(null)
            setSolved(false)
          },
        },
      ]
    )
  }

  const handleSubmit = async () => {
    if (running || !problem) return
    setRunning(true)
    setResults(null)
    setSolved(false)
    try {
      const response = await submitSolution({
        problemId: problem.id,
        language,
        sourceCode: code,
      })
      setResults(response.results)
      setSolved(response.solved)
      setResultsOpen(true)
      if (response.solved) {
        Alert.alert('Accepted', 'All test cases passed. Problem marked as solved.')
      }
    } catch (err) {
      Alert.alert('Submit failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setRunning(false)
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, contentPadding]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
            <Text style={styles.navTitle} numberOfLines={1}>
              {problem.title}
            </Text>

            <Pressable
              onPress={() => setPickerOpen(true)}
              style={({ pressed }) => [
                styles.languageChip,
                pressed && styles.pressed,
              ]}
            >
              <LanguageBadge language={language} />
              <Text style={styles.languageLabel}>
                {LANGUAGE_LABEL[language]}
              </Text>
              <Feather name="chevron-down" size={14} color={colors.muted} />
            </Pressable>
          </View>

          <Panel
            title={`solution.${FILE_EXTENSION[language]}`}
            icon="code"
            right={
              <Pressable
                hitSlop={8}
                onPress={handleReset}
                style={({ pressed }) => [styles.toolbarButton, pressed && styles.pressed]}
              >
                <Feather name="rotate-ccw" size={12} color={colors.muted} />
                <Text style={styles.toolbarLabel}>reset</Text>
              </Pressable>
            }
          >
            <CodeEditor
              value={code}
              onValueChange={(next) => {
                setCode(next)
                setTouched(true)
              }}
              language={language}
              minHeight={280}
              placeholder="// Write your solution here"
            />
            <View style={styles.statusBar}>
              <Text style={styles.statusText}>
                <Text style={{ color: touched ? colors.peach : colors.success }}>
                  {touched ? '● modified' : '✓ saved'}
                </Text>
              </Text>
              <Text style={styles.statusText}>
                Ln {lineCount} · {LANGUAGE_LABEL[language]}
              </Text>
            </View>
          </Panel>

          <Panel title="testcases" icon="terminal" style={styles.casesPanel}>
            {sampleCases.length > 0 ? (
              <>
                <View style={styles.caseTabs}>
                  {sampleCases.map((_, index) => {
                    const active = activeCase === index
                    const result = results?.[index]
                    return (
                      <Pressable
                        key={index}
                        onPress={() => setActiveCase(index)}
                        style={({ pressed }) => [
                          styles.caseTab,
                          active && styles.caseTabActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        {result ? (
                          <View
                            style={[
                              styles.caseDot,
                              {
                                backgroundColor:
                                  result.outcome === 'accepted'
                                    ? colors.success
                                    : colors.danger,
                              },
                            ]}
                          />
                        ) : null}
                        <Text
                          style={[
                            styles.caseTabLabel,
                            { color: active ? colors.foreground : colors.muted },
                          ]}
                        >
                          case_{index + 1}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>

                {currentCase ? (
                  <View style={styles.caseBody}>
                    <Text style={styles.fieldLabel}>stdin</Text>
                    <View style={styles.fieldBox}>
                      <Text style={styles.fieldValue}>{currentCase.input}</Text>
                    </View>

                    <Text style={styles.fieldLabel}>expected</Text>
                    <View style={styles.fieldBox}>
                      <Text style={styles.fieldValue}>{currentCase.output}</Text>
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.emptyCasesText}>
                No sample cases available for this problem.
              </Text>
            )}
          </Panel>

          {summary ? (
            <Pressable
              onPress={() => setResultsOpen(true)}
              style={({ pressed }) => [
                styles.summaryCard,
                {
                  backgroundColor: allPassed ? colors.successBg : colors.dangerBg,
                  borderColor: summaryColor,
                },
                pressed && styles.pressed,
              ]}
            >
              <Feather
                name={allPassed ? 'check-circle' : 'x-circle'}
                size={16}
                color={summaryColor}
              />
              <Text style={[styles.summaryText, { color: summaryColor }]}>
                {summary.passed}/{summary.total} passed
                {solved ? ' · solved' : ''}
              </Text>
              <Text style={styles.summaryHint}>details →</Text>
            </Pressable>
          ) : null}

          <View style={styles.footer}>
            <CodeButton
              label={running ? 'Running...' : 'Submit'}
              loading={running}
              onPress={handleSubmit}
              icon={(color) => <Feather name="play" size={16} color={color} />}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <LanguagePicker
        visible={pickerOpen}
        active={language}
        languages={availableLanguages}
        onClose={() => setPickerOpen(false)}
        onSelect={(lang) => {
          if (lang !== language) {
            languageDrafts.current[language] = code
            const draft = languageDrafts.current[lang]
            setLanguage(lang)
            setCode(draft ?? getStarterCode(problem, lang))
            setTouched(draft !== undefined)
            setResults(null)
            setSolved(false)
          }
          setPickerOpen(false)
        }}
      />

      <ResultsSheet
        visible={resultsOpen}
        onClose={() => setResultsOpen(false)}
        results={results}
        solved={solved}
      />
    </View>
  )
}

function LanguageBadge({ language }: { language: LanguageId }) {
  return (
    <View
      style={[styles.languageBadge, { backgroundColor: LANGUAGE_TINT[language] }]}
    >
      <Text style={styles.languageBadgeText}>{LANGUAGE_BADGE[language]}</Text>
    </View>
  )
}

function ResultsSheet({
  visible,
  onClose,
  results,
  solved,
}: {
  visible: boolean
  onClose: () => void
  results: CaseResult[] | null
  solved: boolean
}) {
  const { sheetPaddingBottom } = useScreenInsets()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: sheetPaddingBottom, maxHeight: '80%' },
          ]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              <Text style={{ color: colors.lime }}>$ </Text>
              run --all{solved ? '  ✓ solved' : ''}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={18} color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {results?.map((result) => (
              <ResultRow key={result.index} result={result} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function ResultRow({ result }: { result: CaseResult }) {
  const tint =
    result.outcome === 'accepted'
      ? { fg: colors.success, mark: '✓', label: 'accepted' }
      : result.outcome === 'wrong-answer'
        ? { fg: colors.danger, mark: '✗', label: 'wrong answer' }
        : { fg: colors.warning, mark: '!', label: 'error' }

  return (
    <View style={styles.resultRow}>
      <View style={styles.resultTop}>
        <Text style={[styles.resultCase, { color: tint.fg }]}>
          {tint.mark} case_{result.index + 1}{' '}
          <Text style={styles.resultOutcome}>{tint.label}</Text>
        </Text>
        {result.timeSec != null || result.memoryKb != null ? (
          <Text style={styles.resultMetaText}>
            {result.timeSec != null ? `${result.timeSec.toFixed(3)}s` : ''}
            {result.timeSec != null && result.memoryKb != null ? ' · ' : ''}
            {result.memoryKb != null ? `${result.memoryKb}KB` : ''}
          </Text>
        ) : null}
      </View>

      <ResultField label="stdin" value={result.input} />
      <ResultField label="expected" value={result.expectedOutput} />
      <ResultField
        label="stdout"
        value={result.actualOutput || '(empty)'}
        color={tint.fg}
      />
      {result.stderr ? (
        <ResultField label="stderr" value={result.stderr} color={colors.danger} />
      ) : null}
    </View>
  )
}

function ResultField({
  label,
  value,
  color = colors.foreground,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <View style={styles.resultField}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, { color }]}>{value}</Text>
    </View>
  )
}

function LanguagePicker({
  visible,
  active,
  languages,
  onClose,
  onSelect,
}: {
  visible: boolean
  active: LanguageId
  languages: LanguageId[]
  onClose: () => void
  onSelect: (lang: LanguageId) => void
}) {
  const { sheetPaddingBottom } = useScreenInsets()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: sheetPaddingBottom }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.sheetTitle, { marginBottom: 12 }]}>
            <Text style={{ color: colors.lime }}>$ </Text>
            select --language
          </Text>
          <View style={{ gap: 8 }}>
            {languages.map((lang) => {
              const isActive = active === lang
              return (
                <Pressable
                  key={lang}
                  onPress={() => onSelect(lang)}
                  style={({ pressed }) => [
                    styles.languageOption,
                    {
                      backgroundColor: isActive ? colors.limeSoft : colors.card,
                      borderColor: isActive ? colors.limeBorder : colors.cardBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <LanguageBadge language={lang} />
                  <Text style={styles.languageOptionLabel}>
                    {LANGUAGE_LABEL[lang]}
                  </Text>
                  <Text style={styles.languageOptionExt}>
                    .{FILE_EXTENSION[lang]}
                  </Text>
                  {isActive ? (
                    <Feather name="check" size={16} color={colors.lime} />
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>
    </Modal>
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
    height: 52,
    marginBottom: 8,
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
  navTitle: {
    flex: 1,
    color: colors.foreground,
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '700',
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: 8,
  },
  languageBadge: {
    width: 18,
    height: 18,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageBadgeText: {
    color: colors.onLime,
    fontFamily: fonts.mono,
    fontSize: 8,
    fontWeight: '900',
  },
  languageLabel: {
    color: colors.foreground,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: '600',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarLabel: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.cardHeader,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  statusText: {
    color: colors.mutedDark,
    fontFamily: fonts.mono,
    fontSize: 10,
  },
  casesPanel: {
    marginTop: 16,
  },
  caseTabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  caseTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  caseTabActive: {
    backgroundColor: colors.cardHeader,
    borderColor: colors.borderStrong,
  },
  caseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  caseTabLabel: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: '600',
  },
  caseBody: {
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  fieldLabel: {
    marginTop: 12,
    marginBottom: 6,
    color: colors.comment,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  fieldBox: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  fieldValue: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.mono,
  },
  emptyCasesText: {
    color: colors.muted,
    fontSize: 13,
    padding: 14,
  },
  summaryCard: {
    marginTop: 16,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  summaryText: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryHint: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  footer: {
    marginTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.backdrop,
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.sheet,
    borderTopWidth: 1,
    borderColor: colors.borderStrong,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    color: colors.foreground,
    fontFamily: fonts.mono,
    fontSize: 15,
    fontWeight: '700',
  },
  resultRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultCase: {
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: '700',
  },
  resultOutcome: {
    fontWeight: '400',
  },
  resultMetaText: {
    color: colors.mutedDark,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  resultField: {
    flexDirection: 'row',
    marginTop: 6,
  },
  resultLabel: {
    width: 72,
    color: colors.comment,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
  },
  resultValue: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.mono,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  languageOptionLabel: {
    flex: 1,
    color: colors.foreground,
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '600',
  },
  languageOptionExt: {
    color: colors.mutedDark,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
})
