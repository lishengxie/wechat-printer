import type { ModuleStyles } from '@/types/document'

export function s(v: unknown): string {
  return v && v !== 'transparent' && v !== 'none' ? String(v) : ''
}

export function inlineStyle(styles: Partial<ModuleStyles>): string {
  const parts: string[] = []

  if (s(styles.padding)) parts.push('padding:' + styles.padding)
  if (s(styles.backgroundColor)) parts.push('background-color:' + styles.backgroundColor)
  if (s(styles.border)) parts.push('border:' + styles.border)
  if (s(styles.borderLeft)) parts.push('border-left:' + styles.borderLeft)
  if (s(styles.borderRadius)) parts.push('border-radius:' + styles.borderRadius)
  if (s(styles.textAlign)) parts.push('text-align:' + styles.textAlign)
  if (s(styles.fontSize)) parts.push('font-size:' + styles.fontSize)
  if (s(styles.color)) parts.push('color:' + styles.color)
  if (s(styles.fontWeight)) parts.push('font-weight:' + styles.fontWeight)
  if (s(styles.fontStyle)) parts.push('font-style:' + styles.fontStyle)
  if (s(styles.lineHeight)) parts.push('line-height:' + styles.lineHeight)
  if (s(styles.fontFamily)) parts.push('font-family:' + styles.fontFamily)
  if (s(styles.margin)) parts.push('margin:' + styles.margin)
  if (s(styles.paragraphSpacing)) parts.push('--paragraph-spacing:' + styles.paragraphSpacing)

  return parts.join(';')
}
