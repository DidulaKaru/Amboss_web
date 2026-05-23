import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Capabilities from './components/capabilities'
import Footer from './components/footer'
import Hero from './components/heroSection'
import Materials from './components/materials'
import Services from './components/services'
import WhyUs from './components/whyUs'
import { NewsCarousel } from '../news/news'

function Home() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNewsLearnMore = (anchorId: string) => {
    navigate(`/news#${anchorId}`)
  }

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
      <Hero />
      <WhyUs />
      <Services />
      <Capabilities />
      <Materials />
      <NewsCarousel onLearnMore={handleNewsLearnMore} />
      <Footer />
    </main>
  )
}

export default Home
