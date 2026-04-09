import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/AppContext';
import { useEvent } from '@/context/EventContext';
import {
  MOCK_PURCHASES, MOCK_SALES, MOCK_UNITS, MOCK_STAFF_TASKS, MOCK_USERS,
} from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, TrendingUp, Package, Users, Truck, Building2,
  Calendar, Zap, LayoutDashboard, PlusCircle, GitBranch, ArrowRight,
  DollarSign, Clock, Command, CornerDownLeft,
} from 'lucide-react';

/* ── Types ── */
interface SearchResult {
  id: string;
  group: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  path: string;
  monospaceTitle?: boolean;
}

interface ActionResult {
  id: string;
  group: 'Actions';
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action: () => void;
}

type Result = SearchResult | ActionResult;

const MAX_PER_GROUP = 8;

/* ── Role helpers ── */
const ELEVATED_ROLES = ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'operator'];
const ADMIN_ROLES = ['super_admin', 'event_admin'];

/* ── Recent searches storage ── */
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem('cmd_recent') || '[]').slice(0, 10); }
  catch { return []; }
}
function addRecent(q: string) {
  if (!q.trim()) return;
  const prev = getRecent().filter(r => r !== q);
  localStorage.setItem('cmd_recent', JSON.stringify([q, ...prev].slice(0, 10)));
}

/* ── Component ── */
export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const ctx = useAppContext();
  const { activeEvent, setActiveEvent } = useEvent();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const role = currentUser?.role ?? '';

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced query
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const q = debouncedQ.toLowerCase().trim();

  /* ── Build results ── */
  const results = useMemo<Result[]>(() => {
    const out: Result[] = [];

    // Actions (always show when no query or query matches)
    const actions: ActionResult[] = [
      { id: 'act-new-purchase', group: 'Actions', icon: <PlusCircle size={16} />, title: 'New Purchase', subtitle: 'Create a new purchase order', action: () => navigate('/purchases/new') },
      { id: 'act-new-sale', group: 'Actions', icon: <PlusCircle size={16} />, title: 'New Sale', subtitle: 'Create a new sale', action: () => navigate('/sales/new') },
      { id: 'act-dashboard', group: 'Actions', icon: <LayoutDashboard size={16} />, title: 'Go to Dashboard', subtitle: 'Main dashboard view', action: () => navigate('/dashboard') },
      { id: 'act-alloc-preview', group: 'Actions', icon: <GitBranch size={16} />, title: 'Run Allocation Preview', subtitle: 'Open distribution view', action: () => navigate('/distribution') },
    ];

    // Event switching
    ctx.events.forEach(evt => {
      if (evt.id !== activeEvent?.id) {
        actions.push({
          id: `act-switch-${evt.id}`, group: 'Actions', icon: <Calendar size={16} />,
          title: `Switch event to ${evt.name}`, subtitle: evt.code,
          action: () => { setActiveEvent(evt); },
        });
      }
    });

    // Currency toggle
    actions.push({
      id: 'act-toggle-currency', group: 'Actions', icon: <DollarSign size={16} />,
      title: 'Toggle currency USD/AED', subtitle: 'Switch display currency',
      action: () => { /* placeholder */ },
    });

    if (!q) {
      // Show recent searches as hints + actions
      out.push(...actions.slice(0, MAX_PER_GROUP));
      return out;
    }

    // ── Sales ──
    if (role !== 'staff') {
      const salesResults: SearchResult[] = [];
      for (const sale of MOCK_SALES) {
        const clientMatch = role === 'client' && currentUser
          ? sale.client.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[1] || '')
          : true;
        if (!clientMatch && role === 'client') continue;

        const searchable = `${sale.id} ${sale.client} ${sale.contract} ${sale.notes}`.toLowerCase();
        if (searchable.includes(q)) {
          salesResults.push({
            id: `sale-${sale.id}`, group: 'Sales', icon: <TrendingUp size={16} />,
            title: sale.id.toUpperCase(), subtitle: `${sale.client} · ${sale.contract}`,
            path: '/sales', monospaceTitle: true,
          });
        }
        if (salesResults.length >= MAX_PER_GROUP) break;
      }
      out.push(...salesResults);
    }

    // ── Purchases ──
    if (ELEVATED_ROLES.includes(role)) {
      const purResults: SearchResult[] = [];
      for (const pur of MOCK_PURCHASES) {
        const searchable = `${pur.id} ${pur.vendor} ${pur.contract}`.toLowerCase();
        if (searchable.includes(q)) {
          purResults.push({
            id: `pur-${pur.id}`, group: 'Purchases', icon: <ShoppingCart size={16} />,
            title: pur.id.toUpperCase(), subtitle: `${pur.vendor} · ${pur.contract}`,
            path: '/purchases', monospaceTitle: true,
          });
        }
        if (purResults.length >= MAX_PER_GROUP) break;
      }
      out.push(...purResults);
    }

    // ── Units ──
    if (ELEVATED_ROLES.includes(role)) {
      const unitResults: SearchResult[] = [];
      for (const unit of MOCK_UNITS) {
        const searchable = `${unit.id} ${unit.setId}`.toLowerCase();
        if (searchable.includes(q)) {
          unitResults.push({
            id: `unit-${unit.id}`, group: 'Units', icon: <Package size={16} />,
            title: unit.id, subtitle: `Set ${unit.setId} · Pos ${unit.setPos} · ${unit.categoryLabel}`,
            path: '/purchases', monospaceTitle: true,
          });
        }
        if (unitResults.length >= MAX_PER_GROUP) break;
      }
      out.push(...unitResults);
    }

    // ── Tasks ──
    if (role === 'staff' || ELEVATED_ROLES.includes(role)) {
      const taskResults: SearchResult[] = [];
      const tasks = role === 'staff'
        ? MOCK_STAFF_TASKS.filter(t => t.assignedTo === currentUser?.id)
        : MOCK_STAFF_TASKS;
      for (const task of tasks) {
        const searchable = `${task.id} ${task.invNo} ${task.unitId} ${task.matchLabel} ${task.clientFirstName} ${task.clientLastName}`.toLowerCase();
        if (searchable.includes(q)) {
          taskResults.push({
            id: `task-${task.id}`, group: 'Tasks', icon: <Clock size={16} />,
            title: task.id.toUpperCase(), subtitle: `${task.matchLabel} · ${task.category} · ${task.status}`,
            path: `/staff-queue/${task.id}`, monospaceTitle: true,
          });
        }
        if (taskResults.length >= MAX_PER_GROUP) break;
      }
      out.push(...taskResults);
    }

    // ── Clients ──
    if (ELEVATED_ROLES.includes(role)) {
      const clientResults: SearchResult[] = [];
      for (const client of ctx.clients) {
        const searchable = `${client.companyName} ${client.code} ${client.email}`.toLowerCase();
        if (searchable.includes(q)) {
          clientResults.push({
            id: `client-${client.id}`, group: 'Clients', icon: <Building2 size={16} />,
            title: client.companyName, subtitle: `${client.code} · ${client.email}`,
            path: '/masters/clients',
          });
        }
        if (clientResults.length >= MAX_PER_GROUP) break;
      }
      out.push(...clientResults);
    }

    // ── Vendors ──
    if (ELEVATED_ROLES.includes(role)) {
      const vendorResults: SearchResult[] = [];
      for (const vendor of ctx.vendors) {
        const searchable = `${vendor.name} ${vendor.code} ${vendor.country} ${vendor.primaryContactEmail}`.toLowerCase();
        if (searchable.includes(q)) {
          vendorResults.push({
            id: `vendor-${vendor.id}`, group: 'Vendors', icon: <Truck size={16} />,
            title: vendor.name, subtitle: `${vendor.code} · ${vendor.country}`,
            path: '/masters/vendors',
          });
        }
        if (vendorResults.length >= MAX_PER_GROUP) break;
      }
      out.push(...vendorResults);
    }

    // ── Events ──
    {
      const eventResults: SearchResult[] = [];
      for (const evt of ctx.events) {
        const searchable = `${evt.code} ${evt.name}`.toLowerCase();
        if (searchable.includes(q)) {
          eventResults.push({
            id: `event-${evt.id}`, group: 'Events', icon: <Calendar size={16} />,
            title: evt.name, subtitle: `${evt.code} · ${evt.status}`,
            path: `/events/${evt.id}`,
          });
        }
        if (eventResults.length >= MAX_PER_GROUP) break;
      }
      out.push(...eventResults);
    }

    // ── Users (admin only) ──
    if (ADMIN_ROLES.includes(role)) {
      const userResults: SearchResult[] = [];
      for (const user of MOCK_USERS) {
        const searchable = `${user.name} ${user.email} ${user.role}`.toLowerCase();
        if (searchable.includes(q)) {
          userResults.push({
            id: `user-${user.id}`, group: 'Users', icon: <Users size={16} />,
            title: user.name, subtitle: `${user.role} · ${user.email}`,
            path: '/admin/users',
          });
        }
        if (userResults.length >= MAX_PER_GROUP) break;
      }
      out.push(...userResults);
    }

    // ── Filtered actions ──
    const matchedActions = actions.filter(a =>
      `${a.title} ${a.subtitle}`.toLowerCase().includes(q)
    ).slice(0, MAX_PER_GROUP);
    out.push(...matchedActions);

    return out;
  }, [q, role, currentUser, ctx.clients, ctx.vendors, ctx.events, activeEvent, navigate, setActiveEvent]);

  // Flat list for keyboard nav
  const flatResults = results;
  const totalCount = flatResults.length;

  // Grouped for display
  const grouped = useMemo(() => {
    const groups: Record<string, Result[]> = {};
    for (const r of flatResults) {
      if (!groups[r.group]) groups[r.group] = [];
      groups[r.group].push(r);
    }
    return groups;
  }, [flatResults]);

  // Keyboard nav
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, totalCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatResults[selectedIdx];
      if (selected) {
        addRecent(query);
        if ('action' in selected) {
          selected.action();
        } else {
          if (e.metaKey || e.ctrlKey) {
            window.open(selected.path, '_blank');
          } else {
            navigate(selected.path);
          }
        }
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [selectedIdx, totalCount, flatResults, query, navigate, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  if (!open) return null;

  let globalIdx = -1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        />
        <div className="flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[560px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search sales, purchases, clients, or type a command…"
                className="flex-1 bg-transparent outline-none font-body text-sm text-foreground placeholder:text-muted-foreground"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
              {totalCount === 0 && q && (
                <p className="text-center text-sm text-muted-foreground font-body py-8">
                  No results for "<span className="text-foreground">{query}</span>"
                </p>
              )}

              {!q && totalCount === 0 && (
                <p className="text-center text-sm text-muted-foreground font-body py-8">
                  Start typing to search…
                </p>
              )}

              {Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground tracking-widest uppercase font-body">
                    {group}
                  </p>
                  {items.map(item => {
                    globalIdx++;
                    const idx = globalIdx;
                    const isSelected = idx === selectedIdx;
                    const isAction = 'action' in item;

                    return (
                      <button
                        key={item.id}
                        data-idx={idx}
                        onClick={() => {
                          addRecent(query);
                          if (isAction) {
                            (item as ActionResult).action();
                          } else {
                            navigate((item as SearchResult).path);
                          }
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className={`shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`block truncate text-sm ${
                            isSelected ? 'text-foreground font-medium' : 'text-foreground'
                          } ${(!isAction && (item as SearchResult).monospaceTitle) ? 'font-mono' : 'font-body'}`}>
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground font-body">
                            {item.subtitle}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="shrink-0 flex items-center gap-1">
                            {isAction ? (
                              <Zap size={12} className="text-gold" />
                            ) : (
                              <ArrowRight size={12} className="text-primary" />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-body">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-muted font-mono">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-muted font-mono">↵</kbd> open
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-muted font-mono">⌘↵</kbd> new tab
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-body">
                {totalCount} result{totalCount !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
