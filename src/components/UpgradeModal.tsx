import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  MOCK_SUBGAMES, MOCK_UNITS, MOCK_MATCHES, MOCK_SALES,
  getHierarchyForSubGame, getInventoryAvailable, getSubGamesForMatch,
  type SaleLineItem, type Category,
} from '@/data/mockData';
import { X, ArrowUp, ArrowDown, AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

type ChangeType = 'full' | 'partial' | 'individual';
type Step = 'assess' | 'preview';

interface UpgradeModalProps {
  saleId: string;
  line: SaleLineItem;
  lineIdx: number;
  onClose: () => void;
  onConfirm: (targetCategoryId: string, qty: number) => void;
}

export default function UpgradeModal({ saleId, line, lineIdx, onClose, onConfirm }: UpgradeModalProps) {
  const [step, setStep] = useState<Step>('assess');
  const [changeType, setChangeType] = useState<ChangeType>('full');
  const [targetCatId, setTargetCatId] = useState<string | null>(null);
  const [partialQty, setPartialQty] = useState(line.qty);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const sale = MOCK_SALES.find(s => s.id === saleId);
  const saleLabel = saleId.toUpperCase().replace('sale', 'SALE-').replace('SALE', 'SALE-').replace('SALE--', 'SALE-');
  const sgName = getSubGameName(line.subGameId);
  const hierarchy = getHierarchyForSubGame(line.subGameId);
  const currentCat = hierarchy.find(c => c.id === line.categoryId);
  const currentLevel = currentCat?.level ?? 0;
  const available = getInventoryAvailable(line.subGameId, line.categoryId);

  // Check if already highest level
  const isHighest = currentLevel === 1;
  const hasNoUpgrade = isHighest && hierarchy.length <= 1;

  const targetCat = hierarchy.find(c => c.id === targetCatId);
  const isUpgrade = targetCat ? targetCat.level < currentLevel : false;
  const targetAvailable = targetCatId ? getInventoryAvailable(line.subGameId, targetCatId) : 0;
  const qty = changeType === 'full' ? line.qty : partialQty;

  // Cross-sub-game detection
  const matchId = sale?.matchId ?? '';
  const otherSubGames = getSubGamesForMatch(matchId).filter(sg => sg.id !== line.subGameId);

  const availableUnits = useMemo(() => {
    if (!targetCatId) return [];
    return MOCK_UNITS.filter(u => u.subGameId === line.subGameId && u.categoryId === targetCatId && u.status === 'AVAILABLE').slice(0, qty);
  }, [targetCatId, line.subGameId, qty]);

  const handleConfirm = async () => {
    if (!targetCatId) return;
    setConfirming(true);
    await new Promise(r => setTimeout(r, 1500));
    setConfirming(false);
    setConfirmed(true);
    onConfirm(targetCatId, qty);
  };

  const inputCls = "h-[38px] w-full px-3 rounded-lg border border-border font-body text-sm text-foreground bg-card outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-card rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col z-10">

        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex items-start justify-between shrink-0">
          <div>
            <h2 className="font-display text-xl text-primary">Category Change — {saleLabel} / Line {lineIdx + 1}</h2>
            <p className="font-body text-sm text-muted-foreground mt-1">
              {sgName} · {line.categoryLabel} · {line.qty} tickets · {getMatchLabel(matchId)}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground mt-0.5">Session: {sgName} ({line.subGameId})</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {confirmed ? (
            /* ── Success ── */
            <div className="text-center py-8 space-y-4">
              <CheckCircle size={48} className="text-success mx-auto" />
              <h3 className="font-display text-lg text-primary">Category Changed Successfully</h3>
              <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-left space-y-1.5">
                <p className="font-body text-sm text-foreground">
                  <span className="font-bold">{isUpgrade ? 'UPGRADE' : 'DOWNGRADE'}:</span> {sgName} · {line.categoryLabel} → {targetCat?.label} | {qty} tickets
                </p>
                <p className="font-body text-sm text-foreground">Session unchanged: {sgName}</p>
                {availableUnits.length > 0 && (
                  <p className="font-body text-sm text-foreground">
                    Units: {availableUnits[0]?.id} – {availableUnits[availableUnits.length - 1]?.id}
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1">History Entry</p>
                <p className="font-body text-sm text-foreground">
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — Sara Al Mansoori
                </p>
                <p className="font-body text-sm text-foreground">
                  {isUpgrade ? 'UPGRADE' : 'DOWNGRADE'}: {sgName} · {line.categoryLabel} → {targetCat?.label} | {qty} tickets
                </p>
                <p className="font-body text-[12px] text-muted-foreground">Session unchanged: {sgName} | Reason: {line.oversellFlag ? 'Oversold original category' : 'Category change requested'}</p>
              </div>
              <button onClick={onClose} className="px-6 py-2.5 rounded-lg font-body text-sm font-bold bg-primary text-primary-foreground hover:opacity-90">Done</button>
            </div>
          ) : step === 'assess' ? (
            /* ── Step 1: Assess ── */
            <>
              {/* Current State */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <h3 className="font-body text-sm font-bold text-foreground uppercase tracking-wider">Current State</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    ['Sub-Game', sgName],
                    ['Current Category', `${line.categoryLabel} (Level ${currentLevel})`],
                    ['Available', String(available)],
                    ['Oversold', line.oversellFlag ? String(line.qty) : '0'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="font-body text-[10px] text-muted-foreground uppercase">{l}</p>
                      <p className="font-body text-sm font-medium text-foreground">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Change Type */}
              <div className="space-y-2">
                <h3 className="font-body text-sm font-bold text-foreground">Change Type</h3>
                {(['full', 'partial', 'individual'] as const).map(ct => (
                  <label key={ct} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors"
                    style={{ borderColor: changeType === ct ? '#C9A84C' : 'hsl(var(--border))' }}>
                    <input type="radio" name="changeType" checked={changeType === ct} onChange={() => setChangeType(ct)} className="w-4 h-4 accent-primary" />
                    <span className="font-body text-sm text-foreground">
                      {ct === 'full' ? `Full — All ${line.qty} tickets` : ct === 'partial' ? 'Partial — Some tickets' : 'Individual — Select specific rows'}
                    </span>
                  </label>
                ))}
                {changeType === 'partial' && (
                  <div className="ml-8 mt-2">
                    <label className="font-body text-[11px] text-muted-foreground block mb-1">How many to change?</label>
                    <input type="number" value={partialQty} min={1} max={line.qty - 1}
                      onChange={e => setPartialQty(Math.max(1, Math.min(line.qty - 1, parseInt(e.target.value) || 1)))}
                      className={`${inputCls} max-w-[120px]`} />
                  </div>
                )}
              </div>

              {/* Target Category from sub-game hierarchy */}
              <div className="space-y-2">
                <h3 className="font-body text-sm font-bold text-foreground">Target Category</h3>
                <div className="space-y-1.5">
                  {hierarchy.map(cat => {
                    const isCurrent = cat.id === line.categoryId;
                    const catAvail = getInventoryAvailable(line.subGameId, cat.id);
                    const isUpDir = cat.level < currentLevel;
                    const isDownDir = cat.level > currentLevel;
                    const isDisabled = isCurrent || (catAvail === 0 && changeType !== 'individual');
                    const isSelected = targetCatId === cat.id;

                    return (
                      <button key={cat.id} disabled={isDisabled}
                        onClick={() => setTargetCatId(cat.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left
                          ${isCurrent ? 'bg-muted/50 opacity-60 cursor-not-allowed' : isSelected ? 'border-accent bg-accent/10' : isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent/50 cursor-pointer'}
                        `}
                        style={{ borderColor: isSelected ? '#C9A84C' : undefined }}>
                        <div className="flex items-center gap-3">
                          {isUpDir && <ArrowUp size={14} style={{ color: '#0D9488' }} />}
                          {isDownDir && <ArrowDown size={14} className="text-warning" />}
                          {isCurrent && <span className="w-3.5" />}
                          <span className="font-body text-sm text-foreground">
                            {cat.label} (Level {cat.level})
                          </span>
                          {isCurrent && <span className="px-2 py-0.5 rounded-full bg-muted font-body text-[10px] text-muted-foreground">Current</span>}
                        </div>
                        <span className={`font-mono text-[12px] ${catAvail > 0 ? 'text-success' : 'text-destructive'}`}>
                          {catAvail} available
                        </span>
                      </button>
                    );
                  })}
                </div>

                {isHighest && (
                  <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 flex items-start gap-2">
                    <Info size={14} className="text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-sm text-foreground">
                        {line.categoryLabel} is already the highest category for the {sgName} session.
                      </p>
                      {otherSubGames.length > 0 && (
                        <p className="font-body text-[12px] text-muted-foreground mt-1">
                          Consider upgrading to a different session (e.g. {otherSubGames[0].name}) instead.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cross-sub-game note */}
              <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-start gap-2">
                <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-[12px] text-foreground">
                    Category changes apply within the same session ({sgName}).
                  </p>
                  <p className="font-body text-[12px] text-muted-foreground">
                    Changing to a different session requires cancelling this line and creating a new one.
                  </p>
                </div>
              </div>

              {/* Cross-sub-game scenario banner */}
              {otherSubGames.length > 0 && (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                  <p className="font-body text-[12px] text-foreground mb-2">
                    Need tickets from a different session? {otherSubGames.map(sg => sg.name).join(', ')} categories are not upgrades — they are different physical sessions.
                  </p>
                  <button onClick={onClose}
                    className="px-3 py-1.5 rounded-lg font-body text-[11px] font-medium border border-accent text-accent hover:bg-accent/10 transition-colors">
                    Cancel &amp; Add New Line
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ── Step 2: Preview ── */
            <>
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h3 className="font-body text-sm font-bold text-foreground">Change Preview</h3>
                <div className="space-y-1.5">
                  <p className="font-body text-sm text-foreground">Session: <span className="font-medium">{sgName}</span> remains unchanged</p>
                  <p className="font-body text-sm text-foreground">
                    Category: <span className="font-medium">{line.categoryLabel}</span> → <span className="font-bold" style={{ color: isUpgrade ? '#0D9488' : '#D97706' }}>{targetCat?.label}</span>
                    <span className="text-muted-foreground"> (same session, different seating tier)</span>
                  </p>
                  <p className="font-body text-sm text-foreground">Tickets: <span className="font-mono font-bold">{qty}</span></p>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <h3 className="font-body text-sm font-bold text-foreground">Allocation Preview</h3>
                <p className="font-body text-[13px] text-foreground">
                  • {qty} {targetCat?.label} units from {sgName} pool
                  {availableUnits.length >= 2 && `: ${availableUnits[0]?.id}–${availableUnits[availableUnits.length - 1]?.id}`}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Query: subGameId='{line.subGameId}' AND categoryId='{targetCatId}' AND status='AVAILABLE'
                </p>
              </div>

              {changeType === 'partial' && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="font-body text-sm text-foreground">
                    Remaining {line.qty - qty} tickets stay as {line.categoryLabel} in {sgName}
                  </p>
                  <p className="font-body text-[12px] text-muted-foreground">Both groups remain in {sgName} session</p>
                </div>
              )}

              {targetAvailable < qty && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-destructive" />
                  <p className="font-body text-sm text-destructive">
                    Only {targetAvailable} units available — need {qty}. {qty - targetAvailable} short.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!confirmed && (
          <div className="px-8 py-4 border-t border-border flex items-center justify-between shrink-0">
            {step === 'assess' ? (
              <>
                <button onClick={onClose} className="font-body text-sm text-muted-foreground hover:underline">Cancel</button>
                <button onClick={() => setStep('preview')} disabled={!targetCatId}
                  className="px-5 py-2.5 rounded-lg font-body text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
                  Preview Change →
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep('assess')} className="font-body text-sm text-muted-foreground hover:underline">← Back</button>
                <button onClick={handleConfirm} disabled={confirming || targetAvailable < qty}
                  className="px-5 py-2.5 rounded-lg font-body text-sm font-bold hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: isUpgrade ? '#0D9488' : '#D97706', color: 'white' }}>
                  {confirming ? <><Loader2 size={14} className="animate-spin mr-1 inline" /> Processing...</> : `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`}
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
