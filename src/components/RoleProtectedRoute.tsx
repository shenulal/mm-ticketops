import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface Props {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RoleProtectedRoute({ allowedRoles, children, redirectTo = '/dashboard' }: Props) {
  const { currentUser } = useAuth();
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
