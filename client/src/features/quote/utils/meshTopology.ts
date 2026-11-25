/** Identifies a vertex by value: STL repeats each shared corner in every triangle that uses it. */
const vertexKey = (p: Float32Array, o: number): string => `${p[o]},${p[o + 1]},${p[o + 2]}`

/**
 * A solid is "closed" (watertight) when every edge is shared by exactly two triangles.
 * An open surface has edges used once (the boundary); a broken mesh may have edges used 3+ times.
 *
 * @param positions flat [x, y, z, x, y, z, ...] array, 9 numbers per triangle
 */
export function isClosedSurface(positions: Float32Array): boolean {
  const triangleCount = positions.length / 9
  if (triangleCount === 0) return false

  const vertexIds = new Map<string, number>()
  const idOf = (offset: number): number => {
    const key = vertexKey(positions, offset)
    let id = vertexIds.get(key)
    if (id === undefined) {
      id = vertexIds.size
      vertexIds.set(key, id)
    }
    return id
  }

  // Edge (a, b) with a < b is packed into one safe integer, avoiding a string allocation per edge.
  const edgeUses = new Map<number, number>()
  const countEdge = (a: number, b: number): void => {
    const key = a < b ? a * 2 ** 26 + b : b * 2 ** 26 + a
    edgeUses.set(key, (edgeUses.get(key) ?? 0) + 1)
  }

  for (let t = 0; t < triangleCount; t++) {
    const a = idOf(t * 9)
    const b = idOf(t * 9 + 3)
    const c = idOf(t * 9 + 6)
    countEdge(a, b)
    countEdge(b, c)
    countEdge(c, a)
  }

  for (const uses of edgeUses.values()) {
    if (uses !== 2) return false
  }
  return true
}
