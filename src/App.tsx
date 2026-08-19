/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

// Pages
import Index from '@/pages/Index'
import Login from '@/pages/Login'
import FranqueadosList from '@/pages/FranqueadosList'
import FranqueadoDetail from '@/pages/FranqueadoDetail'
import FranqueadoForm from '@/pages/FranqueadoForm'
import ContratoForm from '@/pages/ContratoForm'
import DocumentoEditor from '@/pages/DocumentoEditor'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes wrapped in Global Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/franqueados" element={<FranqueadosList />} />
            <Route path="/franqueados/novo" element={<FranqueadoForm />} />
            <Route path="/franqueados/:id" element={<FranqueadoDetail />} />
            <Route path="/franqueados/:id/editar" element={<FranqueadoForm />} />
            <Route path="/contratos/novo" element={<ContratoForm />} />
            <Route path="/documento/:contratoId" element={<DocumentoEditor />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
