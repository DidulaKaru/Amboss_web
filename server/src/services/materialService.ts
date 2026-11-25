import { eq } from 'drizzle-orm'
import { getDb, schema } from '../db/index.js'
import { INITIAL_MATERIALS } from '../db/seedData.js'

export interface ResolvedMaterial {
  id: string
  name: string
  type: string
  densityGPerCm3: number
  costPerGramLkr: number
  requiresEnclosure: boolean
}

/** Resolve a material by slug from the database, falling back to the seed dataset. */
export async function resolveMaterial(
  slug: string,
  log?: { warn: (obj: unknown, msg?: string) => void }
): Promise<ResolvedMaterial | null> {
  const db = getDb()
  if (db) {
    try {
      const rows = await db
        .select()
        .from(schema.materials)
        .where(eq(schema.materials.slug, slug))
        .limit(1)
      if (rows && rows.length > 0) {
        return {
          id: rows[0].id,
          name: rows[0].name,
          type: rows[0].type,
          densityGPerCm3: parseFloat(rows[0].densityGPerCm3),
          costPerGramLkr: parseFloat(rows[0].costPerGramLkr),
          requiresEnclosure: rows[0].requiresEnclosure,
        }
      }
    } catch (err) {
      log?.warn({ err }, `Database query for material ${slug} failed`)
    }
  }

  const fallback = INITIAL_MATERIALS.find((m) => m.slug === slug)
  if (!fallback) return null
  return {
    id: fallback.slug,
    name: fallback.name,
    type: fallback.type,
    densityGPerCm3: parseFloat(fallback.densityGPerCm3),
    costPerGramLkr: parseFloat(fallback.costPerGramLkr),
    requiresEnclosure: fallback.requiresEnclosure,
  }
}
