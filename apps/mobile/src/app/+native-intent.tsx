/**
 * Links from outside the app (valleyride://…, other apps, web pages) may only open browsing screens. Payment,
 * checkout, cancellation and similar screens take their amounts and order ids from route params, so they are
 * reachable only from inside the app; any other incoming link opens Home.
 */
const ALLOWED = [/^\/?$/, /^\/routes$/, /^\/route\/[\w-]+$/, /^\/bike\/[\w-]+$/, /^\/rides$/, /^\/trips$/, /^\/trip\/[\w-]+$/];

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    // "valleyride://route/x" puts the first segment in the host, so read host + path rather than pathname alone.
    const u = new URL(path, 'valleyride://app');
    const p = (u.protocol === 'valleyride:' && u.host && u.host !== 'app' ? `/${u.host}${u.pathname}` : u.pathname).replace(/\/+$/, '') || '/';
    return ALLOWED.some((re) => re.test(p)) ? p : '/';
  } catch {
    return '/';
  }
}
