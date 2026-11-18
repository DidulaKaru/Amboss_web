import { useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import Capabilities from './components/capabilities'
import Footer from './components/footer'
import Materials from './components/materials'
import Services from './components/services'
import WhyUs from './components/whyUs'

const HeroCanvas = lazy(() => import('../../components/3d/HeroCanvas'))

function Home() {
  const location = useLocation()

  // Scroll to hash when this page mounts or when the hash changes
  useEffect(() => {
    const hash = location.hash
    if (!hash) return
    const id = hash.slice(1)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <main>
      <Suspense
        fallback={<div id="hero-scroll-track" className="relative w-full h-[300vh] bg-zinc-950" aria-hidden="true" />}
      >
        <HeroCanvas />
      </Suspense>
      <WhyUs />
      <Services />
      <Capabilities />
      <Materials />
      <Footer />
    </main>
  )
}

export default Home
