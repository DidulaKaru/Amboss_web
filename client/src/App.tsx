import './App.css'
import Navbar from './components/navbar'
import Home from './pages/landing/home'
import Projects from './pages/Projects/projects'
import AboutUs from './pages/AboutUs/aboutUs'
import { lazy, Suspense } from 'react'
import { CartProvider } from './features/shop/cartContext'
import { AdminAuthProvider } from './features/admin/AdminAuthContext'
import AdminRoute from './features/admin/AdminRoute'

const QuotePage = lazy(() => import('./features/quote/QuotePage'))
const Shop = lazy(() => import('./features/shop/ShopPage'))
const AdminLogin = lazy(() => import('./features/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'))
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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

const quoteServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Instant 3D Printing Quotation & Manufacturing',
  provider: {
    '@type': 'LocalBusiness',
    name: SITE.company,
    url: SITE.url,
  },
  serviceType: '3D Printing & Rapid Prototyping',
  areaServed: ['Sri Lanka', 'Galle'],
  description: 'Instant volumetric calculation and LKR quotation for custom 3D printing and rapid prototyping.',
}

const shopSchema = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'AMBOSS Maker Electronics Store',
  url: `${SITE.url}/shop`,
  description: 'Maker hardware, microcontrollers, sensors, and prototyping accessories in Sri Lanka.',
  parentOrganization: {
    '@type': 'LocalBusiness',
    name: SITE.company,
  },
}

function RouteSeo() {
  const { pathname } = useLocation()

  if (pathname.startsWith('/admin')) {
    return (
      <Seo
        title="Terminal Access | AMBOSS SYS.CTRL"
        description="Amboss catalog and inventory management terminal."
        path={pathname}
        noindex
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
        jsonLd={shopSchema}
      />
    )
  }

  if (pathname === '/quote') {
    return (
      <Seo
        title="Instant 3D Print Quote | AMBOSS"
        description="Upload your STL CAD model for instant volumetric mass estimation, material selection, and itemized 3D printing quotation in LKR."
        path="/quote"
        keywords="instant 3d quote sri lanka, stl quote galle, 3d printing cost calculator, amboss instant quote"
        jsonLd={quoteServiceSchema}
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
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')

  return (
    <AdminAuthProvider>
      <CartProvider>
        <div className="smooth-transitions">
          <RouteSeo />
          {!isAdminRoute && <Navbar />}
          <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quote" element={<QuotePage />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/news" element={<Navigate to="/projects" replace />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
          </Suspense>
        </div>
      </CartProvider>
    </AdminAuthProvider>
  )
}

export default App

