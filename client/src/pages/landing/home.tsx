import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Capabilities from './components/capabilities'
import Footer from './components/footer'
import HeroCanvas from '../../components/3d/HeroCanvas'
import Materials from './components/materials'
import Services from './components/services'
import WhyUs from './components/whyUs'

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
      <HeroCanvas />
      <WhyUs />
      <Services />
      <Capabilities />
      <Materials />
      <Footer />
    </main>
  )
}

export default Home
