import './App.css'
import Navbar from './components/navbar'
import Home from './pages/Landing page/home'
import Products from './pages/Products/products'
import Projects from './pages/Projects/projects'
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </>
  )
}

export default App
