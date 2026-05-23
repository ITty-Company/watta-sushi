/**
 * Скидає inline-стилі, які інколи лишаються після drawer/модалок/сплешу
 * і блокують вертикальний скрол на iOS/Android.
 */
export function ensureDocumentScrollUnlocked(): void {
  if (typeof document === 'undefined') return
  const { body, documentElement: html } = document
  if (!body) return
  body.style.overflow = ''
  body.style.position = ''
  body.style.top = ''
  body.style.width = ''
  body.style.height = ''
  body.style.touchAction = ''
  html.style.overflow = ''
  html.style.height = ''
  html.style.width = ''
}
