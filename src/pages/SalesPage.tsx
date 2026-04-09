import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleGuard from '@/components/RoleGuard';
import { MOCK_SALES, MOCK_SALE_LINE_ITEMS, MOCK_MATCHES } from '@/data/mockData';
import { AlertTriangle, X } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  ALLOCATED: { label: 'ALLOCATED', bg: '#D1FAE5', text: '#065F46' },
  PENDING_APPROVAL: { label: 'PENDING', bg: '#FEF3C7', text: '#92400E' },
  UNALLOCATED: { label: 'UNALLOCATED', bg: '#F3F4F6', text: '#374151' },
  FULFILLED: { label: 'FULFILLED', bg: '#064E3B', text: '#FFFFFF' },
  PARTIAL_PENDING: { label: 'PARTIAL PENDING', bg: '#FEF3C7', text: '#92400E' },
  PARTIAL_ALLOCATED: { label: 'PARTIAL ALLOC', bg: '#DBEAFE', text: '#1E40AF' },
};

interface SaleRow {
  id: string; date: string; match: string; client: string; category: string;
  qty: number; unitPriceAed: string; totalAed: string; status: string; oversell: boolean;
  lineItemId: string;
}

function buildRows(): SaleRow[] {
  return MOCK_SALE_LINE_ITEMS.map(li => {
    const sale = MOCK_SALES.find(s => s.id === li.saleId);
    const m = MOCK_MATCHES.find(m => m.id === sale?.matchId);
    return {
      id: li.id.toUpperCase(),
      date: sale?.date ?? '',
      match: m ? m.code : sale?.matchId ?? '',
      client: sale?.client ?? '',
      category: li.categoryLabel,
      qty: li.qty,
      unitPriceAed: `AED ${li.unitPrice.toLocaleString()}`,
      totalAed: `AED ${li.lineTotal.toLocaleString()}`,
      status: li.status,
      oversell: li.oversellFlag,
      lineItemId: li.id,
    };
  });
}

function ApprovalModal({ sale, onApprove, onReject, onCancel }: {
  sale: SaleRow; onApprove: () => void; onReject: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onCancel} />
      <div className="relative bg-bg-card rounded-2xl shadow-xl max-w-lg w-full mx-4 p-8">
        <button onClick={onCancel} className="absolute top-4 right-4 p-1 rounded hover:bg-muted"><X size={18} /></button>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={22} style={{ color: '#D97706' }} />
          <h2 className="font-display text-xl" style={{ color: '#0B2D5E' }}>Approval Required — Oversell</h2>
        </div>
        <div className="rounded-lg border border-border overflow-hidden mb-4">
          <table className="w-full text-left">
            <thead>
              <tr style={{ backgroundColor: '#F8F9FC' }}>
                {['Client', 'Category', 'Requested Qty', 'Available'].map(h => (
                  <th key={h} className="px-4 py-2 font-body text-[11px] font-medium uppercase" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 font-body text-sm" style={{ color: '#1A1A2E' }}>{sale.client}</td>
                <td className="px-4 py-3 font-body text-sm" style={{ color: '#1A1A2E' }}>{sale.category}</td>
                <td className="px-4 py-3 font-mono text-sm" style={{ color: '#1A1A2E' }}>{sale.qty}</td>
                <td className="px-4 py-3"><span className="font-mono text-sm font-bold" style={{ color: '#DC2626' }}>0 (OVERSOLD)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="font-body text-sm mb-6" style={{ color: '#6B7280' }}>
          This sale will create a negative inventory of <strong style={{ color: '#DC2626' }}>-{sale.qty}</strong> for {sale.category} on {sale.match}.
        </p>
        <div className="flex gap-3">
          <button onClick={onApprove} className="flex-1 py-2.5 rounded-lg font-body text-sm font-bold transition-opacity hover:opacity-90" style={{ backgroundColor: '#D97706', color: 'white' }}>Approve Override</button>
          <button onClick={onReject} className="flex-1 py-2.5 rounded-lg font-body text-sm font-bold transition-opacity hover:opacity-90" style={{ backgroundColor: '#DC2626', color: 'white' }}>Reject Sale</button>
        </div>
        <div className="text-center mt-3">
          <button onClick={onCancel} className="font-body text-sm hover:underline" style={{ color: '#6B7280' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [matchFilter, setMatchFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
  const [approvedLines, setApprovedLines] = useState<Set<string>>(new Set());
  const [modalSale, setModalSale] = useState<SaleRow | null>(null);

  const rows = buildRows().filter(r => {
    if (hiddenLines.has(r.lineItemId)) return false;
    const effectiveStatus = approvedLines.has(r.lineItemId) ? 'ALLOCATED' : r.status;
    if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false;
    if (matchFilter !== 'all' && r.match !== matchFilter) return false;
    if (catFilter !== 'all' && r.category !== catFilter) return false;
    return true;
  });

  const selectClass = "h-[38px] px-3 rounded-lg font-body text-sm bg-bg-card border border-border outline-none focus:ring-1 focus:ring-gold";

  const handleApprove = () => {
    if (modalSale) setApprovedLines(prev => new Set(prev).add(modalSale.lineItemId));
    setModalSale(null);
  };
  const handleReject = () => {
    if (modalSale) setHiddenLines(prev => new Set(prev).add(modalSale.lineItemId));
    setModalSale(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-[26px]" style={{ color: '#0B2D5E' }}>Sales</h1>
        <RoleGuard roles={['super_admin', 'ops_manager', 'sr_operator', 'operator']}>
          <button onClick={() => navigate('/sales/new')} className="px-4 py-2 rounded-lg font-body text-sm font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: '#0B2D5E', color: '#C9A84C' }}>New Sale +</button>
        </RoleGuard>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select className={selectClass} disabled><option>FIFA WC 2026</option></select>
        <select className={selectClass} value={matchFilter} onChange={e => setMatchFilter(e.target.value)}>
          <option value="all">All Matches</option>
          {MOCK_MATCHES.map(m => <option key={m.id} value={m.code}>{m.code} — {m.teams}</option>)}
        </select>
        <select className={selectClass} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          <option>Top Cat 1</option><option>Cat 2</option><option>Cat 3</option><option>Cat 4</option>
        </select>
        <select className={selectClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="UNALLOCATED">Unallocated</option>
          <option value="ALLOCATED">Allocated</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="FULFILLED">Fulfilled</option>
        </select>
      </div>

      <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[950px]">
            <thead>
              <tr style={{ backgroundColor: '#0B2D5E', height: 44 }}>
                {['Line ID', 'Date', 'Match', 'Client', 'Category', 'Qty', 'Unit Price', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-body text-[13px] font-bold" style={{ color: 'white' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const effectiveStatus = approvedLines.has(r.lineItemId) ? 'ALLOCATED' : r.status;
                const st = STATUS_MAP[effectiveStatus] || STATUS_MAP['UNALLOCATED'];
                const isOversell = r.oversell && !approvedLines.has(r.lineItemId);
                return (
                  <React.Fragment key={r.id}>
                    {isOversell && (
                      <tr>
                        <td colSpan={10} className="px-4 py-2 font-body text-xs italic" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                          ⚠ Oversell: {r.client} requested {r.qty} {r.category} units. Awaiting manager approval.
                        </td>
                      </tr>
                    )}
                    <tr className="transition-colors"
                      style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EEF3FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? '#F8F9FC' : 'white')}>
                      <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: '#0B2D5E' }}>{r.id}</td>
                      <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.date}</td>
                      <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.match}</td>
                      <td className="px-4 py-3 font-body text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{r.client}</td>
                      <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.category}</td>
                      <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{r.qty}</td>
                      <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{r.unitPriceAed}</td>
                      <td className="px-4 py-3 font-mono text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{r.totalAed}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[11px] font-medium" style={{ backgroundColor: st.bg, color: st.text }}>
                          {isOversell && <AlertTriangle size={11} />}
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {effectiveStatus === 'PENDING_APPROVAL' ? (
                            <button onClick={() => setModalSale(r)} className="px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: '#D97706', color: 'white' }}>Review</button>
                          ) : (
                            <>
                              <button className="px-3 py-1.5 rounded-lg font-body text-xs font-medium border transition-opacity hover:opacity-90" style={{ borderColor: '#0B2D5E', color: '#0B2D5E' }}>View</button>
                              {(effectiveStatus === 'UNALLOCATED' || effectiveStatus === 'ALLOCATED') && (
                                <button className="px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: '#0B2D5E', color: 'white' }}>Allocate</button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalSale && <ApprovalModal sale={modalSale} onApprove={handleApprove} onReject={handleReject} onCancel={() => setModalSale(null)} />}
    </div>
  );
}

import React from 'react';
