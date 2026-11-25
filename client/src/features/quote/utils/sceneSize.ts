interface Point {
  x: number
  y: number
  z: number
}

/** Largest dimension assumed when the model has no usable bounding box (mm). */
const FALLBACK_MAX_DIM = 20

/**
 * Model height and largest dimension, used to place the grid and camera in the 3D viewer.
 * Empty or corrupt geometry gives infinite or NaN bounds, which must never reach the camera.
 */
export function getSceneSize(min: Point, max: Point): { sizeY: number; maxDim: number } {
  const x = max.x - min.x
  const y = max.y - min.y
  const z = max.z - min.z

  return {
    sizeY: Number.isFinite(y) ? Math.max(0, y) : 0,
    maxDim: [x, y, z].every(Number.isFinite) ? Math.max(1, x, y, z) : FALLBACK_MAX_DIM,
  }
}
