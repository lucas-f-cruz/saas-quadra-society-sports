import { Navigate } from 'react-router-dom';
import { useMasterAuth } from '../context/MasterAuthContext';

export function MasterProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin } = useMasterAuth();
  const temToken = !!localStorage.getItem('proflow_master_token');

  if (!admin || !temToken) {
    return <Navigate to="/master/login" replace />;
  }

  return <>{children}</>;
}
