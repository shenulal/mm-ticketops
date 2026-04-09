import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface Props { children: React.ReactNode; }

export default function ProtectedRoute({ children }: Props) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Staff can only access staff-queue and dashboard
  if (currentUser.role === 'staff') {
    const allowed = ['/staff-queue', '/dashboard'];
    if (!allowed.some(p => location.pathname.startsWith(p))) {
      return <Navigate to="/staff-queue" replace />;
    }
  }

  // Client can only access client portal
  if (currentUser.role === 'client') {
    if (!location.pathname.startsWith('/client-portal')) {
      return <Navigate to="/client-portal/demo-token-123" replace />;
    }
  }

  return <>{children}</>;
}
