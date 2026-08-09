import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MasterAuthProvider } from './context/MasterAuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MasterProtectedRoute } from './components/MasterProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { PublicBooking } from './pages/PublicBooking';
import { Dashboard } from './pages/Dashboard';
import { Quadras } from './pages/Quadras';
import { Reservas } from './pages/Reservas';
import { Configuracoes } from './pages/Configuracoes';
import { MasterLogin } from './pages/MasterLogin';
import { MasterDashboard } from './pages/MasterDashboard';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <MasterAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/agendar/:slug" element={<PublicBooking />} />

            <Route path="/master/login" element={<MasterLogin />} />
            <Route
              path="/master"
              element={
                <MasterProtectedRoute>
                  <MasterDashboard />
                </MasterProtectedRoute>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quadras"
              element={
                <ProtectedRoute>
                  <Quadras />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservas"
              element={
                <ProtectedRoute>
                  <Reservas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MasterAuthProvider>
    </AuthProvider>
  );
}
