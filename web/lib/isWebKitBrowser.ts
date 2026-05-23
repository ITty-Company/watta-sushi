/** Safari / WebKit (macOS, iOS, iPadOS) — не Chrome, Edge, Firefox на iOS тощо. */
export function isWebKitBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return (
    /AppleWebKit/i.test(ua) &&
    !/Chrome|CriOS|Chromium|Edg|OPR|SamsungBrowser|Firefox\//i.test(ua)
  )
}
