import React, { createContext, useContext, useState } from 'react';
import { MOCK_EVENTS } from '@/data/mockData';

interface EventContextType {
  activeEvent: typeof MOCK_EVENTS[0];
  setActiveEvent: (event: typeof MOCK_EVENTS[0]) => void;
  events: typeof MOCK_EVENTS;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEvent, setActiveEvent] = useState(MOCK_EVENTS[0]);

  return (
    <EventContext.Provider value={{ activeEvent, setActiveEvent, events: MOCK_EVENTS }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvent must be used within EventProvider');
  return ctx;
};
