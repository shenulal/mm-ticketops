import { TooltipProps } from 'recharts';

export const AED = (v: number, currency: 'AED' | 'USD' = 'AED') => {
  const val = currency === 'USD' ? Math.round(v / 3.67) : v;
  const cur = currency;
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
};

export const shortAED = (v: number, currency: 'AED' | 'USD' = 'AED') => {
  const val = currency === 'USD' ? Math.round(v / 3.67) : v;
  const c = currency;
  if (val >= 1000000) return `${c} ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${c} ${(val / 1000).toFixed(0)}K`;
  return `${c} ${val}`;
};

export const CHART_COLORS = {
  navy: '#0B2D5E',
  gold: '#C9A84C',
  green: '#1A7A4A',
  red: '#DC2626',
  amber: '#D97706',
  blue: '#1A5CA8',
  grey: '#6B7280',
  lightGrey: '#E5E7EB',
  teal: '#0D9488',
};

export function ChartCard({ title, subtitle, children, height = 280, className = '' }: {
  title: string; subtitle?: string; children: React.ReactNode; height?: number; className?: string;
}) {
  return (
    <div className={`bg-card rounded-2xl shadow-sm border border-border p-5 ${className}`}>
      <p className="font-body text-[15px] font-semibold mb-0.5" style={{ color: CHART_COLORS.navy }}>{title}</p>
      {subtitle && <p className="font-body text-[12px] text-muted-foreground mb-4">{subtitle}</p>}
      <div style={{ height }}>{children}</div>
    </div>
  );
}

export function EmptyChart({ onClear }: { onClear?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
      <p className="font-body text-sm">No data for selected filters</p>
      {onClear && <button onClick={onClear} className="font-body text-xs text-primary hover:underline">Clear Filters</button>}
    </div>
  );
}

export const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: 'white',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
  padding: '10px 14px',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '13px',
};
