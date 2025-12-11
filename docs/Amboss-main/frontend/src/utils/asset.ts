/**
 * Helper to resolve public asset paths for GitHub Pages subdirectory deployment.
 */
export function asset(path: string): string {
  const base = '/Amboss_web/'
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}${normalized}`
}
