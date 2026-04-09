import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from './dashboard/AdminDashboard';
import ManagerDashboard from './dashboard/ManagerDashboard';
import SrOperatorDashboard from './dashboard/SrOperatorDashboard';
import OperatorDashboard from './dashboard/OperatorDashboard';
import StaffDashboard from './dashboard/StaffDashboard';

export default function DashboardPage() {
  const { currentUser } = useAuth();

  switch (currentUser?.role) {
    case 'super_admin':
      return <AdminDashboard />;
    case 'ops_manager':
      return <ManagerDashboard />;
    case 'sr_operator':
      return <SrOperatorDashboard />;
    case 'operator':
      return <OperatorDashboard />;
    case 'staff':
      return <StaffDashboard />;
    default:
      return <Navigate to="/login" />;
  }
}
