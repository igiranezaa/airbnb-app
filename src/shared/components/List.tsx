import type { ReactElement, ReactNode } from 'react';
import Spinner from './Spinner';

interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'No items found.',
  loading = false,
  className,
}: ListProps<T>): ReactElement {
  if (loading) return <Spinner />;
  if (items.length === 0) {
    return <p className="list-empty">{emptyMessage}</p>;
  }
  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={keyExtractor(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
