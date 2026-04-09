import { useState, useRef, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useEvent } from '@/context/EventContext';
import { Upload, ClipboardPaste, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type RowStatus = 'OK' | 'WARN' | 'ERROR';

interface ParsedRow {
  raw: Record<string, string>;
  match?: string; party?: string; contract?: string; currency?: string;
  category?: string; qty?: number; price?: number; notes?: string;
  status: RowStatus; message: string; skip: boolean;
}

interface Props {
  mode: 'PURCHASE' | 'SALE';
}

const PURCHASE_COLS = ['match', 'vendor', 'contract', 'currency', 'category', 'qty', 'price', 'notes'];
const SALE_COLS = ['match', 'client', 'contract', 'currency', 'category', 'qty', 'price', 'notes'];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

export default function BulkImportTab({ mode }: Props) {
  const ctx = useAppContext();
  const { activeEvent } = useEvent();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importResult, setImportResult] = useState<{ purchases: number; lines: number; units: number } | null>(null);

  const expectedCols = mode === 'PURCHASE' ? PURCHASE_COLS : SALE_COLS;
  const partyLabel = mode === 'PURCHASE' ? 'vendor' : 'client';

  const eventMatches = useMemo(() =>
    ctx.getEvent(activeEvent.id)?.matches.filter(m => m.isActive) ?? [],
  [ctx, activeEvent.id]);

  const validateRow = (raw: Record<string, string>): ParsedRow => {
    const msgs: string[] = [];
    let status: RowStatus = 'OK';
    const matchCode = raw.match ?? '';
    const party = raw[partyLabel] ?? '';
    const contract = raw.contract ?? '';
    const currency = raw.currency ?? '';
    const category = raw.category ?? '';
    const qty = parseInt(raw.qty ?? '0');
    const price = parseFloat(raw.price ?? '0');

    if (!matchCode) { msgs.push('Missing match'); status = 'ERROR'; }
    else if (!eventMatches.some(m => m.code.toLowerCase() === matchCode.toLowerCase())) {
      msgs.push(`Unknown match "${matchCode}"`); status = 'ERROR';
    }

    if (!party) { msgs.push(`Missing ${partyLabel}`); status = 'ERROR'; }
    else {
      const found = mode === 'PURCHASE'
        ? ctx.vendors.some(v => v.name.toLowerCase() === party.toLowerCase() || v.code.toLowerCase() === party.toLowerCase())
        : ctx.clients.some(c => c.companyName.toLowerCase() === party.toLowerCase() || c.code.toLowerCase() === party.toLowerCase());
      if (!found) {
        msgs.push(`Unknown ${partyLabel} "${party}" — will create draft`);
        if (status === 'OK') status = 'WARN';
      }
    }

    if (!contract) { msgs.push('Missing contract'); status = 'ERROR'; }
    if (!category) { msgs.push('Missing category'); status = 'ERROR'; }
    if (isNaN(qty) || qty <= 0) { msgs.push('Qty must be > 0'); status = 'ERROR'; }
    if (isNaN(price) || price < 0) { msgs.push('Price must be ≥ 0'); status = 'ERROR'; }

    if (currency && !ctx.currencies.some(c => c.code.toLowerCase() === currency.toLowerCase() && c.isActive)) {
      msgs.push(`Unknown currency "${currency}"`);
      if (status === 'OK') status = 'WARN';
    }

    return { raw, match: matchCode, party, contract, currency, category, qty, price, notes: raw.notes, status, message: msgs.join('; ') || 'Valid', skip: false };
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) { toast.error('No data rows found'); return; }
      setRows(parsed.map(validateRow));
      setDone(false);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { toast.error('Clipboard is empty'); return; }
      const parsed = parseCSV(text);
      if (parsed.length === 0) { toast.error('No data rows found. Expected CSV with headers: ' + expectedCols.join(', ')); return; }
      setRows(parsed.map(validateRow));
      setDone(false);
      setImportResult(null);
    } catch {
      toast.error('Unable to read clipboard — please paste CSV text into the textarea below');
    }
  };

  const toggleSkip = (i: number) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, skip: !r.skip } : r));
  };

  const importable = rows.filter(r => !r.skip && r.status !== 'ERROR');
  const errorCount = rows.filter(r => r.status === 'ERROR').length;
  const warnCount = rows.filter(r => r.status === 'WARN' && !r.skip).length;

  const handleImport = async () => {
    setImporting(true);
    await new Promise(r => setTimeout(r, 1500));
    // Group by party + contract + match
    const groups = new Map<string, ParsedRow[]>();
    importable.forEach(r => {
      const key = `${r.party}|${r.contract}|${r.match}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });
    const totalUnits = importable.reduce((s, r) => s + (r.qty ?? 0), 0);
    setImportResult({ purchases: groups.size, lines: importable.length, units: totalUnits });
    setImporting(false);
    setDone(true);
    toast.success(`Imported ${importable.length} lines into ${groups.size} ${mode === 'PURCHASE' ? 'purchase' : 'sale'}(s)`);
  };

  const STATUS_ICON = {
    OK: <CheckCircle size={14} className="text-emerald-600" />,
    WARN: <AlertTriangle size={14} className="text-amber-600" />,
    ERROR: <XCircle size={14} className="text-destructive" />,
  };

  if (done && importResult) {
    return (
      <div className="max-w-[700px] mx-auto mt-8">
        <div className="bg-card rounded-2xl shadow-sm border p-8 text-center space-y-4">
          <CheckCircle size={48} className="text-emerald-600 mx-auto" />
          <h2 className="font-heading text-xl text-foreground">Import Complete</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="font-heading text-2xl text-primary">{importResult.purchases}</p>
              <p className="font-body text-xs text-muted-foreground">{mode === 'PURCHASE' ? 'Purchases' : 'Sales'} created</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="font-heading text-2xl text-primary">{importResult.lines}</p>
              <p className="font-body text-xs text-muted-foreground">Lines</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="font-heading text-2xl text-primary">{importResult.units}</p>
              <p className="font-body text-xs text-muted-foreground">Units generated</p>
            </div>
          </div>
          <button onClick={() => { setRows([]); setDone(false); setImportResult(null); }}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90">
            Import More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload area */}
      {rows.length === 0 && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center space-y-4">
            <p className="font-body text-sm text-muted-foreground">
              Upload a CSV or paste from clipboard. Expected columns:
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {expectedCols.map(c => (
                <span key={c} className="px-2 py-1 rounded bg-primary/10 font-mono text-[11px] text-primary font-medium">{c}</span>
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium cursor-pointer hover:opacity-90">
                <Upload size={14} /> Upload CSV
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
              <button onClick={handlePaste}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border font-body text-sm font-medium text-foreground hover:bg-muted">
                <ClipboardPaste size={14} /> Paste from Clipboard
              </button>
            </div>
          </div>

          {/* Manual paste fallback */}
          <div>
            <label className="block font-body text-xs font-medium text-foreground mb-1.5">Or paste CSV text directly:</label>
            <textarea rows={5} placeholder={expectedCols.join(',') + '\nM01,poxami,2025-100129,AED,Top Cat 1,10,27525,Block C'}
              className="w-full px-3 py-2.5 rounded-lg font-mono text-xs border border-border outline-none focus:ring-1 focus:ring-accent bg-card resize-none"
              onBlur={e => {
                if (e.target.value.trim()) {
                  const parsed = parseCSV(e.target.value);
                  if (parsed.length > 0) setRows(parsed.map(validateRow));
                }
              }} />
          </div>
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && !done && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-body text-sm font-semibold text-foreground">Validation Preview</h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 font-body text-[11px] text-primary font-medium">{rows.length} rows</span>
            </div>
            <button onClick={() => setRows([])} className="font-body text-xs text-muted-foreground hover:underline">Clear</button>
          </div>

          <div className="flex gap-3 text-[12px] font-body">
            <span className="flex items-center gap-1 text-emerald-700"><CheckCircle size={12} /> {rows.filter(r => r.status === 'OK').length} OK</span>
            <span className="flex items-center gap-1 text-amber-700"><AlertTriangle size={12} /> {warnCount} Warnings</span>
            <span className="flex items-center gap-1 text-destructive"><XCircle size={12} /> {errorCount} Errors</span>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-3 py-2 font-body text-[11px] font-semibold text-muted-foreground w-8">#</th>
                    <th className="px-3 py-2 font-body text-[11px] font-semibold text-muted-foreground w-10">Status</th>
                    {expectedCols.map(c => (
                      <th key={c} className="px-3 py-2 font-body text-[11px] font-semibold text-muted-foreground capitalize">{c}</th>
                    ))}
                    <th className="px-3 py-2 font-body text-[11px] font-semibold text-muted-foreground">Message</th>
                    <th className="px-3 py-2 font-body text-[11px] font-semibold text-muted-foreground w-12">Skip</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={`border-b border-border/50 ${row.skip ? 'opacity-40' : ''} ${
                      row.status === 'ERROR' ? 'bg-destructive/5' : row.status === 'WARN' ? 'bg-amber-50' : ''
                    }`}>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2">{STATUS_ICON[row.status]}</td>
                      {expectedCols.map(c => (
                        <td key={c} className="px-3 py-2 font-body text-[12px] text-foreground">{row.raw[c] ?? ''}</td>
                      ))}
                      <td className="px-3 py-2 font-body text-[11px] text-muted-foreground max-w-[200px] truncate" title={row.message}>{row.message}</td>
                      <td className="px-3 py-2 text-center">
                        {row.status !== 'ERROR' && (
                          <input type="checkbox" checked={row.skip} onChange={() => toggleSkip(i)} className="rounded" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import button */}
          <div className="flex items-center justify-between">
            <p className="font-body text-sm text-muted-foreground">
              {importable.length} row{importable.length !== 1 ? 's' : ''} will be imported
              {warnCount > 0 && ` (${warnCount} with warnings)`}
            </p>
            <button onClick={handleImport} disabled={importing || importable.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent to-[hsl(40_55%_65%)] text-primary font-body text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {importing ? <><Loader2 size={14} className="animate-spin" /> Importing...</> : `Import ${importable.length} Rows`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
