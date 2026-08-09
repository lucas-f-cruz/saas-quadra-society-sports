import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const temToken = !!localStorage.getItem('proflow_token');

  if (!usuario || !temToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
