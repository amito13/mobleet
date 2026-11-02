---
name: frontend
description: Build or modify Mobleet UI — screens, components, layouts, navigation, styling — in this Expo SDK 55 / expo-router / React Native app. Use whenever adding a screen, creating a component, changing styles or the theme, wiring a route, or fixing a UI/layout bug in src/app, src/components, or src/hooks.
---

# Mobleet frontend

Mobleet is a dark-themed coding-practice app (problems list, problem detail, code editor, profile with activity heatmap). Stack: **Expo SDK 55, React Native 0.83, React 19.2 (React Compiler on), expo-router (typed routes), Reanimated 4, Zustand, Supabase**. Package manager is **bun**.

## Before writing code

1. Expo changed a lot — check the versioned docs at https://docs.expo.dev/versions/v55.0.0/ for any Expo API you are not 100% sure about (router, image, symbols, glass-effect, etc.). Do not rely on memory of older SDKs.
2. Read the nearest existing screen that resembles what you are building (e.g. `src/app/(tabs)/problems/index.tsx` for a list screen) and copy its structure.
3. Reuse before creating: `src/lib/theme.ts`, `src/hooks/use-screen-insets.ts`, `src/hooks/use-tab-bar-styles.tsx`, `src/components/*`.

## Project layout

```
src/app/              expo-router routes (file = route)
  _layout.tsx         root Stack + auth redirect (SafeAreaProvider, StatusBar light)
  (auth)/             sign-in flow
  (tabs)/             bottom tabs: index (Home), problems, profile
    problems/[id]/    detail + solve (nested Stack)
  api/*+api.ts        server API routes (web output: "server") — not UI
src/components/       reusable UI (kebab-case filenames, named exports)
src/hooks/            use-*.ts hooks
src/lib/              data access (Supabase), theme, helpers
src/state/            Zustand stores (*-store.ts)
```

- Import with the `@/` alias (`@/lib/theme`, `@/hooks/...`), never long relative paths.
- File names are kebab-case; components are PascalCase; screens use `export default function XScreen()`.
- Adding a new tab requires a `<Tabs.Screen>` entry in `src/app/(tabs)/_layout.tsx` with an Ionicons `tabBarIcon`.
- Nested route folders get a `_layout.tsx` with `<Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1, backgroundColor: colors.background } }} />`.
- Navigate with `router.push('/problems/' + id)` / `useRouter()` from `expo-router`; typed routes are enabled, so prefer real paths over `as never` casts when possible.
- Full-screen sub-pages that should hide the tab bar (e.g. the code editor) call `useHideTabBar()`.

## Styling rules

- **Always** `StyleSheet.create` at the bottom of the file in a `const styles` block. No inline style objects except for dynamic values.
- **Tokens come from `@/lib/theme`**: `colors`, `fonts`, `radius`. Never hard-code hex/rgba in new code — add a token first.
  - Base: `background`, `foreground`, `muted`, `mutedDark`, `comment` (for `//` labels)
  - Editor chrome: `card` (panel body), `cardHeader` (tab bars / status bars / pressed rows), `cardBorder`, `borderStrong` (inputs, secondary buttons), `sheet`, `backdrop`
  - Brand: `lime` (primary / prompts / active state), text on lime is `onLime`; `limeSoft`/`limeBorder` for highlights
  - Syntax accents for decorative code: `keyword`, `fn`, `string`, `number`, `type`, `mint`, `peach`
  - Status pairs: `success`/`successBg`, `warning`/`warningBg`, `danger`/`dangerBg`
- Monospace is bundled **JetBrains Mono** (loaded in `src/app/_layout.tsx`). Never use the system `'monospace'`/`'Menlo'` names — some Android OEM fonts remap them. Pick the weight by family, **not** `fontWeight`/`fontStyle`: `fonts.mono` (400), `fonts.monoSemiBold` (600), `fonts.monoBold` (700), `fonts.monoItalic`. Use mono for titles, labels, metadata, badges, buttons, numbers and anything code-like. Body/description prose stays in the system sans font for readability.
- `radius.sm` (4) badges/chips, `radius.md` (8) inputs/buttons/icon buttons, `radius.lg` (12) panels/sheets. No pill (999) shapes.
- Horizontal screen padding 20; buttons 50 high (44 compact); icon buttons 36×36.
- Pressed states: `pressed && styles.pressed` (opacity 0.7), or `backgroundColor: colors.cardHeader` for list rows. `hitSlop` on small icon buttons.
- Icons: `@expo/vector-icons` (`Feather` preferred, `Ionicons` outline variants), 12–16 inline.
- Dark-only; `StatusBar style="light"`.

## Design language: IDE / terminal

The app should feel like a code editor. Build with the shared kit in `src/components/code-ui.tsx` before writing custom styles:

| Component | Use for |
|---|---|
| `PathHeader path="problems" title="Problems" right={...}` | Top of every tab screen — renders `$ ~/mobleet/<path>` + mono title |
| `Panel title="file.ts" icon="..." right={...} windowControls?` | Any grouped content — editor window with a file-name tab bar. Lists go inside one Panel with 1px `cardBorder` dividers between rows, not as separate cards |
| `Comment>section_name</Comment>` | Section labels (`// section_name`, snake_case) instead of bold headings |
| `Badge label fg bg` | Difficulty / status tags (mono, uppercase, square) |
| `CodeButton label variant="primary|secondary|danger" icon={(c) => <Feather … color={c} />} loading` | All buttons |
| `StatusBlock icon title subtitle action` | Empty / error / locked states (dashed panel). Titles read like terminal output: `0 results`, `404: problem not found` |
| `BlinkingCursor` | Accent after a prompt or name; use sparingly |

Copy conventions: lowercase mono labels (`solved`, `case_1`, `stdin`/`expected`/`stdout`), file-name style titles (`README.md`, `runs.log`, `solution.py`), tags as `#tag`, prompts with `$` or `>` in lime.

## Screen skeleton

```tsx
import { Comment, Panel, PathHeader } from '@/components/code-ui'
import { useScreenInsets } from '@/hooks/use-screen-insets'
import { colors } from '@/lib/theme'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ExampleScreen() {
  const { contentPadding } = useScreenInsets({ bottomExtra: 24, topExtra: 12 })

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, contentPadding]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <PathHeader path="example" title="Example" />
          <Comment style={styles.sectionLabel}>details</Comment>
          <Panel title="details.md" bodyStyle={styles.panelBody}>
            <Text style={styles.body}>Content</Text>
          </Panel>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  sectionLabel: { marginTop: 24, marginBottom: 10 },
  panelBody: { padding: 14 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
})
```

- Use `SafeAreaView` from `react-native-safe-area-context` (not from `react-native`), `edges={['top']}` inside tabs since the tab bar handles the bottom.
- Bottom sheets / modals: use `sheetPaddingBottom` from `useScreenInsets`.

## Data & state

- Data fetching lives in `src/lib/*.ts` (e.g. `fetchProblems()` in `lib/problems.ts`) — screens call these, never `supabase` directly.
- Screen data-loading pattern: `loading` / `refreshing` / `error` state, a `load(isRefresh)` `useCallback` with try/catch/finally, `useEffect(() => { void load() }, [load])`, and a `RefreshControl` tinted `colors.lime`.
- Always render all three states: loading (`<ActivityIndicator color={colors.lime} />`), error (danger-tinted message + retry), and empty.
- Global state (auth/session) via Zustand stores in `src/state`; select slices: `useAuthStore((s) => s.session)`. Keep screen-local state in `useState`.
- Never import `supabase-admin` in UI code.

## Code style

- TypeScript strict; type props with a `type Props = {...}`. Export shared types from the `lib` module that owns the data.
- No semicolons, single quotes, 2-space indent (match surrounding file).
- React Compiler is enabled — `useMemo`/`useCallback` are not required for perf, but keep existing ones consistent with the file.
- Animations: `react-native-reanimated` v4 (worklets), not the `Animated` API.
- Images: `expo-image`'s `Image`, not RN `Image`.

## Verify

1. `bunx tsc --noEmit` — must pass.
2. `bun run lint`.
3. If a device/emulator is available, run `bun run start` (dev client build) and check the screen visually; otherwise say the change was not checked on-device.
