import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import type { Listing } from '../../types';

interface CardContextValue {
  listing: Listing;
  saved: boolean;
  onToggleSave: (id: string, title: string) => void;
}

const CardContext = createContext<CardContextValue | null>(null);

export function useCard(): CardContextValue {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error('useCard must be used within a <Card> component');
  return ctx;
}

interface CardProps {
  listing: Listing;
  saved?: boolean;
  onToggleSave?: (id: string, title: string) => void;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({
  listing,
  saved = false,
  onToggleSave = () => undefined,
  children,
  className,
  onClick,
}: CardProps): ReactElement {
  return (
    <CardContext.Provider value={{ listing, saved, onToggleSave }}>
      <div className={className ?? 'card'} onClick={onClick}>
        {children}
      </div>
    </CardContext.Provider>
  );
}
