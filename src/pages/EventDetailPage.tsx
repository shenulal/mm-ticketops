import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronRight, Settings, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  MOCK_EVENTS, MOCK_MATCHES, MOCK_SUBGAMES, MOCK_UNITS,
  getSubGamesForMatch, hasMultipleSubGames, getInventoryAvailable,
  type SubGame, type Category,
} from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/RoleGuard';

/* ── helpers ── */
function getTotalPurchased(subGameId: string, categoryId: string) {
  return MOCK_UNITS.filter(u => u.subGameId === subGameId && u.categoryId === categoryId).length;
}

function getSold(subGameId: string, categoryId: string) {
  return MOCK_UNITS.filter(u => u.subGameId === subGameId && u.categoryId === categoryId && u.status === 'ALLOCATED').length;
}

/* ── Inventory bar row ── */
function InventoryRow({ cat, subGameId }: { cat: Category; subGameId: string }) {
  const total = getTotalPurchased(subGameId, cat.id);
  const sold = getSold(subGameId, cat.id);
  const available = getInventoryAvailable(subGameId, cat.id);
  const pct = total > 0 ? (sold / total) * 100 : 0;

  if (total === 0) return null;

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-body text-xs text-foreground">{cat.label}</span>
        <span className="font-body text-xs text-success">{available} available</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-border">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Single sub-game match card (flat) ── */
function SingleSubGameCard({ match, subGame }: { match: typeof MOCK_MATCHES[0]; subGame: SubGame }) {
  const navigate = useNavigate();
  const hasInventory = subGame.categories.some(c => getTotalPurchased(subGame.id, c.id) > 0);

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-primary text-primary-foreground">{match.code}</span>
          <span className="font-body text-[13px] text-muted-foreground">{match.date}</span>
        </div>
        <h3 className="font-display text-xl mb-1 text-primary">{match.teams}</h3>
        <p className="font-body text-[13px] mb-4 text-muted-foreground">{match.venue}, {match.city}</p>

        {hasInventory ? (
          <div className="space-y-2.5">
            {subGame.categories.map(cat => (
              <InventoryRow key={cat.id} cat={cat} subGameId={subGame.id} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <p className="font-body text-sm mb-3 text-muted-foreground">No inventory yet</p>
            <button
              onClick={() => navigate('/purchases/new')}
              className="px-4 py-2 rounded-lg font-body text-sm font-medium transition-opacity hover:opacity-90 bg-accent text-accent-foreground"
            >
              + Add Purchase
            </button>
          </div>
        )}
      </div>
      {hasInventory && (
        <div className="border-t border-border px-5 py-3">
          <button className="font-body text-sm font-medium hover:underline text-primary">
            View Full Detail →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Multi sub-game match card (tabs) ── */
function MultiSubGameCard({ match, subGames }: { match: typeof MOCK_MATCHES[0]; subGames: SubGame[] }) {
  const navigate = useNavigate();
  // Default to race/main or last
  const defaultSg = subGames.find(sg => sg.sessionType === 'RACE') || subGames[subGames.length - 1];
  const [activeTabId, setActiveTabId] = useState(defaultSg.id);
  const activeSg = subGames.find(sg => sg.id === activeTabId) || subGames[0];

  const totalPurchased = subGames.reduce((sum, sg) =>
    sum + sg.categories.reduce((s, c) => s + getTotalPurchased(sg.id, c.id), 0), 0);

  const tabLabels: Record<string, string> = {
    FP: 'FP1', QUALIFYING: 'Qualifying', SPRINT: 'Sprint', RACE: 'Grand Prix', MATCH: 'Match', OTHER: 'Other',
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden lg:col-span-2">
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-primary text-primary-foreground">{match.code}</span>
          <span className="font-body text-[13px] text-muted-foreground">{match.date}</span>
        </div>
        <h3 className="font-display text-xl mb-1 text-primary">{match.teams}</h3>
        <p className="font-body text-[13px] mb-3 text-muted-foreground">{match.venue}, {match.city}</p>

        {/* Sub-game pill tabs */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {subGames.map(sg => (
            <button
              key={sg.id}
              onClick={() => setActiveTabId(sg.id)}
              className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors ${
                sg.id === activeTabId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tabLabels[sg.sessionType] || sg.name}
            </button>
          ))}
        </div>

        {/* Active sub-game content */}
        <div className="mb-2">
          <p className="font-body text-[13px] text-muted-foreground mb-3">
            {activeSg.name} — {activeSg.startTime}
          </p>
          {activeSg.categories.some(c => getTotalPurchased(activeSg.id, c.id) > 0) ? (
            <div className="space-y-2.5">
              {activeSg.categories.map(cat => (
                <InventoryRow key={cat.id} cat={cat} subGameId={activeSg.id} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <p className="font-body text-sm mb-3 text-muted-foreground">No inventory for this session</p>
              <button
                onClick={() => navigate('/purchases/new')}
                className="px-4 py-2 rounded-lg font-body text-sm font-medium transition-opacity hover:opacity-90 bg-accent text-accent-foreground"
              >
                + Add Purchase
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border px-5 py-3 flex items-center justify-between">
        <span className="font-body text-xs text-muted-foreground">
          Total: {totalPurchased} purchased across {subGames.length} sessions
        </span>
        <button className="font-body text-sm font-medium hover:underline text-primary">
          View Full Detail →
        </button>
      </div>
    </div>
  );
}

/* ── Manage Sessions Drawer ── */
const SESSION_TYPES = ['MATCH', 'QUALIFYING', 'SPRINT', 'FP', 'RACE', 'OTHER'] as const;

function ManageSessionsDrawer({
  matchId, subGames, open, onClose,
}: { matchId: string; subGames: SubGame[]; open: boolean; onClose: () => void }) {
  const [sessions, setSessions] = useState(subGames);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('MATCH');
  const [newTime, setNewTime] = useState('');
  const [newCats, setNewCats] = useState<{ name: string; order: number }[]>([{ name: '', order: 1 }]);

  const handleSave = () => {
    if (!newName.trim() || !newTime.trim()) return;
    const validCats = newCats.filter(c => c.name.trim());
    if (validCats.length === 0) return;

    const newSg: SubGame = {
      id: `sg-new-${Date.now()}`,
      matchId,
      name: newName,
      sessionType: newType,
      startTime: newTime,
      isDefault: false,
      categories: validCats.map((c, i) => ({
        id: `new-cat-${Date.now()}-${i}`,
        label: c.name,
        level: c.order,
        isActive: true,
      })),
    };
    setSessions(prev => [...prev, newSg]);
    setAdding(false);
    setNewName(''); setNewTime(''); setNewCats([{ name: '', order: 1 }]);
    toast.success(`Session "${newName}" added successfully`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-primary">Manage Sessions</h2>
                <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={20} /></button>
              </div>

              <div className="space-y-3 mb-6">
                {sessions.map(sg => (
                  <div key={sg.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-sm font-medium text-foreground">{sg.name}</span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-muted text-muted-foreground">{sg.sessionType}</span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground">{sg.startTime}</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">{sg.categories.length} categories</p>
                    <div className="flex gap-2 mt-2">
                      <button className="font-body text-xs text-primary hover:underline">Edit</button>
                      <button className="font-body text-xs text-accent hover:underline">Add Cat</button>
                    </div>
                  </div>
                ))}
              </div>

              {adding ? (
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <h3 className="font-body text-sm font-semibold text-foreground">New Session</h3>
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Session Name *</label>
                    <input value={newName} onChange={e => setNewName(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Session Type</label>
                    <select value={newType} onChange={e => setNewType(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background font-body text-sm">
                      {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground">Date / Time *</label>
                    <input value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="e.g. 22 Sep 2026 14:00"
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>

                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-2 block">Categories</label>
                    {newCats.map((cat, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input value={cat.name} onChange={e => {
                          const c = [...newCats]; c[i].name = e.target.value; setNewCats(c);
                        }} placeholder="Category name *"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background font-body text-sm" />
                        <input type="number" value={cat.order} onChange={e => {
                          const c = [...newCats]; c[i].order = +e.target.value; setNewCats(c);
                        }} className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background font-body text-sm" />
                        {newCats.length > 1 && (
                          <button onClick={() => setNewCats(newCats.filter((_, j) => j !== i))}
                            className="text-destructive hover:text-destructive/80 text-sm">×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setNewCats([...newCats, { name: '', order: newCats.length + 1 }])}
                      className="font-body text-xs text-accent hover:underline">+ Add Category</button>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSave}
                      className="px-4 py-2 rounded-lg font-body text-sm font-medium bg-primary text-primary-foreground hover:opacity-90">
                      Save Session
                    </button>
                    <button onClick={() => setAdding(false)}
                      className="font-body text-sm text-muted-foreground hover:underline">Cancel</button>
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

/* ── Main Page ── */
export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Resolve event from URL param
  const event = MOCK_EVENTS.find(e =>
    e.id === id || e.code.toLowerCase().replace(/[^a-z0-9]/g, '-') === id
  ) || MOCK_EVENTS[0];

  const eventMatches = MOCK_MATCHES.filter(m => m.eventId === event.id);

  const [drawerMatch, setDrawerMatch] = useState<string | null>(null);
  const drawerSubGames = drawerMatch ? getSubGamesForMatch(drawerMatch) : [];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 font-body text-sm text-muted-foreground">
        <Link to="/events" className="hover:underline text-accent">Events</Link>
        <ChevronRight size={14} />
        <span>{event.name}</span>
      </div>

      {/* Event header */}
      <div className="rounded-xl p-6 mb-6 flex items-start justify-between bg-primary">
        <div>
          <h1 className="font-display text-[28px] text-primary-foreground">{event.name}</h1>
          <p className="font-mono text-xs mt-1 text-accent">{event.code}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="px-3 py-1 rounded-full font-body text-xs font-medium bg-accent/20 text-accent">{event.status}</span>
            <span className="px-3 py-1 rounded-full font-body text-xs bg-primary-foreground/10 text-primary-foreground/80">{event.matches} Matches</span>
            <span className="px-3 py-1 rounded-full font-body text-xs bg-primary-foreground/10 text-primary-foreground/80">AED 3.6M invested</span>
          </div>
          <p className="font-body text-sm mt-3 text-primary-foreground/70">Event Owner: Sara Al Mansoori</p>
        </div>
        <span className="px-3 py-1.5 rounded-full font-body text-xs font-medium shrink-0 bg-accent/20 text-accent">
          47 days to first match
        </span>
      </div>

      {/* Match grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventMatches.map(m => {
          const subGames = getSubGamesForMatch(m.id);
          const isMulti = hasMultipleSubGames(m.id);

          if (subGames.length === 0) {
            // No sub-games at all — empty card
            return (
              <div key={m.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-primary text-primary-foreground">{m.code}</span>
                    <span className="font-body text-[13px] text-muted-foreground">{m.date}</span>
                  </div>
                  <h3 className="font-display text-xl mb-1 text-primary">{m.teams}</h3>
                  <p className="font-body text-[13px] mb-4 text-muted-foreground">{m.venue}, {m.city}</p>
                  <div className="flex flex-col items-center py-6">
                    <p className="font-body text-sm mb-3 text-muted-foreground">No inventory yet</p>
                    <button onClick={() => navigate('/purchases/new')}
                      className="px-4 py-2 rounded-lg font-body text-sm font-medium transition-opacity hover:opacity-90 bg-accent text-accent-foreground">
                      + Add Purchase
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (!isMulti) {
            return <SingleSubGameCard key={m.id} match={m} subGame={subGames[0]} />;
          }

          return (
            <div key={m.id} className="lg:col-span-2 relative">
              <MultiSubGameCard match={m} subGames={subGames} />
              <RoleGuard roles={['super_admin', 'ops_manager', 'sr_operator']}>
                <button
                  onClick={() => setDrawerMatch(m.id)}
                  className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs text-muted-foreground hover:bg-muted border border-border bg-card"
                >
                  <Settings size={13} /> Manage Sessions
                </button>
              </RoleGuard>
            </div>
          );
        })}
      </div>

      {eventMatches.length < (event.matches || 0) && (
        <button className="mt-4 font-body text-sm font-medium hover:underline text-accent">
          Show all {event.matches} matches →
        </button>
      )}

      {/* Manage Sessions drawer */}
      <ManageSessionsDrawer
        matchId={drawerMatch || ''}
        subGames={drawerSubGames}
        open={!!drawerMatch}
        onClose={() => setDrawerMatch(null)}
      />
    </div>
  );
}
