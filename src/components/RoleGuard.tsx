import { useAuth } from '@/context/AuthContext';

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children }) => {
  const { currentUser } = useAuth();
  if (!currentUser || !roles.includes(currentUser.role)) return null;
  return <>{children}</>;
};

export default RoleGuard;
