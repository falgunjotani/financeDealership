/**
 * App.jsx
 *
 * Root component responsible for:
 *  - Providing the DealContext to the whole tree
 *  - Setting up React Router routes (HashRouter for IIS compatibility)
 *  - Rendering the persistent Navbar
 *
 * HashRouter is used instead of BrowserRouter so that IIS doesn't need
 * any URL-rewriting configuration – all routes resolve as /#/path, which
 * the browser handles entirely on the client side.
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DealProvider } from './context/DealContext'
import Navbar from './components/Navbar'
import CreateDeal from './pages/CreateDeal'
import Offers from './pages/Offers'
import Summary from './pages/Summary'
import SeedData from './pages/SeedData'

export default function App() {
  return (
    <DealProvider>
      <HashRouter>
        <div className="min-h-screen bg-slate-950 text-white">
          <Navbar />
          <main>
            <Routes>
              {/* Default → Create Deal */}
              <Route path="/" element={<Navigate to="/create" replace />} />
              <Route path="/create" element={<CreateDeal />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/summary" element={<Summary />} />
              {/* One-time admin seed route – remove before production */}
              <Route path="/seed" element={<SeedData />} />
              {/* 404 fallback */}
              <Route path="*" element={<Navigate to="/create" replace />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </DealProvider>
  )
}
