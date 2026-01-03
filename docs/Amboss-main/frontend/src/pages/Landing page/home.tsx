import { useNavigate } from 'react-router-dom'
import Capabilities from './components/capabilities'
import Footer from './components/footer'
import Hero from './components/heroSection'
import Materials from './components/materials'
import Services from './components/services'
import WhyUs from './components/whyUs'
import { NewsCarousel } from '../News/news'

function Home() {
  const navigate = useNavigate()

  const handleNewsLearnMore = (anchorId: string) => {
    navigate(`/news#${anchorId}`)
  }

  return (
    <main>
      <Hero />
      <NewsCarousel onLearnMore={handleNewsLearnMore} />
      <WhyUs />
      <Services />
      <Capabilities />
      <Materials />
      <Footer />
    </main>
  )
}

export default Home
