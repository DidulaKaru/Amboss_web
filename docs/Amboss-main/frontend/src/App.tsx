import './App.css'
import Navbar from './components/navbar'
import Home from './pages/Landing page/home'
import Products from './pages/Products/products'
import Projects from './pages/Projects/projects'
import News from './pages/News/news'
import AboutUs from './pages/AboutUs/aboutUs'
import { Routes, Route, useLocation } from 'react-router-dom'
import Seo from './components/seo'

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'AMBOSS',
  url: 'https://amboss.lk/',
  image: 'https://amboss.lk/images/amboss-logo.png',
  email: 'amboss.manufacturing@gmail.com',
  telephone: '+94779902796',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Galle',
    addressCountry: 'LK',
  },
  areaServed: ['Sri Lanka', 'Galle'],
  serviceType: [
    '3D printing services',
    'Rapid prototyping',
    'Custom part manufacturing',
    'FDM printing',
    'SLA resin printing',
  ],
}

function RouteSeo() {
  const { pathname } = useLocation()

  if (pathname === '/products') {
    return (
      <Seo
        title="Products & Services | AMBOSS"
        description="Explore AMBOSS 3D printing services in Sri Lanka: FDM, SLA resin printing, and custom parts with fast turnaround."
        path="/products"
        keywords="3d printing services sri lanka, fdm printing sri lanka, sla printing sri lanka, custom 3d parts galle"
      />
    )
  }

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

  return (
    <Seo
      title="AMBOSS | 3D Printing Services in Sri Lanka"
      description="AMBOSS offers industrial-grade 3D printing, rapid prototyping, and custom manufacturing services in Sri Lanka, including Galle."
      path="/"
      keywords="3d printing services sri lanka, 3d printing galle, rapid prototyping sri lanka, custom manufacturing sri lanka"
      jsonLd={localBusinessSchema}
    />
  )
}

function App() {
  return (
    <>
      <RouteSeo />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/news" element={<News />} />
        <Route path="/about-us" element={<AboutUs />} />
      </Routes>
    </>
  )
}

export default App

