import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MOCK_USERS } from '@/data/mockData';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  { email: 'admin@ticketops.ae', name: 'Alex Rahman', badge: 'Super Admin', badgeBg: '#FEE2E2', badgeText: '#991B1B' },
  { email: 'manager@ticketops.ae', name: 'Sara Al Mansoori', badge: 'Ops Manager', badgeBg: '#EDE9FE', badgeText: '#5B21B6' },
  { email: 'sroperator@ticketops.ae', name: 'James Patel', badge: 'Sr. Operator', badgeBg: '#DBEAFE', badgeText: '#1E40AF' },
  { email: 'operator@ticketops.ae', name: 'Priya Nair', badge: 'Operator', badgeBg: '#CCFBF1', badgeText: '#0F766E' },
  { email: 'staff@ticketops.ae', name: 'Mohammed Hassan', badge: 'Staff', badgeBg: '#FEF3C7', badgeText: '#92400E' },
  { email: 'client@roadtrips.ae', name: 'David Clarke (Roadtrips)', badge: 'Client', badgeBg: '#D1FAE5', badgeText: '#065F46' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) {
      setError(true);
      setLoading(false);
      return;
    }

    login(email);
    setLoading(false);

    if (user.role === 'staff') navigate('/staff-queue');
    else if (user.role === 'client') navigate('/client-portal/demo-token-123');
    else navigate('/dashboard');
  };

  const handleDemoClick = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword('password');
    setError(false);
    toast(`Click Sign In to continue as ${account.name}`, {
      style: {
        background: 'white',
        borderLeft: '4px solid #C9A84C',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
      },
      position: 'bottom-right',
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div
        className="hidden lg:flex w-[45%] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          backgroundColor: '#0B2D5E',
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            rgba(201,168,76,0.06) 40px,
            rgba(201,168,76,0.06) 41px
          )`,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-display text-lg" style={{ backgroundColor: '#C9A84C', color: '#0B2D5E', fontWeight: 700 }}>T</div>
          <span className="font-display text-[22px]" style={{ color: 'white' }}>TicketOps</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <p className="font-body text-[11px] tracking-[0.15em] uppercase" style={{ color: '#C9A84C' }}>
            Enterprise Ticket Operations
          </p>
          <h2 className="font-display text-[52px] leading-[1.1]">
            <span style={{ color: 'white' }}>Every ticket.</span>
            <br />
            <span style={{ color: '#C9A84C' }}>Tracked. Delivered.</span>
          </h2>
          <p className="font-body text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Purpose-built for UAE &amp; GCC event operators.
          </p>
          <div className="flex gap-3 flex-wrap">
            {['6-Tier RBAC', 'Real-time Allocation', 'Multi-Event Ready'].map(label => (
              <span
                key={label}
                className="px-3 py-1.5 rounded-full font-body text-xs"
                style={{
                  border: '1px solid rgba(201,168,76,0.4)',
                  backgroundColor: 'rgba(201,168,76,0.1)',
                  color: '#C9A84C',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['AR', 'SM', 'JP'].map((initials, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border-2"
                style={{
                  backgroundColor: 'rgba(201,168,76,0.25)',
                  color: '#C9A84C',
                  borderColor: '#0B2D5E',
                }}
              >
                {initials}
              </div>
            ))}
          </div>
          <span className="font-body text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Trusted by event operators across the UAE and GCC
          </span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: '#F8F9FC' }}>
        {/* Powered by */}
        <div className="flex justify-end p-5">
          <span className="font-body text-[13px]" style={{ color: '#6B7280' }}>
            Powered by <span className="font-medium">HelloPixels Digital Agency</span>
          </span>
        </div>

        {/* Login Card */}
        <div className="flex-1 flex items-center justify-center px-6 pb-10">
          <div className="w-full max-w-[420px] bg-bg-card rounded-xl shadow-sm p-8">
            <h1 className="font-display text-[32px]" style={{ color: '#0B2D5E' }}>Welcome back</h1>
            <p className="font-body text-sm mt-1" style={{ color: '#6B7280' }}>Sign in to TicketOps</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block font-body text-sm font-medium" style={{ color: '#1A1A2E' }}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(false); }}
                  placeholder="you@company.ae"
                  className="w-full px-3 py-2.5 rounded-lg font-body text-sm outline-none transition-colors"
                  style={{
                    border: `1.5px solid ${error ? '#DC2626' : '#E5E7EB'}`,
                    backgroundColor: 'white',
                    color: '#1A1A2E',
                  }}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block font-body text-sm font-medium" style={{ color: '#1A1A2E' }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-lg font-body text-sm outline-none pr-10"
                    style={{ border: '1.5px solid #E5E7EB', backgroundColor: 'white', color: '#1A1A2E' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#6B7280' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div className="flex justify-end">
                <button type="button" className="font-body text-[13px] hover:underline" style={{ color: '#C9A84C' }}>
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="font-body text-[13px]" style={{ color: '#DC2626' }}>
                  Invalid credentials. Try a demo account below.
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-body text-sm font-bold transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: loading ? '#0d3875' : '#0B2D5E',
                  color: '#C9A84C',
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#0d3875')}
                onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#0B2D5E')}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In &nbsp;→</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
              <span className="font-body text-xs" style={{ color: '#6B7280' }}>or use a demo account</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
            </div>

            {/* Demo accounts */}
            <p className="font-body text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#0B2D5E' }}>
              Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoClick(account)}
                  className="text-left rounded-xl p-3 transition-all duration-150 group"
                  style={{
                    border: `1.5px solid ${email === account.email ? '#C9A84C' : '#E5E7EB'}`,
                    backgroundColor: email === account.email ? '#FFFBF0' : 'white',
                  }}
                  onMouseEnter={e => {
                    if (email !== account.email) {
                      e.currentTarget.style.borderColor = '#C9A84C';
                      e.currentTarget.style.backgroundColor = '#FFFBF0';
                    }
                  }}
                  onMouseLeave={e => {
                    if (email !== account.email) {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div className="flex justify-end mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium"
                      style={{ backgroundColor: account.badgeBg, color: account.badgeText }}
                    >
                      {account.badge}
                    </span>
                  </div>
                  <p className="font-body text-sm font-medium" style={{ color: '#1A1A2E' }}>{account.name}</p>
                  <p className="font-mono text-[11px] mt-0.5" style={{ color: '#6B7280' }}>{account.email}</p>
                  <p className="font-body text-xs mt-0.5" style={{ color: '#9CA3AF' }}>••••••••</p>
                  <p className="font-body text-xs mt-1.5 group-hover:underline" style={{ color: '#C9A84C' }}>
                    Login as this user →
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
