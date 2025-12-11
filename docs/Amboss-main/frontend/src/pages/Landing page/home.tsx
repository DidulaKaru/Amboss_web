import Capabilities from './components/capabilities'
import Footer from './components/footer'
import Hero from './components/heroSection'
import Materials from './components/materials'
import Services from './components/services'
import WhyUs from './components/whyUs'

function Home() {
  return (
    <main>
      <Hero />
      <WhyUs />
      <Services />
      <Capabilities />
      <Materials />
      <Footer />
    </main>
  )
}

export default Home