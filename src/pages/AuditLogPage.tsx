import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAuditLog, type AuditEntry } from '@/data/auditData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Download, ChevronDown, ChevronRight, Shield } from 'lucide-react';

const ENTITY_TYPES = ['all', 'purchase', 'sale', 'allocation', 'credential', 'dispatch', 'user', 'event', 'oversell'];
const ACTION_TYPES = [
  'all',
  'purchase.created', 'purchase.cancelled',
  'sale.created', 'sale.cancelled',
  'allocation.preview', 'allocation.commit',
  'credential.view', 'credential.create', 'credential.update', 'credential.deactivate',
  'oversell.resolved',
  'user.login', 'user.role_change',
  'dispatch.status_change', 'dispatch.proof_upload',
  'event.transition',
];

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-destructive/15 text-destructive',
  view: 'bg-blue-100 text-blue-700',
  commit: 'bg-primary/10 text-primary',
  preview: 'bg-muted text-muted-foreground',
  deactivate: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  login: 'bg-blue-100 text-blue-700',
  role_change: 'bg-amber-100 text-amber-700',
  status_change: 'bg-indigo-100 text-indigo-700',
  proof_upload: 'bg-emerald-100 text-emerald-700',
  transition: 'bg-accent/20 text-accent',
  update: 'bg-amber-100 text-amber-700',
  create: 'bg-emerald-100 text-emerald-700',
};

function getActionColor(action: string) {
  const suffix = action.split('.').pop() || '';
  return ACTION_COLORS[suffix] || 'bg-muted text-muted-foreground';
}

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function JsonDiff({ label, data }: { label: string; data: Record<string, any> | null }) {
  if (!data) return <span className="text-muted-foreground text-[11px]">—</span>;
  return (
    <div>
      <p className="font-body text-[10px] text-muted-foreground mb-1">{label}</p>
      <pre className="bg-muted rounded p-2 text-[11px] font-mono text-foreground overflow-x-auto max-h-48">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditLogPage() {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const log = useMemo(() => getAuditLog(), []);

  const actors = useMemo(() => [...new Set(log.map(e => e.actor))], [log]);

  const filtered = useMemo(() => log.filter(e => {
    if (entityFilter !== 'all' && e.entity !== entityFilter) return false;
    if (actionFilter !== 'all' && e.action !== actionFilter) return false;
    if (actorFilter && e.actor !== actorFilter) return false;
    if (dateFrom && e.when < dateFrom) return false;
    if (dateTo && e.when < dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.entityId.toLowerCase().includes(q) && !e.action.toLowerCase().includes(q) && !e.actor.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [log, entityFilter, actionFilter, actorFilter, dateFrom, dateTo, search]);

  const handleExport = () => {
    if (!isSuperAdmin) { toast.error('Only Super Admin can export'); return; }
    const header = 'When,Actor,Role,Entity,EntityID,Action,IP,Event\n';
    const rows = filtered.map(e =>
      `"${e.when}","${e.actor}","${e.actorRole}","${e.entity}","${e.entityId}","${e.action}","${e.ip}","${e.eventName || ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-primary" />
          <h1 className="font-display text-[26px] text-primary">Audit Log</h1>
          <Badge variant="secondary" className="font-mono text-xs">{filtered.length}</Badge>
        </div>
        {isSuperAdmin && (
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download size={14} /> Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entity ID…" className="pl-9" />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>{ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t === 'all' ? 'All Entities' : t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>{ACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t === 'all' ? 'All Actions' : t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={actorFilter} onValueChange={setActorFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Actor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Actors</SelectItem>
            {actors.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[150px]" placeholder="From" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[150px]" placeholder="To" />
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[13px] font-body">
          <thead>
            <tr className="bg-muted/50">
              <th className="w-8 px-2 py-2.5"></th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">When</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Actor</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Entity</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Entity ID</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Action</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">IP</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Event</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const expanded = expandedId === e.id;
              return (
                <tr key={e.id} className="border-t border-border hover:bg-muted/30 cursor-pointer group" onClick={() => setExpandedId(expanded ? null : e.id)}>
                  <td className="px-2 py-3 text-muted-foreground">
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap font-mono text-[11px]">{formatTs(e.when)}</td>
                  <td className="px-3 py-3">
                    <span className="text-foreground">{e.actor}</span>
                    <span className="ml-1.5 text-[10px] text-muted-foreground">({e.actorRole})</span>
                  </td>
                  <td className="px-3 py-3"><Badge variant="outline" className="text-[10px] font-mono">{e.entity}</Badge></td>
                  <td className="px-3 py-3 font-mono text-[11px]">{e.entityId}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getActionColor(e.action)}`}>{e.action}</span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">{e.ip}</td>
                  <td className="px-3 py-3 text-muted-foreground truncate max-w-[140px]">{e.eventName || '—'}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No audit entries match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Expanded detail (below table, keyed) */}
      {expandedId && (() => {
        const entry = filtered.find(e => e.id === expandedId);
        if (!entry) return null;
        return (
          <div className="mt-3 border border-border rounded-xl p-4 bg-card space-y-3">
            <p className="font-body text-sm font-medium text-foreground">{entry.action} — {entry.entityId}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <JsonDiff label="Before" data={entry.before} />
              <JsonDiff label="After" data={entry.after} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
