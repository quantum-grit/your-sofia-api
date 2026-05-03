import { colors as designColors } from '@/cssVariables'

export const palette = {
  primary: designColors.primaryLight,
  primaryLight: designColors.primaryLight,
  border: `var(--theme-elevation-200, ${designColors.border})`,
  textPrimary: `var(--theme-text, ${designColors.textPrimary})`,
  textSecondary: `var(--theme-elevation-700, ${designColors.textSecondary})`,
  textMuted: `var(--theme-elevation-500, ${designColors.textMuted})`,
  success: designColors.success,
  warning: designColors.warning,
  error: designColors.error,
  surface: `var(--theme-elevation-0, ${designColors.surface})`,
  surfaceHigh: `var(--theme-elevation-50, ${designColors.surface2})`,
}

export function colorByBucketOrder(order: number): string {
  if (order === 0) return palette.success
  if (order === 1) return palette.warning
  return palette.error
}
