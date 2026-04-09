import { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAppContext, type EventDef, type MatchDef, type SubGameDef, type SubGameCategory } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { MOCK_UNITS } from '@/data/mockData';
import RoleGuard from '@/components/RoleGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Settings, Plus, X, GripVertical, Calendar, MapPin,
  Users, Shield, FileText, Eye, Pencil, Trash2, ChevronDown,
} from 'lucide-react';

/* ── Inventory helpers (still from mock units) ── */
function getTotalPurchased(subGameId: string, categoryId: string) {
  return MOCK_UNITS.filter(u => u.subGameId === subGameId && u.categoryId === categoryId).length;
}
function getSold(subGameId: string, categoryId: string) {
  return MOCK_UNITS.filter(u => u.subGameId === subGameId && u.categoryId === categoryId && u.status === 'ALLOCATED').length;
}
function getAvailable(subGameId: string, categoryId: string) {
  return MOCK_UNITS.filter(u => u.subGameId === subGameId && u.categoryId === categoryId && u.status === 'AVAILABLE').length;
}

/* ── Inventory Row ── */
function InventoryRow({ cat, subGameId }: { cat: SubGameCategory; subGameId: string }) {
  const total = getTotalPurchased(subGameId, cat.id);
  const sold = getSold(subGameId, cat.id);
  const available = getAvailable(subGameId, cat.id);
  const pct = total > 0 ? (sold / total) * 100 : 0;
  if (total === 0) return null;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-body text-xs text-foreground">{cat.displayName}</span>
        <span className="font-body text-xs text-emerald-600">{available} available</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-border">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Match Card ── */
function MatchCard({ match, onManageSessions }: { match: MatchDef; onManageSessions: () => void }) {
  const ctx = useAppContext();
  const navigate = useNavigate();
  const isMulti = match.subGames.length > 1;
  const venue = ctx.getVenue(match.venueId);

  const defaultSg = match.subGames.find(sg => sg.sessionType === 'RACE') || match.subGames[match.subGames.length - 1];
  const [activeTabId, setActiveTabId] = useState(defaultSg?.id || '');
  const activeSg = match.subGames.find(sg => sg.id === activeTabId) || match.subGames[0];

  const tabLabels: Record<string, string> = {
    FP: 'FP', QUALIFYING: 'Qualifying', SPRINT: 'Sprint', RACE: 'Grand Prix', MATCH: 'Match', OTHER: 'Other', SHOW: 'Show', DAY: 'Day',
  };

  const hasInventory = (sg: SubGameDef) => sg.categories.some(c => getTotalPurchased(sg.id, c.id) > 0);

  return (
    <div className={`bg-card rounded-xl shadow-sm border border-border overflow-hidden ${isMulti ? 'lg:col-span-2' : ''}`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-primary text-primary-foreground">{match.code}</span>
          <div className="flex items-center gap-2">
            {match.subGames.length > 0 && (
              <Badge variant="secondary" className="font-mono text-[10px]">{match.subGames.length} session{match.subGames.length !== 1 ? 's' : ''}</Badge>
            )}
            <span className="font-body text-[13px] text-muted-foreground">{match.date}</span>
          </div>
        </div>
        <h3 className="font-display text-xl mb-1 text-primary">{match.teamsOrDescription}</h3>
        <p className="font-body text-[13px] mb-3 text-muted-foreground">
          <MapPin size={12} className="inline mr-1 -mt-0.5" />
          {venue?.name ?? 'No venue set'}{venue ? `, ${venue.city}` : ''}
        </p>

        {/* Sub-game tabs (multi only) */}
        {isMulti && activeSg && (
          <>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {match.subGames.map(sg => (
                <button key={sg.id} onClick={() => setActiveTabId(sg.id)}
                  className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors ${
                    sg.id === activeTabId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>
                  {tabLabels[sg.sessionType] || sg.name}
                </button>
              ))}
            </div>
            <p className="font-body text-[13px] text-muted-foreground mb-3">{activeSg.name} — {activeSg.startTime}</p>
          </>
        )}

        {/* Inventory rows */}
        {activeSg && hasInventory(activeSg) ? (
          <div className="space-y-2.5">
            {activeSg.categories.map(cat => <InventoryRow key={cat.id} cat={cat} subGameId={activeSg.id} />)}
          </div>
        ) : activeSg ? (
          <div className="flex flex-col items-center py-6">
            <p className="font-body text-sm mb-3 text-muted-foreground">No inventory{isMulti ? ' for this session' : ' yet'}</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/purchases/new')}>+ Add Purchase</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <p className="font-body text-sm text-muted-foreground">No sessions configured</p>
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-3 flex items-center justify-between">
        <RoleGuard roles={['super_admin', 'ops_manager', 'sr_operator']}>
          <button onClick={onManageSessions} className="flex items-center gap-1.5 font-body text-xs text-muted-foreground hover:text-foreground">
            <Settings size={13} /> Manage Sessions
          </button>
        </RoleGuard>
        {activeSg && hasInventory(activeSg) && (
          <button onClick={() => navigate('/distribution')} className="font-body text-sm font-medium hover:underline text-primary">
            View Inventory →
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Manage Sessions Drawer ── */
const SESSION_TYPES: SubGameDef['sessionType'][] = ['MATCH', 'QUALIFYING', 'SPRINT', 'FP', 'RACE', 'SHOW', 'DAY', 'OTHER'];

function ManageSessionsDrawer({ match, open, onClose }: { match: MatchDef | null; open: boolean; onClose: () => void }) {
  const ctx = useAppContext();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<SubGameDef['sessionType']>('MATCH');
  const [newTime, setNewTime] = useState('');
  const [newDuration, setNewDuration] = useState('120');
  const [newCats, setNewCats] = useState<{ name: string; order: number }[]>([{ name: '', order: 1 }]);
  const [editCatSg, setEditCatSg] = useState<string | null>(null);
  const [addingCatName, setAddingCatName] = useState('');

  const handleAddSession = () => {
    if (!match || !newName.trim() || !newTime.trim()) return;
    const validCats = newCats.filter(c => c.name.trim());
    ctx.addSubGameToMatch(match.id, {
      matchId: match.id, name: newName, sessionType: newType,
      startTime: newTime, durationMinutes: parseInt(newDuration) || 120,
      isDefault: match.subGames.length === 0,
      categories: validCats.map((c, i) => ({
        id: '', displayName: c.name, label: c.name, level: c.order,
        description: '', seatSectionHint: '', isActive: true,
      })),
    });
    toast.success(`Session "${newName}" added`);
    setAdding(false);
    setNewName(''); setNewTime(''); setNewCats([{ name: '', order: 1 }]);
  };

  const handleAddCat = (sgId: string) => {
    if (!addingCatName.trim()) return;
    const sg = match?.subGames.find(s => s.id === sgId);
    const nextLevel = (sg?.categories.length || 0) + 1;
    ctx.addCategoryToSubGame(sgId, {
      displayName: addingCatName, label: addingCatName, level: nextLevel,
      description: '', seatSectionHint: '', isActive: true,
    });
    toast.success(`Category "${addingCatName}" added`);
    setAddingCatName('');
    setEditCatSg(null);
  };

  return (
    <AnimatePresence>
      {open && match && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
          <motion.div initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
            transition={{ duration: 0.25 }} className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-card border-l border-border shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-xl text-primary">Sessions — {match.code}</h2>
                  <p className="font-body text-sm text-muted-foreground">{match.teamsOrDescription}</p>
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={20} /></button>
              </div>

              {match.subGames.length === 1 && match.subGames[0].isDefault && (
                <div className="mb-4 p-3 rounded-lg bg-muted border border-border">
                  <p className="font-body text-xs text-muted-foreground">
                    This match has one session. Sub-game layer is hidden in all forms. Tickets are shown directly as match tickets.
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {match.subGames.map(sg => (
                  <div key={sg.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-sm font-medium text-foreground">{sg.name}</span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-muted text-muted-foreground">{sg.sessionType}</span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground">{sg.startTime} · {sg.durationMinutes}min</p>

                    {/* Categories */}
                    <div className="mt-3 space-y-1">
                      {sg.categories.sort((a, b) => a.level - b.level).map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 py-1 px-2 rounded bg-muted/50">
                          <GripVertical size={12} className="text-muted-foreground" />
                          <Badge variant="outline" className="text-[10px] font-mono">L{cat.level}</Badge>
                          <span className="font-body text-xs text-foreground flex-1">{cat.displayName}</span>
                          <button className={`text-xs ${cat.isActive ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {cat.isActive ? '●' : '○'}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setEditCatSg(editCatSg === sg.id ? null : sg.id); }}
                        className="font-body text-xs text-accent hover:underline">+ Add Category</button>
                    </div>

                    {editCatSg === sg.id && (
                      <div className="flex gap-2 mt-2">
                        <Input value={addingCatName} onChange={e => setAddingCatName(e.target.value)}
                          placeholder="Category name" className="h-8 text-xs flex-1" />
                        <Button size="sm" className="h-8 text-xs" onClick={() => handleAddCat(sg.id)}>Add</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add session form */}
              {adding ? (
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <h3 className="font-body text-sm font-semibold text-foreground">New Session</h3>
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Session Name *</label>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-xs text-muted-foreground">Type</label>
                      <Select value={newType} onValueChange={v => setNewType(v as SubGameDef['sessionType'])}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{SESSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="font-body text-xs text-muted-foreground">Duration (min)</label>
                      <Input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Date / Time *</label>
                    <Input value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="e.g. 22 Sep 2026 14:00" className="mt-1" />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-2 block">Categories</label>
                    {newCats.map((cat, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <Input value={cat.name} onChange={e => { const c = [...newCats]; c[i].name = e.target.value; setNewCats(c); }}
                          placeholder="Category name *" className="flex-1 h-8 text-xs" />
                        <Input type="number" value={cat.order} onChange={e => { const c = [...newCats]; c[i].order = +e.target.value; setNewCats(c); }}
                          className="w-16 h-8 text-xs" />
                        {newCats.length > 1 && (
                          <button onClick={() => setNewCats(newCats.filter((_, j) => j !== i))} className="text-destructive text-sm">×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setNewCats([...newCats, { name: '', order: newCats.length + 1 }])}
                      className="font-body text-xs text-accent hover:underline">+ Add Category</button>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleAddSession}>Save Session</Button>
                    <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAdding(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border font-body text-sm text-muted-foreground hover:bg-muted w-full justify-center">
                  <Plus size={14} /> Add Session
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Vendor Tab ── */
function VendorTab({ event }: { event: EventDef }) {
  const ctx = useAppContext();
  const bridges = ctx.vendorEventBridges.filter(b => b.eventId === event.id);
  const [assigning, setAssigning] = useState(false);
  const [selVendor, setSelVendor] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [loginEmail, setLoginEmail] = useState('');

  const assignedIds = bridges.map(b => b.vendorId);
  const available = ctx.vendors.filter(v => v.isActive && !assignedIds.includes(v.id));

  const handleAssign = () => {
    if (!selVendor) return;
    ctx.setVendorEventBridge({
      id: `veb-${Date.now()}`, vendorId: selVendor, eventId: event.id,
      platformUrl, loginEmail, credentialHint: '', primaryContactForEvent: '',
      notes: '', isActive: true,
    });
    toast.success('Vendor assigned');
    setAssigning(false); setSelVendor(''); setPlatformUrl(''); setLoginEmail('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-body text-sm font-semibold text-foreground">{bridges.length} vendors assigned</h3>
        <RoleGuard roles={['super_admin', 'ops_manager']}>
          <Button size="sm" variant="outline" onClick={() => setAssigning(!assigning)}><Plus size={14} className="mr-1" /> Assign Vendor</Button>
        </RoleGuard>
      </div>

      {assigning && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <Select value={selVendor} onValueChange={setSelVendor}>
            <SelectTrigger><SelectValue placeholder="Select vendor..." /></SelectTrigger>
            <SelectContent>{available.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={platformUrl} onChange={e => setPlatformUrl(e.target.value)} placeholder="Platform URL" />
          <Input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Login email" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAssign}>Assign</Button>
            <Button size="sm" variant="ghost" onClick={() => setAssigning(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {bridges.map(b => {
        const vendor = ctx.getVendor(b.vendorId);
        return (
          <div key={b.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-body text-sm font-medium text-foreground">{vendor?.name ?? 'Unknown'}</p>
              <p className="font-body text-xs text-muted-foreground">{b.platformUrl || 'No platform URL'}</p>
              <p className="font-mono text-xs text-muted-foreground">{b.loginEmail ? '••••@' + b.loginEmail.split('@')[1] : 'No login'}</p>
            </div>
            <Button variant="ghost" size="sm"><Pencil size={14} /></Button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Contracts Tab ── */
function ContractsTab({ event }: { event: EventDef }) {
  const ctx = useAppContext();
  const navigate = useNavigate();
  const eventContracts = ctx.contracts.filter(c => c.eventId === event.id);
  const purchases = eventContracts.filter(c => c.contractType === 'PURCHASE');
  const sales = eventContracts.filter(c => c.contractType === 'SALE');

  const renderContract = (c: typeof eventContracts[0]) => {
    const party = c.partyType === 'VENDOR' ? ctx.getVendor(c.partyId) : ctx.getClient(c.partyId);
    const partyName = c.partyType === 'VENDOR' ? (party as any)?.name : (party as any)?.companyName;
    return (
      <div key={c.id} className="border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs font-bold text-foreground">{c.contractRef}</span>
          <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">{c.status}</Badge>
        </div>
        <p className="font-body text-sm text-foreground">{partyName ?? 'Unknown'}</p>
        <p className="font-body text-xs text-muted-foreground">{c.validFrom} → {c.validTo}</p>
        <p className="font-body text-xs text-muted-foreground mt-1">Max: {ctx.formatCurrency(c.maxValue, c.currency)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-body text-sm font-semibold text-foreground">Purchase Contracts ({purchases.length})</h3>
          <Button size="sm" variant="outline" onClick={() => navigate('/masters/contracts')}><Plus size={14} className="mr-1" /> Add</Button>
        </div>
        <div className="space-y-2">{purchases.map(renderContract)}</div>
        {purchases.length === 0 && <p className="font-body text-sm text-muted-foreground">No purchase contracts</p>}
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-body text-sm font-semibold text-foreground">Sale Contracts ({sales.length})</h3>
        </div>
        <div className="space-y-2">{sales.map(renderContract)}</div>
        {sales.length === 0 && <p className="font-body text-sm text-muted-foreground">No sale contracts</p>}
      </div>
    </div>
  );
}

/* ── Settings Tab ── */
function EventSettingsTab({ event }: { event: EventDef }) {
  const ctx = useAppContext();
  const [form, setForm] = useState({
    dispatchBufferHours: event.dispatchBufferHours,
    portalTokenExpiryDays: event.portalTokenExpiryDays,
    allowOversell: event.allowOversell,
    defaultCurrency: event.defaultCurrency,
    status: event.status,
  });

  const handleSave = () => {
    ctx.updateEvent(event.id, form);
    toast.success('Event settings saved');
  };

  const STATUS_TRANSITIONS: Record<string, string[]> = {
    PLANNING: ['PROCUREMENT'], PROCUREMENT: ['SELLING'], SELLING: ['ALLOCATING'],
    ALLOCATING: ['DISPATCHING'], DISPATCHING: ['COMPLETED'], COMPLETED: ['ARCHIVED'],
  };
  const nextStatuses = STATUS_TRANSITIONS[form.status] || [];

  return (
    <div className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-body text-xs text-muted-foreground">Dispatch Buffer (hours)</label>
          <Input type="number" value={form.dispatchBufferHours} onChange={e => setForm(f => ({ ...f, dispatchBufferHours: +e.target.value }))} className="mt-1" />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground">Portal Token Expiry (days)</label>
          <Input type="number" value={form.portalTokenExpiryDays} onChange={e => setForm(f => ({ ...f, portalTokenExpiryDays: +e.target.value }))} className="mt-1" />
        </div>
      </div>
      <div>
        <label className="font-body text-xs text-muted-foreground">Default Currency</label>
        <Select value={form.defaultCurrency} onValueChange={v => setForm(f => ({ ...f, defaultCurrency: v }))}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{ctx.currencies.filter(c => c.isActive).map(c => <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <label className="font-body text-sm text-foreground">Allow Oversell</label>
        <button onClick={() => setForm(f => ({ ...f, allowOversell: !f.allowOversell }))}
          className={`w-10 h-5 rounded-full transition-colors ${form.allowOversell ? 'bg-accent' : 'bg-muted'}`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.allowOversell ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <div>
        <label className="font-body text-xs text-muted-foreground mb-2 block">Event Status: <strong>{form.status}</strong></label>
        <div className="flex gap-2">
          {nextStatuses.map(s => (
            <Button key={s} size="sm" variant="outline" onClick={() => setForm(f => ({ ...f, status: s as EventDef['status'] }))}>
              Move to {s}
            </Button>
          ))}
        </div>
      </div>
      <Button onClick={handleSave}>Save Event Settings</Button>
    </div>
  );
}

/* ── Add Match Modal ── */
function AddMatchModal({ eventId, open, onClose }: { eventId: string; open: boolean; onClose: () => void }) {
  const ctx = useAppContext();
  const event = ctx.getEvent(eventId);
  const [form, setForm] = useState({
    code: '', teamsOrDescription: '', matchDate: '', matchTime: '',
    venueId: '', groupStage: '',
  });

  const deadline = useMemo(() => {
    if (!form.matchDate || !form.matchTime || !event) return '';
    const dt = new Date(`${form.matchDate}T${form.matchTime}`);
    dt.setHours(dt.getHours() - event.dispatchBufferHours);
    return dt.toISOString().slice(0, 16).replace('T', ' ');
  }, [form.matchDate, form.matchTime, event]);

  const handleSave = () => {
    if (!form.code.trim() || !form.teamsOrDescription.trim() || !form.matchDate || !form.matchTime) {
      toast.error('Fill required fields'); return;
    }
    const venue = ctx.getVenue(form.venueId);
    ctx.addMatchToEvent(eventId, {
      eventId, code: form.code, teamsOrDescription: form.teamsOrDescription,
      teams: form.teamsOrDescription, matchDate: form.matchDate, matchTime: form.matchTime,
      venueId: form.venueId, venue: venue?.name || '', city: venue?.city || '',
      date: `${form.matchDate} ${form.matchTime}`,
      groupStage: form.groupStage, dispatchDeadline: deadline, isActive: true,
    });
    toast.success(`Match ${form.code} added. Add sessions now?`);
    onClose();
    setForm({ code: '', teamsOrDescription: '', matchDate: '', matchTime: '', venueId: '', groupStage: '' });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">Add Match</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-muted-foreground">Match Code *</label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="mt-1 font-mono" placeholder="M04" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground">Group / Stage</label>
              <Input value={form.groupStage} onChange={e => setForm(f => ({ ...f, groupStage: e.target.value }))} className="mt-1" placeholder="Group A" />
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground">Teams / Description *</label>
            <Input value={form.teamsOrDescription} onChange={e => setForm(f => ({ ...f, teamsOrDescription: e.target.value }))} className="mt-1" placeholder="GER v JPN" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-muted-foreground">Date *</label>
              <Input type="date" value={form.matchDate} onChange={e => setForm(f => ({ ...f, matchDate: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground">Time *</label>
              <Input type="time" value={form.matchTime} onChange={e => setForm(f => ({ ...f, matchTime: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground">Venue *</label>
            <Select value={form.venueId} onValueChange={v => setForm(f => ({ ...f, venueId: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select venue..." /></SelectTrigger>
              <SelectContent>{ctx.venues.filter(v => v.isActive).map(v => <SelectItem key={v.id} value={v.id}>{v.name}, {v.city}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {deadline && (
            <p className="font-body text-xs text-muted-foreground bg-muted p-2 rounded">
              Dispatch deadline (auto): <strong>{deadline}</strong>
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Add Match</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ── */
export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { currentUser } = useAuth();

  const [drawerMatch, setDrawerMatch] = useState<string | null>(null);
  const [showAddMatch, setShowAddMatch] = useState(false);

  const event = ctx.events.find(e => e.id === id || e.code.toLowerCase().replace(/[^a-z0-9]/g, '-') === id);

  if (!event) return <div className="p-10 text-center font-body text-muted-foreground">Event not found</div>;

  const matchObj = drawerMatch ? event.matches.find(m => m.id === drawerMatch) : null;
  const vendorCount = ctx.vendorEventBridges.filter(b => b.eventId === event.id).length;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 font-body text-sm text-muted-foreground">
        <Link to="/events" className="hover:underline text-accent">Events</Link>
        <ChevronRight size={14} />
        <span>{event.name}</span>
      </div>

      {/* Event header */}
      <div className="rounded-2xl p-6 mb-6 bg-primary">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-[28px] text-primary-foreground">{event.name}</h1>
            <p className="font-mono text-xs mt-1 text-accent">{event.code}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="px-3 py-1 rounded-full font-body text-xs font-medium bg-accent/20 text-accent">{event.status}</span>
              <span className="px-3 py-1 rounded-full font-body text-xs bg-primary-foreground/10 text-primary-foreground/80">{event.eventType.replace(/_/g, ' ')}</span>
              <span className="px-3 py-1 rounded-full font-body text-xs bg-primary-foreground/10 text-primary-foreground/80">{event.matches.length} Matches</span>
              <span className="px-3 py-1 rounded-full font-body text-xs bg-primary-foreground/10 text-primary-foreground/80">{vendorCount} Vendors</span>
              <span className="px-3 py-1 rounded-full font-body text-xs bg-primary-foreground/10 text-primary-foreground/80">{event.defaultCurrency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matches">
        <TabsList className="mb-4">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="contracts">Clients / Contracts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-body text-sm font-semibold text-foreground">{event.matches.length} matches</h2>
            <RoleGuard roles={['super_admin', 'ops_manager', 'sr_operator']}>
              <Button size="sm" onClick={() => setShowAddMatch(true)}><Plus size={14} className="mr-1" /> Add Match</Button>
            </RoleGuard>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.matches.map(m => (
              <MatchCard key={m.id} match={m} onManageSessions={() => setDrawerMatch(m.id)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vendors">
          <VendorTab event={event} />
        </TabsContent>

        <TabsContent value="contracts">
          <ContractsTab event={event} />
        </TabsContent>

        <TabsContent value="settings">
          <EventSettingsTab event={event} />
        </TabsContent>
      </Tabs>

      {/* Drawers & Modals */}
      <ManageSessionsDrawer match={matchObj ?? null} open={!!drawerMatch} onClose={() => setDrawerMatch(null)} />
      <AddMatchModal eventId={event.id} open={showAddMatch} onClose={() => setShowAddMatch(false)} />
    </div>
  );
}
