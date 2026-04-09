import React, { useState, useMemo, useCallback, type ReactNode } from 'react';
import { Search, ChevronDown, MoreHorizontal, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

// ─── Types ───────────────────────────────────────────────
export type SortOption = { label: string; value: string };
export type FilterDef = { id: string; label: string; options: { value: string; label: string }[] };
export type StatusFilter = 'active' | 'all' | 'inactive';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface MasterPageProps<T> {
  title: string;
  entityName: string;
  data: T[];
  columns: ColumnDef<T>[];
  filters?: FilterDef[];
  searchFields: (row: T) => string;
  getId: (row: T) => string;
  getIsActive: (row: T) => boolean;
  renderDrawer: (row: T, onClose: () => void) => ReactNode;
  renderCreateModal: (onClose: () => void) => ReactNode;
  writeRoles?: string[];
  readRoles?: string[];
  extraHeaderContent?: ReactNode;
  headerNote?: string;
}

// ─── Hook for filtering/sorting ─────────────────────────
export function useMasterFilters<T>(
  data: T[],
  searchFields: (row: T) => string,
  getIsActive: (row: T) => boolean,
  getName?: (row: T) => string,
) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [sortBy, setSortBy] = useState('name-asc');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const setFilter = useCallback((id: string, value: string) => {
    setFilters(prev => ({ ...prev, [id]: value }));
  }, []);

  const filtered = useMemo(() => {
    let result = [...data];
    // Status filter
    if (statusFilter === 'active') result = result.filter(r => getIsActive(r));
    else if (statusFilter === 'inactive') result = result.filter(r => !getIsActive(r));
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => searchFields(r).toLowerCase().includes(q));
    }
    // Sort
    if (getName) {
      if (sortBy === 'name-asc') result.sort((a, b) => getName(a).localeCompare(getName(b)));
      else if (sortBy === 'name-desc') result.sort((a, b) => getName(b).localeCompare(getName(a)));
      else if (sortBy === 'active-first') result.sort((a, b) => (getIsActive(b) ? 1 : 0) - (getIsActive(a) ? 1 : 0));
    }
    return result;
  }, [data, search, statusFilter, sortBy, filters, searchFields, getIsActive, getName]);

  return { search, setSearch, statusFilter, setStatusFilter, sortBy, setSortBy, filters, setFilter, filtered };
}

// ─── Master Page Component ──────────────────────────────
export default function MasterPage<T>({
  title, entityName, data, columns, filters: filterDefs, searchFields,
  getId, getIsActive, renderDrawer, renderCreateModal, writeRoles, extraHeaderContent, headerNote,
}: MasterPageProps<T>) {
  const { currentUser } = useAuth();
  const canWrite = writeRoles ? writeRoles.includes(currentUser?.role ?? '') : true;

  const [drawerRow, setDrawerRow] = useState<T | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [sortBy, setSortBy] = useState('name-asc');

  const filtered = useMemo(() => {
    let result = [...data];
    if (statusFilter === 'active') result = result.filter(r => getIsActive(r));
    else if (statusFilter === 'inactive') result = result.filter(r => !getIsActive(r));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => searchFields(r).toLowerCase().includes(q));
    }
    // Custom filters
    if (filterDefs) {
      filterDefs.forEach(f => {
        const val = filterValues[f.id];
        if (val && val !== 'all') {
          result = result.filter(r => {
            const row = r as Record<string, unknown>;
            return String(row[f.id] ?? '').toLowerCase() === val.toLowerCase();
          });
        }
      });
    }
    return result;
  }, [data, statusFilter, search, filterValues, filterDefs, searchFields, getIsActive]);

  const statusPill = (s: StatusFilter, label: string) => (
    <button
      onClick={() => setStatusFilter(s)}
      className={`px-3 py-1.5 rounded-full text-[12px] font-body font-medium transition-colors ${
        statusFilter === s
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative">
      {/* Header */}
      {headerNote && (
        <p className="font-body text-[13px] text-muted-foreground italic mb-4">{headerNote}</p>
      )}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[26px] text-primary">{title}</h1>
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[12px] font-body font-medium">
            {filtered.length} records
          </span>
        </div>
        {canWrite && (
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90 transition-opacity"
          >
            + Add {entityName}
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${entityName.toLowerCase()}s...`}
            className="w-[280px] h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-[13px] font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {filterDefs?.map(f => (
          <select
            key={f.id}
            value={filterValues[f.id] ?? 'all'}
            onChange={e => setFilterValues(prev => ({ ...prev, [f.id]: e.target.value }))}
            className="h-9 px-3 rounded-lg border border-border bg-card text-[13px] font-body text-foreground"
          >
            <option value="all">{f.label}: All</option>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-card text-[13px] font-body text-foreground"
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="active-first">Active First</option>
        </select>
        <div className="flex gap-1">
          {statusPill('active', 'Active')}
          {statusPill('all', 'All')}
          {statusPill('inactive', 'Inactive')}
        </div>
        {extraHeaderContent}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-primary">
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left text-[11px] font-body font-semibold text-primary-foreground uppercase tracking-wider" style={col.width ? { width: col.width } : undefined}>
                    {col.header}
                  </th>
                ))}
                <th className="px-4 py-3 w-[60px]" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-muted-foreground font-body text-sm">No {entityName.toLowerCase()}s found.</td></tr>
              ) : filtered.map((row, i) => (
                <tr
                  key={getId(row)}
                  onClick={() => setDrawerRow(row)}
                  className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/40 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-[13px] font-body text-foreground">
                      {col.render(row)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <button className="text-muted-foreground hover:text-foreground" onClick={e => { e.stopPropagation(); setDrawerRow(row); }}>
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {drawerRow && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-foreground/30" onClick={() => setDrawerRow(null)} />
            <motion.div
              initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-[480px] h-full bg-card border-l border-border shadow-xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-display text-lg text-primary">{entityName} Details</h2>
                <button onClick={() => setDrawerRow(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="p-6">
                {renderDrawer(drawerRow, () => setDrawerRow(null))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-foreground/30" onClick={() => setCreateOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-card rounded-2xl shadow-xl overflow-y-auto mx-4"
            >
              <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-display text-lg text-primary">Add {entityName}</h2>
                <button onClick={() => setCreateOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="p-6">
                {renderCreateModal(() => setCreateOpen(false))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shared UI helpers ──────────────────────────────────
export function FieldRow({ label, value, children }: { label: string; value?: string | ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/50">
      <span className="text-[12px] font-body text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className="text-[13px] font-body text-foreground text-right max-w-[60%]">{children ?? value}</span>
    </div>
  );
}

export function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3">
      <h3 className="text-[14px] font-body font-semibold text-primary">{title}</h3>
      {count !== undefined && <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-body">{count}</span>}
    </div>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-body font-medium ${active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-success' : 'bg-muted-foreground'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export function TypeBadge({ type, colorMap }: { type: string; colorMap?: Record<string, { bg: string; text: string }> }) {
  const colors = colorMap?.[type] ?? { bg: 'bg-muted', text: 'text-muted-foreground' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${colors.bg} ${colors.text}`}>
      {type}
    </span>
  );
}

export function FormField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-body font-medium text-foreground uppercase tracking-wide">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] font-body text-destructive">{error}</p>}
    </div>
  );
}

export const inputCls = "w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
export const selectCls = inputCls;
export const textareaCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none";
