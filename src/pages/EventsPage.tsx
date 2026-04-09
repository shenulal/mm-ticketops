import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, type EventDef } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Search, Plus, ChevronRight, Trophy, Flag, Music, Briefcase, Globe, Star } from 'lucide-react';
import { toast } from 'sonner';
import RoleGuard from '@/components/RoleGuard';

const EVENT_TYPES: EventDef['eventType'][] = ['SPORTS_TOURNAMENT', 'RACING_SEASON', 'RACING_WEEKEND', 'CONCERT', 'CONFERENCE', 'EXPO', 'OTHER'];
const STATUS_LIST: EventDef['status'][] = ['DRAFT', 'PLANNING', 'BUYING', 'SELLING', 'ALLOCATING', 'DISPATCHING', 'CLOSED', 'ARCHIVED'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-muted', text: 'text-muted-foreground' },
  PLANNING: { bg: 'bg-blue-100', text: 'text-blue-700' },
  BUYING: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  SELLING: { bg: 'bg-accent/20', text: 'text-accent' },
  ALLOCATING: { bg: 'bg-blue-100', text: 'text-blue-700' },
  DISPATCHING: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CLOSED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  ARCHIVED: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

const TYPE_COLORS: Record<string, string> = {
  SPORTS_TOURNAMENT: 'bg-primary/10 text-primary',
  RACING_SEASON: 'bg-red-100 text-red-700',
  RACING_WEEKEND: 'bg-red-100 text-red-700',
  CONCERT: 'bg-purple-100 text-purple-700',
  CONFERENCE: 'bg-indigo-100 text-indigo-700',
  EXPO: 'bg-teal-100 text-teal-700',
  OTHER: 'bg-muted text-muted-foreground',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  SPORTS_TOURNAMENT: <Trophy size={16} />,
  RACING_SEASON: <Flag size={16} />,
  RACING_WEEKEND: <Flag size={16} />,
  CONCERT: <Music size={16} />,
  CONFERENCE: <Briefcase size={16} />,
  EXPO: <Globe size={16} />,
  OTHER: <Star size={16} />,
};

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`;
}

export default function EventsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const ctx = useAppContext();
  const { events, currencies, settings, addEvent } = ctx;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    name: '', code: '', eventType: 'SPORTS_TOURNAMENT' as EventDef['eventType'],
    startDate: '', endDate: '', defaultCurrency: settings.defaultCurrency,
    ownerUserId: '', dispatchBufferHours: settings.defaultDispatchBufferHours,
    portalTokenExpiryDays: settings.defaultPortalTokenExpiryDays,
    allowOversell: settings.defaultAllowOversell, logoUrl: '', bannerUrl: '',
  });

  const filtered = events.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (typeFilter !== 'all' && e.eventType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !e.code.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const canCreate = currentUser && ['super_admin', 'event_admin'].includes(currentUser.role);

  const handleCreate = () => {
    if (!form.name.trim() || !form.code.trim() || !form.startDate || !form.endDate) {
      toast.error('Please fill all required fields');
      return;
    }
    addEvent({
      code: form.code, name: form.name, eventType: form.eventType,
      status: 'DRAFT', startDate: form.startDate, endDate: form.endDate,
      defaultCurrency: form.defaultCurrency,
      dispatchBufferHours: form.dispatchBufferHours,
      portalTokenExpiryDays: form.portalTokenExpiryDays,
      allowOversell: form.allowOversell,
      ownerUserId: form.ownerUserId, logoUrl: form.logoUrl, bannerUrl: form.bannerUrl,
    });
    toast.success(`Event "${form.name}" created`);
    setShowCreate(false);
    setForm({ name: '', code: '', eventType: 'SPORTS_TOURNAMENT', startDate: '', endDate: '', defaultCurrency: settings.defaultCurrency, ownerUserId: '', dispatchBufferHours: settings.defaultDispatchBufferHours, portalTokenExpiryDays: settings.defaultPortalTokenExpiryDays, allowOversell: settings.defaultAllowOversell, logoUrl: '', bannerUrl: '' });
  };

  const autoCode = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 16);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[26px] text-primary">Events</h1>
          <Badge variant="secondary" className="font-mono text-xs">{events.length}</Badge>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={16} /> Create Event
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_LIST.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Events grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(e => {
          const sc = STATUS_COLORS[e.status] || STATUS_COLORS.DRAFT;
          const tc = TYPE_COLORS[e.eventType] || TYPE_COLORS.OTHER;
          const cur = currencies.find(c => c.code === e.defaultCurrency);
          return (
            <div key={e.id}
              className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden cursor-pointer transition-all hover:shadow-md group"
              onClick={() => navigate(`/events/${e.id}`)}
            >
              {/* Banner gradient */}
              <div className="h-24 bg-gradient-to-br from-primary/80 to-primary flex items-end p-4">
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  {TYPE_ICONS[e.eventType]}
                  <span className="font-body text-xs uppercase tracking-wide">{e.eventType.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className="p-5">
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-primary text-primary-foreground">{e.code}</span>
                <h3 className="font-display text-lg mt-2 text-primary group-hover:text-accent transition-colors">{e.name}</h3>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full font-body text-[11px] font-medium ${sc.bg} ${sc.text}`}>{e.status}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-body text-[11px] font-medium ${tc}`}>{e.eventType.replace(/_/g, ' ')}</span>
                </div>
                <p className="font-body text-sm text-muted-foreground mt-2">
                  <Calendar size={13} className="inline mr-1 -mt-0.5" />
                  {formatDateRange(e.startDate, e.endDate)}
                </p>
                {cur && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-muted font-mono text-[11px] text-muted-foreground">{cur.code}</span>
                )}
              </div>
              <div className="border-t border-border px-5 py-3 flex items-center justify-between">
                <span className="font-body text-sm text-muted-foreground">{e.matches.length} matches</span>
                <span className="font-body text-sm font-medium text-primary flex items-center gap-1 group-hover:text-accent">
                  View <ChevronRight size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="font-body text-muted-foreground">No events match your filters.</p>
        </div>
      )}

      {/* Create Event Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Create New Event</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="font-body text-xs text-muted-foreground">Event Name *</label>
              <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value, code: f.code || autoCode(e.target.value) })); }} className="mt-1" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="font-body text-xs text-muted-foreground">Event Code *</label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="mt-1 font-mono" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground">Event Type *</label>
              <Select value={form.eventType} onValueChange={v => setForm(f => ({ ...f, eventType: v as EventDef['eventType'] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground">Default Currency *</label>
              <Select value={form.defaultCurrency} onValueChange={v => setForm(f => ({ ...f, defaultCurrency: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{currencies.filter(c => c.isActive).map(c => <SelectItem key={c.id} value={c.code}>{c.code} — {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground">Start Date *</label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground">End Date *</label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground">Dispatch Buffer (hours)</label>
              <Input type="number" value={form.dispatchBufferHours} onChange={e => setForm(f => ({ ...f, dispatchBufferHours: +e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground">Portal Token Expiry (days)</label>
              <Input type="number" value={form.portalTokenExpiryDays} onChange={e => setForm(f => ({ ...f, portalTokenExpiryDays: +e.target.value }))} className="mt-1" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <label className="font-body text-sm text-foreground">Allow Oversell</label>
              <button onClick={() => setForm(f => ({ ...f, allowOversell: !f.allowOversell }))}
                className={`w-10 h-5 rounded-full transition-colors ${form.allowOversell ? 'bg-accent' : 'bg-muted'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.allowOversell ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
