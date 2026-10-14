import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Link } from 'react-router-dom'
import { MorphShader } from './shaders/MorphShader'
import { createMechanicalGeometry } from './geometry/createMechanicalGeometry'
import { SITE } from '../../config/site'

gsap.registerPlugin(ScrollTrigger)

interface StageInfo {
  number: string
  title: string
  subtitle: string
  badge: string
}

const STAGES: StageInfo[] = [
  {
    number: '',
    badge: 'Ideation & Schematics',
    title: 'Engineering Blueprint',
    subtitle: 'Precision vector tolerances, CAD wireframe geometry, and dimensional validation.',
  },
  {
    number: '',
    badge: 'Digital Prototyping',
    title: 'SolidWorks/ Blender',
    subtitle: 'Bringing your idea to the digital realm',
  },
  {
    number: '',
    badge: 'Additive Manufacturing',
    title: 'Industrial 3D Printing',
    subtitle: 'High-temp PA12-CF carbon fiber and resin manufacturing on Creality K2 Plus & Bambu Labs.',
  },
]

export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeStage, setActiveStage] = useState(0)
  const [scrollPct, setScrollPct] = useState(0)

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
    const grid = new THREE.GridHelper(10, 20, 0x00d2ff, 0x0f4c75)
    grid.position.y = -1.3
    grid.material.opacity = 0.25
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
        setScrollPct(Math.round(progress * 100))

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
      className="relative w-full h-[300vh] bg-gradient-to-b from-[#0A121A] via-[#101A24] to-[#1B262C]"
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between pointer-events-none select-none">
        {/* Background Ambient Glows & Engineering Blueprint Grid */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Blueprint subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #00D2FF 1px, transparent 1px), linear-gradient(to bottom, #00D2FF 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          {/* Cyan glow top-left */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#00D2FF]/10 blur-3xl" />
          {/* Navy accent glow bottom-right */}
          <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#0F4C75]/25 blur-3xl" />
        </div>

        {/* WebGL 3D Canvas */}
        <canvas
          id="hero-webgl"
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-auto"
        />

        {/* Top Header / Branding Indicator */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-mono text-zinc-400">
              Scrub to transform model
            </span>
          </div>
        </div>

        {/* Center / Hero Overlay Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center pointer-events-none">
          <div className="max-w-2xl backdrop-blur-[2px]">
            {/* Dynamic Stage Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#00D2FF]/15 border border-[#00D2FF]/40 text-[#BBE1FA] shadow-lg mb-4">
              <span>{STAGES[activeStage].number}</span>
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              <span>{STAGES[activeStage].badge}</span>
            </div>

            {/* Dynamic Stage Main Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
              {STAGES[activeStage].title}
            </h1>

            {/* Subtitle description */}
            <p className="mt-4 text-base sm:text-lg text-zinc-300 max-w-xl leading-relaxed drop-shadow">
              {STAGES[activeStage].subtitle}
            </p>

            {/* CTAs (pointer-events-auto so clickable) */}
            <div className="mt-8 flex flex-wrap items-center gap-4 pointer-events-auto">
              <a
                href={`https://wa.me/${SITE.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                  'Hello Amboss! I would like to get an instant quote for a 3D printing project.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3.5 text-sm sm:text-base font-semibold text-zinc-950 shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Instant WhatsApp Quote
              </a>

              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-md backdrop-blur transition-all hover:border-cyan-400 hover:bg-zinc-800"
              >
                Explore Maker Shop
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
