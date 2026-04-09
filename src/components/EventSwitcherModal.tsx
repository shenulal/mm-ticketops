import { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventSwitcherModal({ onClose }: { onClose: () => void }) {
  const { activeEvent, setActiveEvent, events } = useEvent();

  const handleSwitch = (event: typeof events[0]) => {
    setActiveEvent(event);
    onClose();
  };

  const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
    SELLING: { bg: 'rgba(201,168,76,0.2)', text: '#C9A84C' },
    ALLOCATING: { bg: '#DBEAFE', text: '#1E40AF' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative bg-bg-card rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-muted"><X size={18} /></button>
        <h2 className="font-display text-xl mb-4" style={{ color: '#0B2D5E' }}>Switch Active Event</h2>
        <div className="space-y-3">
          {events.map(e => {
            const isActive = e.id === activeEvent.id;
            const st = STATUS_STYLE[e.status] || STATUS_STYLE.SELLING;
            return (
              <button
                key={e.id}
                onClick={() => handleSwitch(e)}
                className="w-full text-left rounded-xl p-4 transition-all"
                style={{
                  border: `2px solid ${isActive ? '#C9A84C' : '#E5E7EB'}`,
                  backgroundColor: isActive ? '#FFFBF0' : 'white',
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-body text-sm font-bold" style={{ color: '#1A1A2E' }}>{e.name}</p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: '#6B7280' }}>{e.code}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full font-body text-[10px] font-medium" style={{ backgroundColor: st.bg, color: st.text }}>
                    {e.status}
                  </span>
                </div>
                <p className="font-body text-xs mt-2" style={{ color: '#6B7280' }}>{e.matches} {e.matches > 10 ? 'matches' : 'sessions'}</p>
                {isActive && <p className="font-body text-[11px] font-medium mt-1" style={{ color: '#C9A84C' }}>Currently active</p>}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
