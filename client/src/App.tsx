import './App.css'
import Navbar from './components/navbar'
import Home from './pages/landing/home'
import Projects from './pages/Projects/projects'
import News from './pages/news/news'
import AboutUs from './pages/AboutUs/aboutUs'
import Shop from './pages/shop/Shop'
import { CartProvider } from './context/CartContext'
import { Routes, Route, useLocation } from 'react-router-dom'
import Seo from './components/seo'
import { SITE } from './config/site'

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: SITE.company,
  url: SITE.url,
  image: SITE.image,
  email: SITE.email,
  telephone: SITE.phone,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Galle',
    addressCountry: 'LK',
  },
  areaServed: ['Sri Lanka', 'Galle'],
  serviceType: [
    '3D printing services',
    'Large-format FDM printing (350×350×350 mm) - Creality K2 Plus',
    'Enclosed printers for high-temperature and specialty materials (ABS, Nylon, Carbon-fiber blends)',
    'Rapid prototyping',
    'Custom part manufacturing',
    'FDM printing',
    'SLA resin printing',
  ],
}

function RouteSeo() {
  const { pathname } = useLocation()

  if (pathname === '/projects') {
    return (
      <Seo
        title="Projects | AMBOSS"
        description="See AMBOSS engineering and 3D printing projects, from prosthetic innovation to rapid product development in Sri Lanka."
        path="/projects"
        keywords="3d printing projects sri lanka, prototyping projects galle, engineering innovation sri lanka"
      />
    )
  }

  if (pathname === '/news') {
    return (
      <Seo
        title="News | AMBOSS"
        description="Read AMBOSS updates on exhibitions, product launches, and manufacturing initiatives in Sri Lanka."
        path="/news"
        keywords="amboss news, 3d printing sri lanka updates, engineering news galle"
      />
    )
  }

  if (pathname === '/about-us') {
    return (
      <Seo
        title="About Us | AMBOSS"
        description="Learn about AMBOSS, a Sri Lanka-based team delivering precision engineering, rapid prototyping, and 3D printing solutions."
        path="/about-us"
        keywords="about amboss, 3d printing company sri lanka, engineering team galle"
      />
    )
  }

  if (pathname === '/shop') {
    return (
      <Seo
        title="Shop | AMBOSS"
        description="Buy electronics components and prototyping supplies in Sri Lanka — Arduino, ESP32, sensors, breadboards, solder and more with local delivery to Galle."
        path="/shop"
        keywords="electronics components sri lanka, electronics components galle, arduino uno sri lanka, esp32 sri lanka, ultrasonic sensor hc-sr04, mpu6050 galle, breadboard jumper cables, solder wire sri lanka, prototyping supplies galle, maker electronics shop"
      />
    )
  }

  return (
    <Seo
      title="AMBOSS | 3D Printing Services in Sri Lanka"
      description="AMBOSS offers industrial-grade 3D printing (including large-format Creality K2 Plus), rapid prototyping, and specialty-material printing (ABS, Nylon, carbon-fiber blends) with local delivery across Sri Lanka and Galle."
      path="/"
      keywords="3d printing services sri lanka, 3d printing galle, large format 3d printing 350x350x350, creality k2 plus sri lanka, enclosed printers abs nylon, carbon-fiber 3d printing, rapid prototyping sri lanka, custom manufacturing sri lanka, 3d CAD modelling sri lanka, silicone mold making sri lanka, casting sri lanka"
      jsonLd={localBusinessSchema}
    />
  )
}

function App() {
  return (
    <CartProvider>
      <div className="smooth-transitions">
        <RouteSeo />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/news" element={<News />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/shop" element={<Shop />} />
        </Routes>
      </div>
    </CartProvider>
  )
}

export default App

