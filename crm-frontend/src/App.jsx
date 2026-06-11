import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Customers from './pages/Customers'
import Segmentation from './pages/Segmentation'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Customers />} />
        <Route path="segmentation" element={<Segmentation />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}

export default App
