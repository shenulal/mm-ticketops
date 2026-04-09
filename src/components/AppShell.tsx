import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import {
  LayoutDashboard, Calendar, ShoppingCart, TrendingUp,
  GitBranch, Users, BarChart3, UserCog, Settings,
  Bell, ChevronDown, LogOut, Menu, X
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
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] || 'TicketOps';

  const navLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm font-body rounded-md transition-colors ${
      isActive
        ? 'text-gold bg-[rgba(255,255,255,0.08)] border-l-[3px] border-gold pl-[13px]'
        : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-[rgba(255,255,255,0.05)]'
    }`;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-navy font-display text-lg font-bold">T</div>
        <span className="font-display text-xl text-sidebar-foreground">TicketOps</span>
      </div>

      {/* Event pill */}
      <div className="px-4 mb-4">
        <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-gold/20 text-gold text-sm font-body">
          <span className="truncate">FIFA WC 2026</span>
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <RoleGuard roles={['super_admin']}>
          <div className="my-3 mx-2 border-t border-sidebar-border" />
          {ADMIN_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </RoleGuard>
      </nav>

      {/* User */}
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
            <button onClick={logout} className="text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col bg-navy shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] h-full flex flex-col bg-navy">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-sidebar-foreground">
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-foreground">
              <Menu size={22} />
            </button>
            <h1 className="font-display text-[22px] text-navy">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-body font-medium">
              SELLING
            </span>
            <button className="relative text-text-muted hover:text-foreground">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full" />
            </button>
            {currentUser && (
              <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-primary-foreground text-xs font-mono font-bold">
                {currentUser.initials}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
