import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { Home } from './pages/Home'
import { Room } from './pages/Room'

/** Route table: home, session rooms, and a catch-all back to home. */
export function App() {
  return (
    <ToastProvider>
      {/* BASE_URL carries the trailing slash; react-router trims it. */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/s/:sessionId" element={<Room />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
