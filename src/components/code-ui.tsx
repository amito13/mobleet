import { colors, fonts, radius } from '@/lib/theme'
import { Feather } from '@expo/vector-icons'
import { useEffect, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

type FeatherName = keyof typeof Feather.glyphMap

/** `$ ~/mobleet/<path>` prompt line above a screen title. */
export function PathHeader({
  path,
  title,
  right,
}: {
  path: string
  title: string
  right?: ReactNode
}) {
  return (
    <View>
      <Text style={styles.path} numberOfLines={1}>
        <Text style={styles.prompt}>$ </Text>
        ~/mobleet/{path}
      </Text>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
    </View>
  )
}

/** Editor-window style container with a file-name tab bar. */
export function Panel({
  title,
  icon = 'file-text',
  right,
  windowControls,
  children,
  style,
  bodyStyle,
}: {
  title?: string
  icon?: FeatherName
  right?: ReactNode
  windowControls?: boolean
  children: ReactNode
  style?: StyleProp<ViewStyle>
  bodyStyle?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[styles.panel, style]}>
      {title ? (
        <View style={styles.panelHeader}>
          {windowControls ? (
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: colors.danger }]} />
              <View style={[styles.dot, { backgroundColor: colors.warning }]} />
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
            </View>
          ) : (
            <Feather name={icon} size={12} color={colors.muted} />
          )}
          <Text style={styles.panelTitle} numberOfLines={1}>
            {title}
          </Text>
          {right}
        </View>
      ) : null}
      <View style={bodyStyle}>{children}</View>
    </View>
  )
}

/** `// section label` in comment color. */
export function Comment({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<TextStyle>
}) {
  return (
    <Text style={[styles.comment, style]}>
      {'// '}
      {children}
    </Text>
  )
}

export function Badge({
  label,
  fg,
  bg,
}: {
  label: string
  fg: string
  bg: string
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: fg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label.toUpperCase()}</Text>
    </View>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'danger'

const BUTTON_FG: Record<ButtonVariant, string> = {
  primary: colors.onLime,
  secondary: colors.foreground,
  danger: colors.danger,
}

export function CodeButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  label: string
  icon?: (color: string) => ReactNode
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const fg = BUTTON_FG[variant]
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        (pressed || disabled || loading) && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon?.(fg)}
          <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  )
}

export function BlinkingCursor({
  color = colors.lime,
  height = 18,
}: {
  color?: string
  height?: number
}) {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.set(
      withRepeat(withTiming(0, { duration: 1000, easing: Easing.steps(2) }), -1)
    )
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }))

  return (
    <Animated.View
      style={[styles.cursor, { height, backgroundColor: color }, animatedStyle]}
    />
  )
}

/** Centered loading / error state used by full-screen routes. */
export function StatusBlock({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: FeatherName
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <View style={styles.statusBlock}>
      <Feather name={icon} size={24} color={colors.mutedDark} />
      <Text style={styles.statusTitle}>{title}</Text>
      {subtitle ? <Text style={styles.statusSubtitle}>{subtitle}</Text> : null}
      {action ? <View style={styles.statusAction}>{action}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  path: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  prompt: {
    color: colors.lime,
    fontFamily: fonts.monoBold,
  },
  titleRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flexShrink: 1,
    color: colors.foreground,
    fontFamily: fonts.monoBold,
    fontSize: 24,
    lineHeight: 30,
  },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  panelHeader: {
    height: 34,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardHeader,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginRight: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  panelTitle: {
    flex: 1,
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  comment: {
    color: colors.comment,
    fontFamily: fonts.monoItalic,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  button: {
    height: 50,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonPrimary: {
    backgroundColor: colors.lime,
  },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  buttonDanger: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.3)',
  },
  buttonLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.7,
  },
  cursor: {
    width: 9,
    borderRadius: 1,
  },
  statusBlock: {
    borderRadius: radius.lg,
    padding: 28,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
  },
  statusTitle: {
    color: colors.foreground,
    fontFamily: fonts.monoBold,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  statusSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
  statusAction: {
    marginTop: 18,
    alignSelf: 'stretch',
  },
})
