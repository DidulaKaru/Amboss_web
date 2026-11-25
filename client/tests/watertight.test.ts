import { describe, it, expect } from 'vitest'
import { parseSTL } from '../src/features/quote/utils/stlParser'

// --- helpers -------------------------------------------------------------
type Tri = [number, number, number, number, number, number, number, number, number]

/** 12 triangles of a closed axis-aligned cube [0,s]^3, outward-facing. */
function cubeTriangles(s: number): Tri[] {
  const v = (x: number, y: number, z: number) => [x * s, y * s, z * s]
  const quad = (a: number[], b: number[], c: number[], d: number[]): Tri[] => [
    [...a, ...b, ...c] as Tri,
    [...a, ...c, ...d] as Tri,
  ]
  return [
    ...quad(v(0, 0, 0), v(0, 1, 0), v(1, 1, 0), v(1, 0, 0)), // bottom
    ...quad(v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1)), // top
    ...quad(v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1)), // front
    ...quad(v(0, 1, 0), v(0, 1, 1), v(1, 1, 1), v(1, 1, 0)), // back
    ...quad(v(0, 0, 0), v(0, 0, 1), v(0, 1, 1), v(0, 1, 0)), // left
    ...quad(v(1, 0, 0), v(1, 1, 0), v(1, 1, 1), v(1, 0, 1)), // right
  ]
}

const toAscii = (tris: Tri[]): ArrayBuffer =>
  new TextEncoder().encode(
    [
      'solid t',
      ...tris.map(
        (t) =>
          `facet normal 0 0 1\nouter loop\nvertex ${t[0]} ${t[1]} ${t[2]}\nvertex ${t[3]} ${t[4]} ${t[5]}\nvertex ${t[6]} ${t[7]} ${t[8]}\nendloop\nendfacet`
      ),
      'endsolid t',
    ].join('\n')
  ).buffer as ArrayBuffer

const toBinary = (tris: Tri[]): ArrayBuffer => {
  const buf = new ArrayBuffer(84 + tris.length * 50)
  const view = new DataView(buf)
  view.setUint32(80, tris.length, true)
  tris.forEach((t, i) => {
    let o = 84 + i * 50 + 12 // skip the normal
    t.forEach((n) => {
      view.setFloat32(o, n, true)
      o += 4
    })
  })
  return buf
}

// --- tests ---------------------------------------------------------------
describe('BUG-03: watertight (closed-surface) check in parseSTL', () => {
  const cube = cubeTriangles(10)

  it.each([
    ['ASCII', toAscii],
    ['binary', toBinary],
  ])('a closed cube is a valid solid (%s)', (_name, encode) => {
    const r = parseSTL(encode(cube))
    expect(r.volumeCm3).toBeCloseTo(1, 2)
    expect(r.isManifoldEstimate).toBe(true)
  })

  it.each([
    ['ASCII', toAscii],
    ['binary', toBinary],
  ])('a cube with one face missing is NOT valid (%s)', (_name, encode) => {
    expect(parseSTL(encode(cube.slice(0, -2))).isManifoldEstimate).toBe(false)
  })

  it('a cube with a single triangle missing is NOT valid', () => {
    expect(parseSTL(toAscii(cube.slice(0, -1))).isManifoldEstimate).toBe(false)
  })

  it('a lone triangle is NOT valid', () => {
    expect(parseSTL(toAscii([[0, 0, 20, 20, 0, 20, 20, 20, 20]])).isManifoldEstimate).toBe(false)
  })

  it('an inside-out (reversed) closed cube is still closed', () => {
    const reversed = cube.map((t) => [t[0], t[1], t[2], t[6], t[7], t[8], t[3], t[4], t[5]] as Tri)
    expect(parseSTL(toAscii(reversed)).isManifoldEstimate).toBe(true)
  })

  it('an edge shared by three triangles is NOT valid', () => {
    const fin: Tri = [0, 0, 0, 10, 0, 0, 5, -5, -5]
    expect(parseSTL(toAscii([...cube, fin])).isManifoldEstimate).toBe(false)
  })

  it('treats 0 and -0 as the same corner', () => {
    const negZero = cube.map((t, i) => (i % 2 ? t.map((n) => (n === 0 ? -0 : n)) : t) as Tri)
    expect(parseSTL(toBinary(negZero)).isManifoldEstimate).toBe(true)
  })

  it('an empty file is NOT valid', () => {
    expect(parseSTL(toAscii([])).isManifoldEstimate).toBe(false)
  })
})
