import { useNavigate } from 'react-router-dom';
import { MOCK_EVENTS } from '@/data/mockData';

const STATUS_MAP: Record<string, { bg: string; text: string }> = {
  SELLING: { bg: 'rgba(201,168,76,0.2)', text: '#C9A84C' },
  ALLOCATING: { bg: '#DBEAFE', text: '#1E40AF' },
};

export default function EventsPage() {
  const navigate = useNavigate();
  return (
    <div>
      <h1 className="font-display text-[26px] mb-5" style={{ color: '#0B2D5E' }}>Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_EVENTS.map(e => {
          const st = STATUS_MAP[e.status] || STATUS_MAP.SELLING;
          return (
            <div key={e.id} className="bg-bg-card rounded-xl shadow-sm p-5 border cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: '#E5E7EB' }}
              onClick={() => navigate(`/events/${e.code.toLowerCase()}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-xl" style={{ color: '#0B2D5E' }}>{e.name}</h3>
                  <p className="font-mono text-xs mt-1" style={{ color: '#6B7280' }}>{e.code}</p>
                </div>
                <span className="px-3 py-1 rounded-full font-body text-xs font-medium" style={{ backgroundColor: st.bg, color: st.text }}>{e.status}</span>
              </div>
              <p className="font-body text-sm" style={{ color: '#6B7280' }}>{e.matches} matches</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
