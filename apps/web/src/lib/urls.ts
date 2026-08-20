/**
 * Every URL the app hands to a person or to another tool.
 *
 * fibo is served from a sub-path of the portfolio (`/fibo/`), not its own
 * domain, so an app-absolute path is not a root-absolute one. Vite rewrites
 * what it can see in the bundle and in `index.html`; anything built at runtime
 * has to read `import.meta.env.BASE_URL` itself, and this module is the single
 * place that does. Getting it wrong is silent: the portfolio's catch-all
 * rewrite answers `/s/<id>` with its own index and an HTTP 200, so a bad
 * invite link looks like a working one until somebody follows it.
 */

/**
 * Read per call rather than once at module scope: the value is a build-time
 * constant, and a lazy read is what lets a test substitute a sub-path.
 * BASE_URL always carries its trailing slash; keep exactly one.
 */
function base(): string {
  return import.meta.env.BASE_URL.replace(/\/+$/, '')
}

/** An app-absolute path — what an `href` or a router `to` inside fibo needs. */
export function appPath(path = '/'): string {
  return `${base()}${path.startsWith('/') ? path : `/${path}`}`
}

/** A full URL, for sharing, QR codes and connector setup. */
export function appUrl(path = '/'): string {
  return `${window.location.origin}${appPath(path)}`
}

/** The invite link for a session: the only credential fibo has. */
export function sessionUrl(sessionId: string): string {
  return appUrl(`/s/${sessionId}`)
}
