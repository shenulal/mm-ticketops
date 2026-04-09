import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Settings, LogOut, Package, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { to: '/supplier', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/supplier/settings', label: 'Settings', icon: Settings, end: false },
];

export default function SupplierLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser || currentUser.role !== 'supplier') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="font-heading text-[20px] text-foreground">Access Denied</p>
          <p className="font-body text-[13px] text-muted-foreground">This portal is for supplier accounts only.</p>
          <button onClick={() => navigate('/login')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[hsl(var(--primary))] text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="sm:hidden p-1 rounded hover:bg-white/10">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Package size={22} className="text-accent" />
            <div>
              <span className="font-heading text-[16px]">Supplier Portal</span>
              <span className="text-[11px] font-body opacity-70 ml-2 hidden sm:inline">TicketOps by MIRRA</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-body font-medium">{currentUser.name}</p>
              <p className="text-[10px] font-body opacity-70">{currentUser.vendorGroups?.join(', ').toUpperCase() ?? 'Supplier'}</p>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        {/* Desktop nav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden sm:flex gap-1 pb-1">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-body transition-colors ${isActive ? 'bg-white/15 font-medium' : 'hover:bg-white/10 opacity-80'}`}>
              <n.icon size={15} />{n.label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 sm:hidden" onClick={() => setMobileOpen(false)}>
          <div className="w-64 bg-card h-full shadow-xl p-4 space-y-2" onClick={e => e.stopPropagation()}>
            <p className="font-heading text-[14px] text-foreground mb-4">Navigation</p>
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-body ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}>
                <n.icon size={15} />{n.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-[11px] font-body text-muted-foreground">
          <span>Supplier Portal — Powered by TicketOps</span>
          <span>© {new Date().getFullYear()} MIRRA</span>
        </div>
      </footer>
    </div>
  );
}
