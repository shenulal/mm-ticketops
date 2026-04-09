/* @refresh reset */
import React, { createContext, useContext, useState } from 'react';
import { useAppContext, type EventDef } from '@/context/AppContext';

interface EventContextType {
  activeEvent: EventDef;
  setActiveEvent: (event: EventDef) => void;
  events: EventDef[];
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { events } = useAppContext();
  const [activeEvent, setActiveEvent] = useState<EventDef>(events[0]);

  return (
    <EventContext.Provider value={{ activeEvent, setActiveEvent, events }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvent must be used within EventProvider');
  return ctx;
};
