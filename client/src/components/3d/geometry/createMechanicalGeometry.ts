import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Creates a precision industrial engineering mechanical turbine/flange assembly.
 * Single unified BufferGeometry for optimal 60 FPS rendering and single draw-call performance.
 */
export function createMechanicalGeometry(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = []

  // 1. Central Hub with bore
  const outerHub = new THREE.CylinderGeometry(0.7, 0.75, 1.4, 32, 1)
  outerHub.translate(0, 0, 0)
  geometries.push(outerHub)

  // Top collar
  const topCollar = new THREE.CylinderGeometry(0.55, 0.7, 0.3, 32, 1)
  topCollar.translate(0, 0.85, 0)
  geometries.push(topCollar)

  // Bottom mount base
  const baseFlange = new THREE.CylinderGeometry(1.6, 1.7, 0.35, 48, 1)
  baseFlange.translate(0, -0.7, 0)
  geometries.push(baseFlange)

  // 2. Impeller / Stator Vanes (8 helical curved blades)
  const vaneCount = 8
  for (let i = 0; i < vaneCount; i++) {
    const angle = (i / vaneCount) * Math.PI * 2

    // Blade shape using extruded trapezoid
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(1.1, 0.15)
    shape.lineTo(1.05, 0.35)
    shape.lineTo(0, 0.25)
    shape.closePath()

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.9,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 3,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    }

    const bladeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    bladeGeo.rotateX(Math.PI / 2)
    bladeGeo.rotateY(0.3) // aerodynamic pitch angle
    bladeGeo.translate(0.55, -0.35, 0)
    bladeGeo.rotateY(angle)
    geometries.push(bladeGeo)
  }

  // 3. Outer Reinforcement Stator Ring
  const outerRing = new THREE.TorusGeometry(1.5, 0.12, 16, 48)
  outerRing.rotateX(Math.PI / 2)
  outerRing.translate(0, 0.1, 0)
  geometries.push(outerRing)

  // 4. Mounting Bolt Bosses around the base flange (6 bosses)
  const bossCount = 6
  for (let i = 0; i < bossCount; i++) {
    const angle = (i / bossCount) * Math.PI * 2
    const boss = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 16)
    boss.translate(1.35 * Math.cos(angle), -0.65, 1.35 * Math.sin(angle))
    geometries.push(boss)

    // Bolt head
    const bolt = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6) // Hexagonal bolt
    bolt.translate(1.35 * Math.cos(angle), -0.6, 1.35 * Math.sin(angle))
    geometries.push(bolt)
  }

  // Normalize all geometries to non-indexed with standard position & normal attributes
  const normalized = geometries.map((g) => {
    const nonIdx = g.index ? g.toNonIndexed() : g.clone()
    nonIdx.computeVertexNormals()
    for (const name of Object.keys(nonIdx.attributes)) {
      if (name !== 'position' && name !== 'normal') {
        nonIdx.deleteAttribute(name)
      }
    }
    return nonIdx
  })

  // Merge all parts into one single BufferGeometry
  const merged = BufferGeometryUtils.mergeGeometries(normalized, false)

  // Dispose all intermediate geometries to free GPU/JS memory
  for (const g of geometries) {
    g.dispose()
  }
  for (const n of normalized) {
    n.dispose()
  }

  if (!merged) {
    // Fallback: return a TorusKnot if merge fails
    const fallback = new THREE.TorusKnotGeometry(1.0, 0.35, 128, 32)
    fallback.computeBoundingBox()
    return fallback
  }

  merged.computeVertexNormals()
  merged.computeBoundingBox()

  return merged
}

