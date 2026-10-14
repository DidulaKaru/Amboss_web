export function getAssetUrl(path: string): string {
  if (!path) return `${import.meta.env.BASE_URL}images/amboss-logo.png`
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const clean = path.replace(/^\//, '')
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}${clean}`
}
