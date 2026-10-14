import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { STLParseResult } from '../utils/stlParser'

interface PartViewerProps {
  stlResult: STLParseResult
  fileName: string
}

export default function PartViewer({
  stlResult,
  fileName,
}: PartViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [wireframe, setWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Scene, Camera, Renderer
    const width = container.clientWidth
    const height = container.clientHeight || 400

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x09090b) // zinc-950

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 1.5
    controlsRef.current = controls

    // Lighting (neutral engineering studio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight1.position.set(5, 10, 7)
    dirLight1.castShadow = true
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xa1a1aa, 0.5)
    dirLight2.position.set(-5, -5, -5)
    scene.add(dirLight2)

    // Build Geometry from parsed STL Float32Array
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(stlResult.positions, 3))
    geometry.computeVertexNormals()
    geometry.center() // Center model at (0, 0, 0)
    geometry.computeBoundingBox()

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd4d4d8), // clean zinc-300 neutral metallic
      roughness: 0.4,
      metalness: 0.1,
      wireframe: wireframe,
    })
    materialRef.current = material

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)

    // Ground Plane Grid (minimal dark zinc grid)
    const bbox = geometry.boundingBox!
    const sizeY = bbox.max.y - bbox.min.y
    const maxDim = Math.max(
      bbox.max.x - bbox.min.x,
      bbox.max.y - bbox.min.y,
      bbox.max.z - bbox.min.z
    )

    const grid = new THREE.GridHelper(Math.max(100, maxDim * 2.5), 20, 0x3f3f46, 0x27272a)
    grid.position.y = -sizeY / 2 - 0.5
    scene.add(grid)

    // Fit camera to object bounding box
    const radius = maxDim * 1.6
    camera.position.set(radius * 1.1, radius * 0.9, radius * 1.4)
    camera.lookAt(0, 0, 0)
    controls.target.set(0, 0, 0)

    // Render loop
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle container resize
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight || 400
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animId)
      controls.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [stlResult, wireframe])

  // Update autoRotate dynamically
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate
    }
  }, [autoRotate])

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-80 sm:h-96 lg:h-[420px] cursor-grab active:cursor-grabbing" />

      {/* Top Header & Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-300">
          <span className="truncate max-w-[160px] sm:max-w-xs">{fileName}</span>
        </div>

        {/* Viewport Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setWireframe(!wireframe)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
              wireframe
                ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {wireframe ? 'Solid' : 'Wireframe'}
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition ${
              autoRotate
                ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {autoRotate ? 'Pause' : 'Rotate'}
          </button>
        </div>
      </div>

      {/* Bottom Model Dimensions Pill */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px] font-mono">
        <div className="px-2.5 py-1 rounded bg-zinc-900/90 border border-zinc-800 text-zinc-300">
          {stlResult.boundingBox.dimensions.x} × {stlResult.boundingBox.dimensions.y} × {stlResult.boundingBox.dimensions.z} mm
        </div>
        <div className="px-2.5 py-1 rounded bg-zinc-900/90 border border-zinc-800 text-zinc-400">
          {stlResult.volumeCm3} cm³ ({stlResult.triangleCount.toLocaleString()} triangles)
        </div>
      </div>
    </div>
  )
}
