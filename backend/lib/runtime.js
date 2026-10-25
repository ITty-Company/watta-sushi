/** true, коли код виконується в Cloudflare Workers (workerd), а не в Node. */
export const isWorkersRuntime =
  typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'
