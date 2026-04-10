import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle, Clock, Send, Eye, ShieldAlert, KeyRound,
  ChevronRight, CheckCircle, Zap, ShieldOff, PauseCircle,
} from 'lucide-react';
import {
  MOCK_SALE_LINE_ITEMS, MOCK_DIST_ROWS, MOCK_STAFF_TASKS, MOCK_SALES,
  getDispatchUrgency, getPortalFunnel,
} from '@/data/mockData';
import { MOCK_ALLOCATION_RUNS, MOCK_RUN_ITEMS } from '@/data/allocationData';
import { CHART_COLORS } from './chartHelpers';
import type { UserRole } from '@/data/mockData';

interface ActionItem {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  count: number;
  severity: 'critical' | 'warning' | 'info';
  cta: string;
  route: string;
  roles: UserRole[];
}

function getActionItems(): ActionItem[] {
  const oversells = MOCK_SALE_LINE_ITEMS.filter(l => l.oversellFlag);
  const unalloc72h = MOCK_SALE_LINE_ITEMS.filter(l => l.status === 'UNALLOCATED');
  const dispatch = getDispatchUrgency('m01');
  const portalFunnel = getPortalFunnel('sale001');
  const unopenedPortals = portalFunnel ? portalFunnel.total - portalFunnel.fullyFilled : 0;
  const supplierIssues = MOCK_STAFF_TASKS.filter(t => t.status === 'ISSUE');
  const credUpdated = 2; // mock: credentials updated in last 24h

  const items: ActionItem[] = [];

  if (oversells.length > 0) {
    items.push({
      id: 'oversells',
      icon: AlertTriangle,
      title: `${oversells.length} oversell${oversells.length > 1 ? 's' : ''} awaiting approval`,
      subtitle: oversells.map(l => {
        const sale = MOCK_SALES.find(s => s.id === l.saleId);
        return `${sale?.id.toUpperCase()} · ${l.categoryLabel}`;
      }).join(', '),
      count: oversells.length,
      severity: 'critical',
      cta: 'Review Oversells',
      route: '/sales',
      roles: ['super_admin', 'ops_manager', 'sr_operator'],
    });
  }

  if (unalloc72h.length > 0) {
    items.push({
      id: 'unalloc',
      icon: Clock,
      title: `${unalloc72h.length} sale${unalloc72h.length > 1 ? 's' : ''} unallocated >72 hours`,
      subtitle: `${unalloc72h.reduce((s, l) => s + l.qty, 0)} tickets across ${new Set(unalloc72h.map(l => l.saleId)).size} sales`,
      count: unalloc72h.length,
      severity: 'warning',
      cta: 'Open Allocation Preview',
      route: '/distribution',
      roles: ['super_admin', 'ops_manager', 'sr_operator', 'operator'],
    });
  }

  if (dispatch.pending > 0 && dispatch.daysToEvent <= 65) {
    items.push({
      id: 'unsent',
      icon: Send,
      title: `${dispatch.pending} ticket${dispatch.pending > 1 ? 's' : ''} unsent — ${dispatch.daysToEvent}d to event`,
      subtitle: `M01 MEX v RSA · ${dispatch.daysToEvent} days remaining`,
      count: dispatch.pending,
      severity: dispatch.daysToEvent <= 14 ? 'critical' : 'warning',
      cta: 'Open Staff Queue',
      route: '/staff-queue',
      roles: ['super_admin', 'ops_manager', 'sr_operator', 'operator', 'staff'],
    });
  }

  if (unopenedPortals > 0) {
    items.push({
      id: 'portals',
      icon: Eye,
      title: `${unopenedPortals} portal${unopenedPortals > 1 ? 's' : ''} generated but incomplete`,
      subtitle: `${portalFunnel?.completionPct ?? 0}% completion · Meridian Travel SALE-001`,
      count: unopenedPortals,
      severity: 'info',
      cta: 'Send Reminder',
      route: '/client-portal',
      roles: ['super_admin', 'ops_manager'],
    });
  }

  if (supplierIssues.length > 0) {
    items.push({
      id: 'supplier-issues',
      icon: ShieldAlert,
      title: `${supplierIssues.length} supplier${supplierIssues.length > 1 ? 's' : ''} flagged ISSUE`,
      subtitle: supplierIssues.map(t => `${t.unitId} · ${t.vendor}`).join(', '),
      count: supplierIssues.length,
      severity: 'critical',
      cta: 'Open Supplier Portal',
      route: '/supplier-portals',
      roles: ['super_admin', 'ops_manager', 'sr_operator'],
    });
  }

  if (credUpdated > 0) {
    items.push({
      id: 'credentials',
      icon: KeyRound,
      title: `${credUpdated} credential${credUpdated > 1 ? 's' : ''} updated in last 24h`,
      subtitle: 'TicketVault · SeatWave — verify before dispatch',
      count: credUpdated,
      severity: 'info',
      cta: 'Open Vault',
      route: '/vendor-credentials',
      roles: ['super_admin', 'ops_manager', 'sr_operator'],
    });
  }

  // Auto-allocation cards
  const todayRuns = MOCK_ALLOCATION_RUNS.filter(r => r.status === 'COMPLETED' && !r.dryRun);
  const autoCommitted = todayRuns.reduce((s, r) => s + r.summary.committed, 0);
  const autoMarginDelta = todayRuns.reduce((s, r) => s + r.summary.marginDelta, 0);
  const blockedByPolicy = MOCK_RUN_ITEMS.filter(ri => ri.status === 'BLOCKED_BY_POLICY');

  if (autoCommitted > 0) {
    items.push({
      id: 'auto-committed',
      icon: Zap,
      title: `${autoCommitted} sale${autoCommitted > 1 ? 's' : ''} auto-allocated today — AED ${autoMarginDelta.toLocaleString()} margin`,
      subtitle: `${todayRuns.length} run${todayRuns.length > 1 ? 's' : ''} completed`,
      count: autoCommitted,
      severity: 'info',
      cta: 'View Runs',
      route: '/distribution/auto-allocate',
      roles: ['super_admin', 'ops_manager', 'sr_operator', 'operator'],
    });
  }

  if (blockedByPolicy.length > 0) {
    items.push({
      id: 'blocked-policy',
      icon: ShieldOff,
      title: `${blockedByPolicy.length} sale${blockedByPolicy.length > 1 ? 's' : ''} blocked by policy`,
      subtitle: blockedByPolicy.map(ri => ri.reason.split(';')[0]).slice(0, 2).join(', '),
      count: blockedByPolicy.length,
      severity: 'warning',
      cta: 'Review Blocked',
      route: '/distribution/auto-allocate',
      roles: ['super_admin', 'ops_manager', 'sr_operator'],
    });
  }

  return items;
}

const SEVERITY_STYLES = {
  critical: {
    border: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.06)',
    iconColor: '#DC2626',
    btnBg: '#DC2626',
  },
  warning: {
    border: CHART_COLORS.amber,
    bg: 'rgba(217, 119, 6, 0.06)',
    iconColor: CHART_COLORS.amber,
    btnBg: CHART_COLORS.amber,
  },
  info: {
    border: CHART_COLORS.blue,
    bg: 'rgba(26, 92, 168, 0.06)',
    iconColor: CHART_COLORS.blue,
    btnBg: CHART_COLORS.blue,
  },
};

export default function ActionCenter() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const role = currentUser?.role ?? 'operator';

  const allItems = getActionItems();
  const items = allItems.filter(item => item.roles.includes(role));

  if (items.length === 0) {
    return (
      <div className="mx-6 mt-6">
        <h2 className="font-display text-[18px] mb-3" style={{ color: CHART_COLORS.navy }}>Action Center</h2>
        <div className="rounded-xl p-4 bg-success/10 border border-success/30 flex items-center gap-3">
          <CheckCircle size={20} style={{ color: CHART_COLORS.green }} />
          <p className="font-body text-sm font-medium text-foreground">All clear — no actions required right now</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-6 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display text-[18px]" style={{ color: CHART_COLORS.navy }}>Action Center</h2>
        <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-body text-[11px] font-bold">
          {items.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => {
          const s = SEVERITY_STYLES[item.severity];
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-xl p-4 flex flex-col gap-2 transition-shadow hover:shadow-md"
              style={{ borderLeft: `4px solid ${s.border}`, backgroundColor: s.bg }}
            >
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.border}15` }}>
                  <Icon size={16} style={{ color: s.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-bold text-foreground leading-tight">{item.title}</p>
                  <p className="font-body text-[11px] text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(item.route)}
                className="self-start mt-1 px-3 py-1.5 rounded-lg font-body text-[11px] font-medium text-white hover:opacity-90 flex items-center gap-1 transition-opacity"
                style={{ backgroundColor: s.btnBg }}
              >
                {item.cta}
                <ChevronRight size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
