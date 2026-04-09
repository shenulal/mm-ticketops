import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MOCK_USERS } from '@/data/mockData';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, CheckCircle, Shield, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const DEMO_ACCOUNTS = [
  { email: 'admin@ticketops.ae', name: 'Alex Rahman', badge: 'Super Admin',
    badgeBg: 'rgba(220,38,38,0.2)', badgeBorder: 'rgba(220,38,38,0.4)', badgeText: '#FCA5A5' },
  { email: 'manager@ticketops.ae', name: 'Sara Al Mansoori', badge: 'Ops Manager',
    badgeBg: 'rgba(139,92,246,0.2)', badgeBorder: 'rgba(139,92,246,0.4)', badgeText: '#DDD6FE' },
  { email: 'sroperator@ticketops.ae', name: 'James Patel', badge: 'Sr. Operator',
    badgeBg: 'rgba(59,130,246,0.2)', badgeBorder: 'rgba(59,130,246,0.4)', badgeText: '#93C5FD' },
  { email: 'operator@ticketops.ae', name: 'Priya Nair', badge: 'Operator',
    badgeBg: 'rgba(20,184,166,0.2)', badgeBorder: 'rgba(20,184,166,0.4)', badgeText: '#99F6E4' },
  { email: 'staff@ticketops.ae', name: 'Mohammed Hassan', badge: 'Staff',
    badgeBg: 'rgba(245,158,11,0.2)', badgeBorder: 'rgba(245,158,11,0.4)', badgeText: '#FDE68A' },
  { email: 'client@roadtrips.ae', name: 'David Clarke', badge: 'Client',
    badgeBg: 'rgba(34,197,94,0.2)', badgeBorder: 'rgba(34,197,94,0.4)', badgeText: '#86EFAC' },
  { email: 'supplier@poxami.com', name: 'Clara Dufresne', badge: 'Supplier',
    badgeBg: 'rgba(249,115,22,0.2)', badgeBorder: 'rgba(249,115,22,0.4)', badgeText: '#FDBA74' },
];

const PILLS = [
  { icon: CheckCircle, label: 'Multi-Event Architecture' },
  { icon: Shield, label: '6-Tier RBAC Security' },
  { icon: Zap, label: 'Real-Time Allocation' },
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
    await new Promise(r => setTimeout(r, 600));
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) { setError(true); setLoading(false); return; }
    login(email);
    setLoading(false);
    if (user.role === 'staff') navigate('/staff-queue');
    else if (user.role === 'client') navigate('/client-portal/demo-token-123');
    else if (user.role === 'supplier') navigate('/supplier');
    else navigate('/dashboard');
  };

  const handleDemoClick = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword('password');
    setError(false);
    toast(`Click Sign In to continue as ${account.name}`, {
      style: {
        background: '#1A2535',
        borderLeft: '3px solid #C9A84C',
        color: '#F5F0E8',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
      },
      position: 'bottom-right',
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── LEFT PANEL — Visual Immersive ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden md:flex w-[55%] relative overflow-hidden"
      >
        {/* Stadium image */}
        <img
          src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.45) saturate(1.2)' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80';
          }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(11,45,94,0.85) 0%, rgba(11,45,94,0.4) 50%, rgba(0,0,0,0.7) 100%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(11,45,94,0.95) 0%, transparent 40%)',
        }} />

        {/* Noise texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }} />

        {/* Light sweep animation */}
        <div className="absolute top-0 left-0 w-[40%] h-full pointer-events-none" style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          animation: 'lightSweep 6s ease-in-out infinite 2s',
        }} />

        {/* Logo — top left */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute top-8 left-8 z-10 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-2xl font-semibold"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
              border: '2px solid rgba(201,168,76,0.4)',
              color: '#0B2D5E',
              boxShadow: '0 0 24px rgba(201,168,76,0.3)',
            }}>T</div>
          <div>
            <span className="font-display text-[22px] text-white block leading-tight">TicketOps</span>
            <span className="text-[11px] tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Enterprise Ticket Platform
            </span>
          </div>
        </motion.div>

        {/* Bottom content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute bottom-10 left-10 right-10 z-10"
        >
          <p className="font-body text-[10px] tracking-[0.15em] uppercase mb-4"
            style={{ color: 'rgba(201,168,76,0.8)' }}>
            Trusted by operators across the UAE &amp; GCC
          </p>

          <h2 className="font-display leading-[1.1] mb-3" style={{ fontSize: '52px', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
            <span className="text-white block">Every ticket.</span>
            <span style={{ color: '#C9A84C' }} className="block">Tracked.</span>
            <span className="text-white block">Delivered.</span>
          </h2>

          <p className="font-body text-[15px] leading-relaxed max-w-[420px] mb-7"
            style={{ color: 'rgba(255,255,255,0.65)' }}>
            Purpose-built for FIFA World Cup, Formula 1, concerts, and major events.
          </p>

          {/* Feature pills */}
          <div className="flex gap-2 flex-wrap mb-5">
            {PILLS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-body text-[12px]"
                style={{
                  backdropFilter: 'blur(8px)',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: 'rgba(255,255,255,0.8)',
                }}>
                <Icon size={12} style={{ color: '#C9A84C' }} />
                {label}
              </span>
            ))}
          </div>

          {/* Event ticker */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] tracking-[0.12em] uppercase font-body" style={{ color: '#C9A84C' }}>Active Events</span>
            <div className="flex gap-2">
              {[
                { code: 'FIFA WC 2026', status: 'SELLING', dot: '#22C55E' },
                { code: 'F1 SGP 2026', status: 'ALLOCATING', dot: '#F59E0B' },
              ].map(ev => (
                <span key={ev.code} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body text-[11px]"
                  style={{
                    background: 'rgba(201,168,76,0.15)',
                    border: '1px solid rgba(201,168,76,0.3)',
                    color: '#C9A84C',
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.dot }} />
                  {ev.code}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── RIGHT PANEL — Login Form ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 flex flex-col relative overflow-y-auto"
        style={{
          backgroundColor: '#0F1923',
          backgroundImage: 'radial-gradient(ellipse 60% 40% at 100% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
          borderLeft: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        {/* Decorative dots — top right */}
        <svg className="absolute top-0 right-0 pointer-events-none opacity-60" width="120" height="120" viewBox="0 0 120 120">
          {Array.from({ length: 36 }, (_, i) => (
            <circle key={i} cx={15 + (i % 6) * 18} cy={15 + Math.floor(i / 6) * 18} r="1.5"
              fill="rgba(201,168,76,0.08)" />
          ))}
        </svg>

        {/* Decorative arc — bottom left */}
        <svg className="absolute bottom-0 left-0 pointer-events-none" width="200" height="200" viewBox="0 0 200 200">
          <path d="M 0 200 A 200 200 0 0 1 200 0" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </svg>

        {/* Powered by */}
        <div className="flex justify-end px-8 pt-6">
          <div className="text-right">
            <span className="text-[10px] tracking-[0.08em] uppercase block" style={{ color: 'rgba(255,255,255,0.3)' }}>Powered by</span>
            <span className="font-body text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>HelloPixels Digital Agency</span>
          </div>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-8 md:px-12 py-6">
          <div className="w-full max-w-[400px]">
            {/* Form header */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h1 className="font-display text-[36px]" style={{ color: '#F5F0E8' }}>Welcome back</h1>
              <div className="w-10 h-0.5 my-3" style={{ backgroundColor: '#C9A84C' }} />
              <p className="font-body text-[14px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Sign in to continue</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <label className="block font-body text-[12px] tracking-[0.08em] uppercase mb-2"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    type="email"
                    aria-label="Email address"
                    autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(false); }}
                    placeholder="you@company.ae"
                    className="w-full h-12 pl-11 pr-4 rounded-[10px] font-body text-[14px] outline-none transition-all duration-200"
                    style={{
                      backgroundColor: error ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${error ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.12)'}`,
                      color: '#F5F0E8',
                    }}
                    onFocus={e => {
                      if (!error) {
                        e.target.style.borderColor = 'rgba(201,168,76,0.6)';
                        e.target.style.backgroundColor = 'rgba(201,168,76,0.04)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.1)';
                      }
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = error ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.12)';
                      e.target.style.backgroundColor = error ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.06)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <label className="block font-body text-[12px] tracking-[0.08em] uppercase mb-2"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    aria-label="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 pl-11 pr-12 rounded-[10px] font-body text-[14px] outline-none transition-all duration-200"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#F5F0E8',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(201,168,76,0.6)';
                      e.target.style.backgroundColor = 'rgba(201,168,76,0.04)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.06)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(201,168,76,0.8)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </motion.div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <button type="button" className="font-body text-[12px] hover:underline" style={{ color: '#C9A84C' }}>
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={14} style={{ color: '#FCA5A5' }} />
                  <p className="font-body text-[13px]" style={{ color: '#FCA5A5' }}>
                    Invalid credentials. Try a demo account below.
                  </p>
                </div>
              )}

              {/* Sign In button */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <button type="submit" disabled={loading}
                  className="w-full h-[52px] rounded-xl font-body text-[15px] font-semibold tracking-[0.02em] flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    background: loading ? '#B8972E' : 'linear-gradient(135deg, #C9A84C, #E8C56A)',
                    color: '#0B2D5E',
                    boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.45)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,168,76,0.3)';
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                  ) : (
                    <>Sign In <ArrowRight size={18} /></>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <span className="font-body text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>or use a demo account</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Demo label */}
            <p className="font-body text-[11px] tracking-[0.12em] uppercase mb-3"
              style={{ color: 'rgba(255,255,255,0.3)' }}>Demo Accounts</p>

            {/* Demo grid */}
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account, i) => {
                const isSelected = email === account.email;
                return (
                  <motion.button
                    key={account.email}
                    type="button"
                    role="button"
                    tabIndex={0}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + i * 0.05 }}
                    onClick={() => handleDemoClick(account)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleDemoClick(account); }}
                    className="text-left rounded-[10px] p-3 transition-all duration-150 group"
                    style={{
                      backgroundColor: isSelected ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isSelected ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div className="flex justify-end mb-1.5">
                      <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium"
                        style={{ backgroundColor: account.badgeBg, border: `1px solid ${account.badgeBorder}`, color: account.badgeText }}>
                        {account.badge}
                      </span>
                    </div>
                    <p className="font-body text-[13px] font-medium mt-1" style={{ color: '#F5F0E8' }}>{account.name}</p>
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{account.email}</p>
                    <p className="font-body text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>••••••••</p>
                    <p className="font-body text-[10px] mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'rgba(201,168,76,0.6)' }}>→ Login as this user</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="font-body text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Secured by HelloPixels Digital Agency · UAE
          </span>
          <span className="flex items-center gap-1 font-body text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <Lock size={10} /> SSL Encrypted
          </span>
        </div>
      </motion.div>

      {/* Light sweep keyframe */}
      <style>{`
        @keyframes lightSweep {
          0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          20%  { opacity: 0.06; }
          100% { transform: translateX(300%) skewX(-15deg); opacity: 0; }
        }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
        input:focus-visible { box-shadow: 0 0 0 2px #C9A84C; outline: none; }
      `}</style>
    </div>
  );
}
