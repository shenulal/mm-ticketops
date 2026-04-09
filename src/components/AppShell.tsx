import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEvent } from '@/context/EventContext';
import RoleGuard from '@/components/RoleGuard';
import NotificationBell from '@/components/NotificationBell';
import EventSwitcherModal from '@/components/EventSwitcherModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, ShoppingCart, TrendingUp,
  GitBranch, Users, BarChart3, UserCog, Settings,
  ChevronDown, LogOut, Menu, X
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Events', icon: Calendar, path: '/events' },
  { label: 'Purchases', icon: ShoppingCart, path: '/purchases' },
  { label: 'Sales', icon: TrendingUp, path: '/sales' },
  { label: 'Distribution', icon: GitBranch, path: '/distribution' },
  { label: 'Staff Queue', icon: Users, path: '/staff-queue' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
];

const ADMIN_ITEMS = [
  { label: 'Users', icon: UserCog, path: '/users' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/events': 'Events',
  '/purchases': 'Purchases',
  '/sales': 'Sales',
  '/distribution': 'Distribution',
  '/staff-queue': 'Staff Queue',
  '/reports': 'Reports',
  '/users': 'Users',
  '/settings': 'Settings',
};

export default function AppShell() {
  const { currentUser, logout } = useAuth();
  const { activeEvent } = useEvent();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] || 'TicketOps';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm font-body rounded-md transition-colors ${
      isActive
        ? 'text-gold bg-[rgba(255,255,255,0.08)] border-l-[3px] border-gold pl-[13px]'
        : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-[rgba(255,255,255,0.05)]'
    }`;

  const shortEventName = activeEvent.code === 'FIFA-WC-2026' ? 'FIFA WC 2026' : 'F1 SGP 2026';

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-navy font-display text-lg font-bold">T</div>
        <span className="font-display text-xl text-sidebar-foreground">TicketOps</span>
      </div>

      <div className="px-4 mb-4">
        <button
          onClick={() => setEventModalOpen(true)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-gold/20 text-gold text-sm font-body hover:bg-gold/30 transition-colors"
        >
          <span className="truncate">{shortEventName}</span>
          <ChevronDown size={14} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => navLinkClass(isActive)}>
            <item.icon size={18} /><span>{item.label}</span>
          </NavLink>
        ))}
        <RoleGuard roles={['super_admin']}>
          <div className="my-3 mx-2 border-t border-sidebar-border" />
          {ADMIN_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => navLinkClass(isActive)}>
              <item.icon size={18} /><span>{item.label}</span>
            </NavLink>
          ))}
        </RoleGuard>
      </nav>

      {currentUser && (
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/30 flex items-center justify-center text-gold text-xs font-bold font-mono">
              {currentUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sidebar-foreground truncate">{currentUser.name}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{currentUser.role.replace('_', ' ')}</p>
            </div>
            <button onClick={handleLogout} className="text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex w-[260px] flex-col bg-navy shrink-0">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-[260px] h-full flex flex-col bg-navy"
            >
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-sidebar-foreground">
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-foreground">
              <Menu size={22} />
            </button>
            <h1 className="font-display text-[22px] text-navy">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-body font-medium">
              {activeEvent.status}
            </span>
            <NotificationBell />
            {currentUser && (
              <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-primary-foreground text-xs font-mono font-bold">
                {currentUser.initials}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {eventModalOpen && <EventSwitcherModal onClose={() => setEventModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
