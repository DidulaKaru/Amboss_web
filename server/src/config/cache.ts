/** Cache policy for public, read-only list endpoints (never for admin or mutating routes). */
export const PUBLIC_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300'
