/**
 * Closed-surface (watertight) check for triangle soups such as STL.
 *
 * Uses open-addressing hash tables in typed arrays instead of Map<string, number>: a 50 MB upload holds
 * about a million triangles, where allocating a key per corner and per edge took seconds.
 */

/** Smallest power of two that keeps a table of `entries` items at most 80 % full. */
function tableSize(entries: number): number {
  let size = 16
  while (size < entries * 1.25) size *= 2
  return size
}

function mix(a: number, b: number): number {
  let h = Math.imul(a, 0x9e3779b1) ^ Math.imul(b, 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 15), 0xc2b2ae35)
  return (h ^ (h >>> 13)) >>> 0
}

/**
 * Gives every corner the index of the first corner at the same position: STL repeats each shared corner
 * in every triangle that uses it, so corners only match by value.
 */
function weldCorners(p: Float32Array): Int32Array {
  const cornerCount = p.length / 3
  const ids = new Int32Array(cornerCount)
  const mask = tableSize(cornerCount) - 1
  const table = new Int32Array(mask + 1).fill(-1)
  const floats = new Float32Array(3)
  const bits = new Int32Array(floats.buffer)

  for (let i = 0; i < cornerCount; i++) {
    const o = i * 3
    // Adding 0 turns -0 into +0 so both hash alike
    floats[0] = p[o] + 0
    floats[1] = p[o + 1] + 0
    floats[2] = p[o + 2] + 0
    let slot = mix(mix(bits[0], bits[1]), bits[2]) & mask
    let other = table[slot]
    while (other !== -1 && !(p[other * 3] === p[o] && p[other * 3 + 1] === p[o + 1] && p[other * 3 + 2] === p[o + 2])) {
      slot = (slot + 1) & mask
      other = table[slot]
    }
    if (other === -1) {
      table[slot] = i
      other = i
    }
    ids[i] = other
  }
  return ids
}

/**
 * A solid is "closed" (watertight) when every edge is shared by exactly two triangles.
 * An open surface has edges used once (the boundary); a broken mesh may have edges used 3+ times.
 *
 * @param positions flat [x, y, z, x, y, z, ...] array, 9 numbers per triangle
 */
export function isClosedSurface(positions: Float32Array): boolean {
  if (positions.length === 0) return false

  const ids = weldCorners(positions)
  const mask = tableSize(ids.length) - 1
  const low = new Int32Array(mask + 1).fill(-1)
  const high = new Int32Array(mask + 1)
  const uses = new Uint8Array(mask + 1)
  let unpairedEdges = 0

  for (let i = 0; i < ids.length; i++) {
    const from = ids[i]
    const to = ids[i % 3 === 2 ? i - 2 : i + 1]
    const a = Math.min(from, to)
    const b = Math.max(from, to)
    let slot = mix(a, b) & mask
    while (low[slot] !== -1 && (low[slot] !== a || high[slot] !== b)) slot = (slot + 1) & mask
    low[slot] = a
    high[slot] = b
    uses[slot]++
    if (uses[slot] > 2) return false
    unpairedEdges += uses[slot] === 1 ? 1 : -1
  }
  return unpairedEdges === 0
}
