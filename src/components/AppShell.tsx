import { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink as RRNavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEvent } from '@/context/EventContext';
import NotificationBell from '@/components/NotificationBell';
import CommandPalette from '@/components/CommandPalette';
import EventSwitcherModal from '@/components/EventSwitcherModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MOCK_SALE_LINE_ITEMS, MOCK_DIST_ROWS,
} from '@/data/mockData';
import {
  LayoutDashboard, Calendar, ShoppingCart, PlusCircle, TrendingUp,
  GitBranch, Users, ExternalLink, BarChart3, Truck, Building2,
  FileText, MapPin, DollarSign, UserCog, Bell, Settings, Key,
  ChevronDown, ChevronRight, LogOut, Menu, X, Shield, ClipboardCheck,
  Search, Zap, Sliders,
  type LucideIcon,
} from 'lucide-react';

// ─── Icon map ──────────────────────────────────────────
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Calendar, ShoppingCart, PlusCircle, TrendingUp,
  GitBranch, Users, ExternalLink, BarChart3, Truck, Building2,
  FileText, MapPin, DollarSign, UserCog, Bell, Settings, Key,
  Shield, ClipboardCheck, Zap, Sliders,
};

// ─── Types ─────────────────────────────────────────────
interface NavItem {
  id: string; label: string; icon: string; path: string;
  roles: string[];
  badgeKey?: string;
  isChild?: boolean;
  hasSubItems?: boolean;
}
interface NavGroup {
  id: string; label: string | null;
  roles?: string[];
  collapsible?: boolean;
  defaultOpen?: boolean;
  items: NavItem[];
}

// ─── Navigation data ──────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    id: 'main', label: null,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'operator', 'staff'] },
      { id: 'events', label: 'Events', icon: 'Calendar', path: '/events',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'operator'] },
    ],
  },
  {
    id: 'purchasing', label: 'PURCHASING',
    roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'operator'],
    items: [
      { id: 'purchases', label: 'Purchases', icon: 'ShoppingCart', path: '/purchases',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'operator'],
        badgeKey: 'unallocatedPurchases' },
      { id: 'new-purchase', label: 'New Purchase', icon: 'PlusCircle', path: '/purchases/new',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'operator'],
        isChild: true },
    ],
  },
  {
    id: 'selling', label: 'SELLING',
    roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'operator'],
    items: [
      { id: 'sales', label: 'Sales', icon: 'TrendingUp', path: '/sales',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'operator'],
        badgeKey: 'pendingApprovals' },
      { id: 'new-sale', label: 'New Sale', icon: 'PlusCircle', path: '/sales/new',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'operator'],
        isChild: true },
    ],
  },
  {
    id: 'fulfilment', label: 'FULFILMENT',
    roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'staff'],
    items: [
      { id: 'distribution', label: 'Distribution', icon: 'GitBranch', path: '/distribution',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator'],
        badgeKey: 'unallocatedLines' },
      { id: 'staff-queue', label: 'Staff Queue', icon: 'Users', path: '/staff-queue',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'staff'],
        badgeKey: 'pendingDispatch' },
      { id: 'supplier', label: 'Supplier Portals', icon: 'ExternalLink', path: '/supplier-portals',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator'] },
    ],
  },
  {
    id: 'intelligence', label: 'INTELLIGENCE',
    roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator'],
    items: [
      { id: 'reports', label: 'Reports & Analytics', icon: 'BarChart3', path: '/reports',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator'] },
    ],
  },
  {
    id: 'masters', label: 'MASTER DATA',
    roles: ['super_admin', 'event_admin', 'ops_manager'],
    collapsible: true, defaultOpen: false,
    items: [
      { id: 'vendors', label: 'Vendors', icon: 'Truck', path: '/masters/vendors',
        roles: ['super_admin', 'event_admin', 'ops_manager'] },
      { id: 'clients', label: 'Clients', icon: 'Building2', path: '/masters/clients',
        roles: ['super_admin', 'event_admin', 'ops_manager'] },
      { id: 'contracts', label: 'Contracts', icon: 'FileText', path: '/masters/contracts',
        roles: ['super_admin', 'event_admin', 'ops_manager'] },
      { id: 'venues', label: 'Venues', icon: 'MapPin', path: '/masters/venues',
        roles: ['super_admin', 'event_admin', 'ops_manager'] },
      { id: 'currencies', label: 'Currencies', icon: 'DollarSign', path: '/masters/currencies',
        roles: ['super_admin', 'event_admin'] },
    ],
  },
  {
    id: 'administration', label: 'ADMINISTRATION',
    roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator'],
    collapsible: true, defaultOpen: false,
    items: [
      { id: 'users', label: 'Users & Roles', icon: 'UserCog', path: '/admin/users',
        roles: ['super_admin', 'event_admin'] },
      { id: 'notif-templates', label: 'Notification Templates', icon: 'Bell', path: '/admin/notifications',
        roles: ['super_admin', 'event_admin'] },
      { id: 'vendor-credentials', label: 'Vendor Credentials', icon: 'Key', path: '/admin/vendor-credentials',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator'] },
      { id: 'alloc-policies', label: 'Allocation Policies', icon: 'Zap', path: '/admin/allocation-policies',
        roles: ['super_admin', 'event_admin', 'ops_manager', 'sr_operator'] },
      { id: 'alloc-settings', label: 'Allocation Settings', icon: 'Sliders', path: '/admin/allocation-settings',
        roles: ['super_admin'] },
      { id: 'audit-log', label: 'Audit Log', icon: 'Shield', path: '/admin/audit-log',
        roles: ['super_admin'] },
      { id: 'reconciliation', label: 'Reconciliation', icon: 'ClipboardCheck', path: '/admin/reconciliation',
        roles: ['super_admin', 'ops_manager'] },
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings',
        roles: ['super_admin'] },
    ],
  },
];


const ROLE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  super_admin: { label: 'Super Admin', bg: 'rgba(254,226,226,0.25)', text: '#FCA5A5' },
  event_admin: { label: 'Event Admin', bg: 'rgba(254,226,226,0.25)', text: '#FCA5A5' },
  ops_manager: { label: 'Ops Manager', bg: 'rgba(196,181,253,0.25)', text: '#C4B5FD' },
  sr_operator: { label: 'Sr. Operator', bg: 'rgba(147,197,253,0.25)', text: '#93C5FD' },
  operator: { label: 'Operator', bg: 'rgba(110,231,183,0.25)', text: '#6EE7B7' },
  staff: { label: 'Staff', bg: 'rgba(253,230,138,0.25)', text: '#FDE68A' },
  client: { label: 'Client', bg: 'rgba(209,213,219,0.25)', text: '#D1D5DB' },
};

// ─── Page titles ──────────────────────────────────────
function getPageTitle(pathname: string): string {
  for (const g of NAV_GROUPS) {
    for (const item of g.items) {
      if (item.hasSubItems && pathname.startsWith(item.path)) return item.label;
      if (pathname === item.path) return item.label;
    }
  }
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/events/')) return 'Event Detail';
  if (pathname.startsWith('/distribution/')) return 'Distribution';
  if (pathname.startsWith('/staff-queue/')) return 'Task Detail';
  return 'TicketOps';
  return 'TicketOps';
}

// ─── Collapsed groups persistence ─────────────────────
function loadCollapsed(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem('nav_collapsed_groups') || '{}'); }
  catch { return {}; }
}
function saveCollapsed(c: Record<string, boolean>) {
  localStorage.setItem('nav_collapsed_groups', JSON.stringify(c));
}

// ─── Component ────────────────────────────────────────
export default function AppShell() {
  const { currentUser, logout } = useAuth();
  const { activeEvent } = useEvent();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Collapsed state for collapsible groups
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const saved = loadCollapsed();
    const defaults: Record<string, boolean> = {};
    NAV_GROUPS.filter(g => g.collapsible).forEach(g => {
      defaults[g.id] = saved[g.id] ?? !(g.defaultOpen ?? false);
    });
    return defaults;
  });

  const toggleGroup = (id: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [id]: !prev[id] };
      saveCollapsed(next);
      return next;
    });
  };

  // Auto-expand group containing active route
  useEffect(() => {
    NAV_GROUPS.forEach(g => {
      if (g.collapsible && g.items.some(i => location.pathname.startsWith(i.path))) {
        setCollapsed(prev => {
          if (prev[g.id]) {
            const next = { ...prev, [g.id]: false };
            saveCollapsed(next);
            return next;
          }
          return prev;
        });
      }
    });
  }, [location.pathname]);

  // Badge counts
  const navBadges = useMemo(() => ({
    pendingApprovals: MOCK_SALE_LINE_ITEMS.filter(l => l.status === 'PENDING_APPROVAL').length,
    unallocatedLines: MOCK_SALE_LINE_ITEMS.filter(l => l.status === 'UNALLOCATED').length,
    pendingDispatch: MOCK_DIST_ROWS.filter(r => r.dispatchStatus === 'NOT_SENT').length,
    unallocatedPurchases: 0,
  }), []);

  const role = currentUser?.role ?? '';
  const pageTitle = getPageTitle(location.pathname);
  

  const isItemActive = (path: string) => {
    if (path === '/settings') return location.pathname.startsWith('/settings');
    return location.pathname === path;
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // ── Render helpers ──
  const renderItem = (item: NavItem) => {
    const Icon = ICONS[item.icon];
    const active = isItemActive(item.path);
    const badge = item.badgeKey ? (navBadges as Record<string, number>)[item.badgeKey] : 0;

    return (
      <RRNavLink
        key={item.id}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 h-10 rounded-xl cursor-pointer transition-colors ${
          item.isChild ? 'pl-10 h-9 text-[13px]' : 'px-3 text-[14px]'
        } ${
          active
            ? 'bg-[rgba(255,255,255,0.1)] border-l-[3px] border-gold text-white font-medium'
            : 'text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.05)]'
        }`}
        style={!item.isChild ? {} : undefined}
      >
        {Icon && <Icon size={item.isChild ? 16 : 18} className={active ? 'text-white' : 'text-[rgba(255,255,255,0.6)]'} />}
        <span className="flex-1 truncate font-body">{item.label}</span>
        {badge > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-white text-[11px] font-medium font-body">
            {badge}
          </span>
        )}
      </RRNavLink>
    );
  };


  const renderGroup = (group: NavGroup) => {
    // Role-gate group
    if (group.roles && !group.roles.includes(role)) return null;
    // Filter items by role
    const visibleItems = group.items.filter(i => i.roles.includes(role));
    if (visibleItems.length === 0) return null;

    const isCollapsed = group.collapsible ? (collapsed[group.id] ?? true) : false;

    return (
      <div key={group.id} className={group.label ? 'mt-4' : ''}>
        {group.label && (
          group.collapsible ? (
            <button
              onClick={() => toggleGroup(group.id)}
              className="flex items-center justify-between w-full px-3 py-1 mb-1"
            >
              <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)] tracking-widest uppercase font-body">
                {group.label}
              </span>
              {isCollapsed
                ? <ChevronRight size={12} className="text-[rgba(255,255,255,0.3)]" />
                : <ChevronDown size={12} className="text-[rgba(255,255,255,0.3)]" />}
            </button>
          ) : (
            <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)] tracking-widest uppercase font-body px-3 py-1 mb-1">
              {group.label}
            </p>
          )
        )}
        <div
          className="overflow-hidden transition-all duration-200"
          style={group.collapsible ? { maxHeight: isCollapsed ? 0 : `${visibleItems.length * 48}px` } : undefined}
        >
          <div className="space-y-0.5">
            {visibleItems.map(item => (
              <div key={item.id}>
                {renderItem(item)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const roleBadge = ROLE_BADGES[role];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center font-display text-lg text-navy font-bold">T</div>
        <span className="font-display text-xl text-white">TicketOps</span>
      </div>

      {/* Event pill */}
      <div className="px-4 mb-3">
        <button
          onClick={() => setEventModalOpen(true)}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-gold/40 bg-[rgba(201,168,76,0.08)] text-gold text-[13px] font-body hover:bg-[rgba(201,168,76,0.15)] transition-colors"
        >
          <span className="truncate">{activeEvent?.name ?? 'Select Event'}</span>
          <ChevronDown size={14} className="shrink-0 ml-2 opacity-70" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {NAV_GROUPS.map(renderGroup)}
      </nav>

      {/* User section */}
      {currentUser && (
        <div className="px-4 py-4 border-t border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.15)] flex items-center justify-center text-white text-[14px] font-bold font-body">
              {currentUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white truncate font-body">{currentUser.name}</p>
              {roleBadge && (
                <span
                  className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-body"
                  style={{ backgroundColor: roleBadge.bg, color: roleBadge.text }}
                >
                  {roleBadge.label}
                </span>
              )}
            </div>
            <button onClick={handleLogout} className="text-[rgba(255,255,255,0.5)] hover:text-white transition-colors">
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
      <aside className="hidden md:flex w-[260px] flex-col bg-navy shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-[260px] h-full flex flex-col bg-navy"
            >
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white">
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-foreground">
              <Menu size={22} />
            </button>
            <h1 className="font-display text-[22px] text-primary">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Search box */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors min-w-[200px]"
            >
              <Search size={14} />
              <span className="font-body text-xs flex-1 text-left">Search…</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘K</kbd>
            </button>
            <button onClick={() => setPaletteOpen(true)} className="sm:hidden text-muted-foreground">
              <Search size={20} />
            </button>
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-body font-medium">
              {activeEvent?.status}
            </span>
            <NotificationBell />
            {currentUser && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-mono font-bold">
                {currentUser.initials}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <AnimatePresence>
        {eventModalOpen && <EventSwitcherModal onClose={() => setEventModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
