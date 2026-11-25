export interface STLParseResult {
  triangleCount: number
  volumeMm3: number
  volumeCm3: number
  surfaceAreaMm2: number
  surfaceAreaCm2: number
  boundingBox: {
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
    dimensions: { x: number; y: number; z: number } // mm
  }
  positions: Float32Array // Flat array of [x, y, z, ...] for Three.js geometry
  isAscii: boolean
  isManifoldEstimate: boolean
}

/**
 * Parses binary or ASCII STL ArrayBuffer and computes geometric properties
 * using the Divergence Theorem for volume and cross product for surface area.
 */
export function parseSTL(buffer: ArrayBuffer): STLParseResult {
  const bytes = new Uint8Array(buffer)

  // Determine if file is ASCII or Binary
  const isAscii = checkIsAscii(bytes)

  if (isAscii) {
    return parseAsciiSTL(new TextDecoder().decode(bytes))
  } else {
    return parseBinarySTL(buffer)
  }
}

function checkIsAscii(bytes: Uint8Array): boolean {
  if (bytes.length < 84) return true

  // Check if starts with "solid"
  const header = String.fromCharCode(...bytes.subarray(0, 5))
  if (header.toLowerCase() !== 'solid') return false

  // Validate if file size matches binary STL formula: 84 + numTriangles * 50
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const numTriangles = view.getUint32(80, true)
  const expectedBinarySize = 84 + numTriangles * 50

  // If expected size matches exactly, it's a binary STL starting with "solid"
  if (bytes.byteLength === expectedBinarySize) {
    return false
  }

  // Scan first 512 bytes for null/binary characters
  const checkLen = Math.min(bytes.length, 512)
  for (let i = 0; i < checkLen; i++) {
    if (bytes[i] === 0) return false
  }

  return true
}

function parseBinarySTL(buffer: ArrayBuffer): STLParseResult {
  const view = new DataView(buffer)
  if (buffer.byteLength < 84) {
    throw new Error('STL buffer is too small for a valid binary header')
  }
  const triangleCount = view.getUint32(80, true)
  const expectedMinSize = 84 + triangleCount * 50
  if (buffer.byteLength < expectedMinSize) {
    throw new Error(
      `Corrupted binary STL file: expected at least ${expectedMinSize} bytes, but got ${buffer.byteLength}`
    )
  }

  const positions = new Float32Array(triangleCount * 9)

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  let totalVolume = 0
  let totalArea = 0

  let offset = 84
  let posIdx = 0

  for (let i = 0; i < triangleCount; i++) {
    // Skip normal vector (3 floats = 12 bytes)
    offset += 12

    // Vertex 1
    const v1x = view.getFloat32(offset, true)
    const v1y = view.getFloat32(offset + 4, true)
    const v1z = view.getFloat32(offset + 8, true)
    offset += 12

    // Vertex 2
    const v2x = view.getFloat32(offset, true)
    const v2y = view.getFloat32(offset + 4, true)
    const v2z = view.getFloat32(offset + 8, true)
    offset += 12

    // Vertex 3
    const v3x = view.getFloat32(offset, true)
    const v3y = view.getFloat32(offset + 4, true)
    const v3z = view.getFloat32(offset + 8, true)
    offset += 12

    // Attribute byte count (2 bytes)
    offset += 2

    // Store in positions array for rendering
    positions[posIdx++] = v1x
    positions[posIdx++] = v1y
    positions[posIdx++] = v1z

    positions[posIdx++] = v2x
    positions[posIdx++] = v2y
    positions[posIdx++] = v2z

    positions[posIdx++] = v3x
    positions[posIdx++] = v3y
    positions[posIdx++] = v3z

    // Update Bounding Box
    if (v1x < minX) minX = v1x; if (v1x > maxX) maxX = v1x
    if (v2x < minX) minX = v2x; if (v2x > maxX) maxX = v2x
    if (v3x < minX) minX = v3x; if (v3x > maxX) maxX = v3x

    if (v1y < minY) minY = v1y; if (v1y > maxY) maxY = v1y
    if (v2y < minY) minY = v2y; if (v2y > maxY) maxY = v2y
    if (v3y < minY) minY = v3y; if (v3y > maxY) maxY = v3y

    if (v1z < minZ) minZ = v1z; if (v1z > maxZ) maxZ = v1z
    if (v2z < minZ) minZ = v2z; if (v2z > maxZ) maxZ = v2z
    if (v3z < minZ) minZ = v3z; if (v3z > maxZ) maxZ = v3z

    // Signed tetrahedral volume: V_tet = 1/6 * (v1 · (v2 × v3))
    const vTet = (
      v1x * (v2y * v3z - v2z * v3y) +
      v1y * (v2z * v3x - v2x * v3z) +
      v1z * (v2x * v3y - v2y * v3x)
    ) / 6.0
    totalVolume += vTet

    // Surface Area: 1/2 * ||(v2 - v1) × (v3 - v1)||
    const ax = v2x - v1x
    const ay = v2y - v1y
    const az = v2z - v1z

    const bx = v3x - v1x
    const by = v3y - v1y
    const bz = v3z - v1z

    const cx = ay * bz - az * by
    const cy = az * bx - ax * bz
    const cz = ax * by - ay * bx

    const triArea = 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz)
    totalArea += triArea
  }

  const absVolumeMm3 = Math.abs(totalVolume)
  const volumeCm3 = absVolumeMm3 / 1000.0
  const surfaceAreaCm2 = totalArea / 100.0

  return {
    triangleCount,
    volumeMm3: absVolumeMm3,
    volumeCm3: Math.round(volumeCm3 * 100) / 100,
    surfaceAreaMm2: Math.round(totalArea * 100) / 100,
    surfaceAreaCm2: Math.round(surfaceAreaCm2 * 100) / 100,
    boundingBox: computeSafeBoundingBox(minX, minY, minZ, maxX, maxY, maxZ, triangleCount),
    positions,
    isAscii: false,
    isManifoldEstimate: absVolumeMm3 > 0.001,
  }
}

function computeSafeBoundingBox(
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
  triangleCount: number
) {
  const isValid =
    triangleCount > 0 &&
    isFinite(minX) &&
    isFinite(maxX) &&
    isFinite(minY) &&
    isFinite(maxY) &&
    isFinite(minZ) &&
    isFinite(maxZ)

  if (!isValid) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
      dimensions: { x: 0, y: 0, z: 0 },
    }
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    dimensions: {
      x: Math.round(Math.max(0, maxX - minX) * 10) / 10,
      y: Math.round(Math.max(0, maxY - minY) * 10) / 10,
      z: Math.round(Math.max(0, maxZ - minZ) * 10) / 10,
    },
  }
}

// A finite decimal number, optionally signed, with optional exponent (e.g. 1.5, -2, .5, 1e-3, 3.2E+4)
const NUM = String.raw`[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?`

function parseAsciiSTL(text: string): STLParseResult {
  // Lazily iterate vertex lines with exec() and fill a growing Float32Array,
  // instead of materialising every regex match in memory.
  const vertexPattern = new RegExp(
    String.raw`vertex\s+(${NUM})\s+(${NUM})\s+(${NUM})(?=\s|$)`,
    'g'
  )
  let coords = new Float32Array(3 * 3 * 1024)
  let coordCount = 0
  let match: RegExpExecArray | null
  while ((match = vertexPattern.exec(text)) !== null) {
    if (coordCount + 3 > coords.length) {
      const grown = new Float32Array(coords.length * 2)
      grown.set(coords)
      coords = grown
    }
    coords[coordCount++] = parseFloat(match[1])
    coords[coordCount++] = parseFloat(match[2])
    coords[coordCount++] = parseFloat(match[3])
  }

  const vertexCount = coordCount / 3
  const triangleCount = Math.floor(vertexCount / 3)

  const positions = coords.slice(0, triangleCount * 9)

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  let totalVolume = 0
  let totalArea = 0

  for (let i = 0; i < triangleCount; i++) {
    const o = i * 9
    const v1x = positions[o], v1y = positions[o + 1], v1z = positions[o + 2]
    const v2x = positions[o + 3], v2y = positions[o + 4], v2z = positions[o + 5]
    const v3x = positions[o + 6], v3y = positions[o + 7], v3z = positions[o + 8]

    if (v1x < minX) minX = v1x; if (v1x > maxX) maxX = v1x
    if (v2x < minX) minX = v2x; if (v2x > maxX) maxX = v2x
    if (v3x < minX) minX = v3x; if (v3x > maxX) maxX = v3x

    if (v1y < minY) minY = v1y; if (v1y > maxY) maxY = v1y
    if (v2y < minY) minY = v2y; if (v2y > maxY) maxY = v2y
    if (v3y < minY) minY = v3y; if (v3y > maxY) maxY = v3y

    if (v1z < minZ) minZ = v1z; if (v1z > maxZ) maxZ = v1z
    if (v2z < minZ) minZ = v2z; if (v2z > maxZ) maxZ = v2z
    if (v3z < minZ) minZ = v3z; if (v3z > maxZ) maxZ = v3z

    const vTet = (
      v1x * (v2y * v3z - v2z * v3y) +
      v1y * (v2z * v3x - v2x * v3z) +
      v1z * (v2x * v3y - v2y * v3x)
    ) / 6.0
    totalVolume += vTet

    const ax = v2x - v1x, ay = v2y - v1y, az = v2z - v1z
    const bx = v3x - v1x, by = v3y - v1y, bz = v3z - v1z
    const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx
    totalArea += 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz)
  }

  const absVolumeMm3 = Math.abs(totalVolume)
  const volumeCm3 = absVolumeMm3 / 1000.0
  const surfaceAreaCm2 = totalArea / 100.0

  return {
    triangleCount,
    volumeMm3: absVolumeMm3,
    volumeCm3: Math.round(volumeCm3 * 100) / 100,
    surfaceAreaMm2: Math.round(totalArea * 100) / 100,
    surfaceAreaCm2: Math.round(surfaceAreaCm2 * 100) / 100,
    boundingBox: computeSafeBoundingBox(minX, minY, minZ, maxX, maxY, maxZ, triangleCount),
    positions,
    isAscii: true,
    isManifoldEstimate: absVolumeMm3 > 0.001,
  }
}
