import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Link } from 'react-router-dom'
import { MorphShader } from './shaders/MorphShader'
import { createMechanicalGeometry } from './geometry/createMechanicalGeometry'

gsap.registerPlugin(ScrollTrigger)

interface StageInfo {
  number: string
  title: string
  subtitle: string
  badge: string
}

const STAGES: StageInfo[] = [
  {
    number: '01',
    badge: 'Design & CAD',
    title: 'Parametric CAD Modeling',
    subtitle: 'Functional 3D design and engineering files ready for fabrication.',
  },
  {
    number: '02',
    badge: 'Validation',
    title: 'Digital Prototyping',
    subtitle: 'Tolerances, fit checks, and rapid mechanical iteration.',
  },
  {
    number: '03',
    badge: 'Fabrication',
    title: 'Additive Manufacturing',
    subtitle: 'FDM and resin production on calibrated industrial and desktop machines.',
  },
]

export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeStage, setActiveStage] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // 1. Initialize Lenis Smooth Scrolling
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const tickerCb = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tickerCb)
    gsap.ticker.lagSmoothing(0)

    // 2. Three.js Scene Setup
    const scene = new THREE.Scene()
    scene.background = null // Transparent so rich CSS backdrop shines through

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    camera.position.set(0, 0.4, 4.8)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // 3. Create Model Geometry & Shader Material
    const geometry = createMechanicalGeometry()
    geometry.computeBoundingBox()
    const bbox = geometry.boundingBox || new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1))

    const shaderUniforms = {
      uProgress: { value: 0.0 },
      uTime: { value: 0.0 },
      uMinY: { value: bbox.min.y },
      uMaxY: { value: bbox.max.y },
      uLayerPitch: { value: 0.02 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: MorphShader.vertexShader,
      fragmentShader: MorphShader.fragmentShader,
      uniforms: shaderUniforms,
      transparent: true,
      depthTest: true,
      depthWrite: true,
      wireframe: false,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = 0.35 // Initial isometric engineering tilt
    mesh.rotation.y = -0.4
    mesh.scale.set(1.1, 1.1, 1.1)
    scene.add(mesh)

    // Engineering grid helper in background
    const grid = new THREE.GridHelper(10, 20, 0x3f3f46, 0x27272a)
    grid.position.y = -1.3
    grid.material.opacity = 0.2
    grid.material.transparent = true
    scene.add(grid)

    // 4. Subtle Interactive Mouse Parallax
    let targetMouseX = 0
    let targetMouseY = 0
    let currentMouseX = 0
    let currentMouseY = 0

    const onPointerMove = (e: PointerEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.4
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.3
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    // 5. GSAP ScrollTrigger Scrub Timeline
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      onUpdate: (self) => {
        const progress = self.progress
        shaderUniforms.uProgress.value = progress

        // Rotate mesh through 360 deg during the 300vh scroll scrub
        mesh.rotation.y = -0.4 + progress * Math.PI * 2.2
        mesh.rotation.x = 0.35 + Math.sin(progress * Math.PI) * 0.2

        // Camera distance modulation
        camera.position.z = 4.8 - Math.sin(progress * Math.PI) * 0.6

        // Grid opacity fades out in later stages
        grid.material.opacity = Math.max(0.04, 0.3 - progress * 0.25)

        // Stage updater
        if (progress < 0.33) {
          setActiveStage(0)
        } else if (progress < 0.66) {
          setActiveStage(1)
        } else {
          setActiveStage(2)
        }
      },
    })

    // 6. Animation Loop (60 FPS)
    let animationFrameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const elapsedTime = clock.getElapsedTime()
      shaderUniforms.uTime.value = elapsedTime

      // Smooth mouse follow interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.05
      currentMouseY += (targetMouseY - currentMouseY) * 0.05

      // Continuous subtle idle float + mouse tilt
      mesh.position.y = Math.sin(elapsedTime * 1.2) * 0.06
      mesh.rotation.z = currentMouseX * 0.5
      camera.position.x = currentMouseX * 0.8
      camera.position.y = 0.4 - currentMouseY * 0.8
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    // 7. Responsive Window Resize
    const onResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      shaderUniforms.uResolution.value.set(width, height)
    }
    window.addEventListener('resize', onResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      cancelAnimationFrame(animationFrameId)
      trigger.kill()
      gsap.ticker.remove(tickerCb)
      lenis.destroy()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      id="hero-scroll-track"
      ref={containerRef}
      className="relative w-full h-[300vh] bg-zinc-950"
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between pointer-events-none select-none">
        {/* Subtle monochrome blueprint grid overlay */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* WebGL 3D Canvas */}
        <canvas
          id="hero-webgl"
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-auto"
        />

        {/* Top Header / Indicator */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Scroll to explore process
            </span>
          </div>
        </div>

        {/* Center / Hero Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center pointer-events-none">
          <div className="max-w-xl">
            {/* Minimal Stage Badge */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 mb-4">
              <span>{STAGES[activeStage].number}</span>
              <span className="text-zinc-600">/</span>
              <span>{STAGES[activeStage].badge}</span>
            </div>

            {/* Dynamic Stage Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-zinc-100 leading-tight">
              {STAGES[activeStage].title}
            </h1>

            {/* Subtitle description */}
            <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-md leading-relaxed">
              {STAGES[activeStage].subtitle}
            </p>

            {/* Minimalist CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3 pointer-events-auto">
              <Link
                to="/quote"
                className="inline-flex items-center justify-center rounded bg-zinc-100 hover:bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-zinc-950 transition"
              >
                Instant Quote
              </Link>

              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-medium text-zinc-300 transition"
              >
                Browse Shop
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
