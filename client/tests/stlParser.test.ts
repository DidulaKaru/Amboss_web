import { describe, it, expect } from 'vitest'
import { parseSTL } from '../src/features/quote/utils/stlParser'

/**
 * Helper to construct a standard binary STL for a 20mm calibration cube
 */
function createCalibrationCubeBinarySTL(size = 20): ArrayBuffer {
  // 12 triangles (2 per face * 6 faces)
  const numTriangles = 12
  const bufferSize = 84 + numTriangles * 50
  const buffer = new ArrayBuffer(bufferSize)
  const view = new DataView(buffer)

  // Write 80 byte header
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, 32) // Spaces
  }

  // Number of triangles (offset 80)
  view.setUint32(80, numTriangles, true)

  // 8 vertices of a cube [0, size]
  const p = [
    [0, 0, 0],       // 0
    [size, 0, 0],    // 1
    [size, size, 0], // 2
    [0, size, 0],    // 3
    [0, 0, size],    // 4
    [size, 0, size], // 5
    [size, size, size], // 6
    [0, size, size], // 7
  ]

  // 12 triangles with outward-facing normals (CCW winding)
  const triangles = [
    // Bottom (-Z)
    [p[0], p[2], p[1]],
    [p[0], p[3], p[2]],
    // Top (+Z)
    [p[4], p[5], p[6]],
    [p[4], p[6], p[7]],
    // Front (-Y)
    [p[0], p[1], p[5]],
    [p[0], p[5], p[4]],
    // Back (+Y)
    [p[2], p[3], p[7]],
    [p[2], p[7], p[6]],
    // Left (-X)
    [p[0], p[4], p[7]],
    [p[0], p[7], p[3]],
    // Right (+X)
    [p[1], p[2], p[6]],
    [p[1], p[6], p[5]],
  ]

  let offset = 84
  for (const tri of triangles) {
    // Normal (0,0,0 is fine, parser computes from vertices)
    view.setFloat32(offset, 0, true)
    view.setFloat32(offset + 4, 0, true)
    view.setFloat32(offset + 8, 0, true)
    offset += 12

    for (const vertex of tri) {
      view.setFloat32(offset, vertex[0], true)
      view.setFloat32(offset + 4, vertex[1], true)
      view.setFloat32(offset + 8, vertex[2], true)
      offset += 12
    }

    // Attribute byte count
    view.setUint16(offset, 0, true)
    offset += 2
  }

  return buffer
}

/**
 * Helper to construct ASCII STL for a 20mm calibration cube
 */
function createCalibrationCubeAsciiSTL(size = 20): string {
  return `solid cube
facet normal 0 0 -1
  outer loop
    vertex 0 0 0
    vertex ${size} ${size} 0
    vertex ${size} 0 0
  endloop
endfacet
facet normal 0 0 -1
  outer loop
    vertex 0 0 0
    vertex 0 ${size} 0
    vertex ${size} ${size} 0
  endloop
endfacet
facet normal 0 0 1
  outer loop
    vertex 0 0 ${size}
    vertex ${size} 0 ${size}
    vertex ${size} ${size} ${size}
  endloop
endfacet
facet normal 0 0 1
  outer loop
    vertex 0 0 ${size}
    vertex ${size} ${size} ${size}
    vertex 0 ${size} ${size}
  endloop
endfacet
facet normal 0 -1 0
  outer loop
    vertex 0 0 0
    vertex ${size} 0 0
    vertex ${size} 0 ${size}
  endloop
endfacet
facet normal 0 -1 0
  outer loop
    vertex 0 0 0
    vertex ${size} 0 ${size}
    vertex 0 0 ${size}
  endloop
endfacet
facet normal 0 1 0
  outer loop
    vertex ${size} ${size} 0
    vertex 0 ${size} 0
    vertex 0 ${size} ${size}
  endloop
endfacet
facet normal 0 1 0
  outer loop
    vertex ${size} ${size} 0
    vertex 0 ${size} ${size}
    vertex ${size} ${size} ${size}
  endloop
endfacet
facet normal -1 0 0
  outer loop
    vertex 0 0 0
    vertex 0 0 ${size}
    vertex 0 ${size} ${size}
  endloop
endfacet
facet normal -1 0 0
  outer loop
    vertex 0 0 0
    vertex 0 ${size} ${size}
    vertex 0 ${size} 0
  endloop
endfacet
facet normal 1 0 0
  outer loop
    vertex ${size} 0 0
    vertex ${size} ${size} 0
    vertex ${size} ${size} ${size}
  endloop
endfacet
facet normal 1 0 0
  outer loop
    vertex ${size} 0 0
    vertex ${size} ${size} ${size}
    vertex ${size} 0 ${size}
  endloop
endfacet
endsolid cube`
}

describe('STL Parser & Mathematical Calculation Engine', () => {
  it('correctly calculates volume, bounding box, and surface area for 20mm binary calibration cube', () => {
    const buffer = createCalibrationCubeBinarySTL(20)
    const result = parseSTL(buffer)

    // Expected volume: 20 * 20 * 20 = 8000 mm^3 = 8.0 cm^3
    expect(result.triangleCount).toBe(12)
    expect(result.volumeMm3).toBeCloseTo(8000, 1)
    expect(result.volumeCm3).toBe(8.0)

    // Expected surface area: 6 * (20 * 20) = 2400 mm^2 = 24.0 cm^2
    expect(result.surfaceAreaMm2).toBeCloseTo(2400, 1)
    expect(result.surfaceAreaCm2).toBe(24.0)

    // Bounding Box
    expect(result.boundingBox.dimensions.x).toBe(20)
    expect(result.boundingBox.dimensions.y).toBe(20)
    expect(result.boundingBox.dimensions.z).toBe(20)
    expect(result.boundingBox.min.x).toBe(0)
    expect(result.boundingBox.max.x).toBe(20)

    expect(result.isAscii).toBe(false)
    expect(result.isManifoldEstimate).toBe(true)
  })

  it('correctly parses ASCII STL 20mm calibration cube', () => {
    const asciiText = createCalibrationCubeAsciiSTL(20)
    const encoder = new TextEncoder()
    const buffer = encoder.encode(asciiText).buffer
    const result = parseSTL(buffer)

    expect(result.triangleCount).toBe(12)
    expect(result.volumeMm3).toBeCloseTo(8000, 1)
    expect(result.volumeCm3).toBe(8.0)
    expect(result.surfaceAreaMm2).toBeCloseTo(2400, 1)
    expect(result.surfaceAreaCm2).toBe(24.0)

    expect(result.boundingBox.dimensions.x).toBe(20)
    expect(result.boundingBox.dimensions.y).toBe(20)
    expect(result.boundingBox.dimensions.z).toBe(20)
    expect(result.isAscii).toBe(true)
  })
})
