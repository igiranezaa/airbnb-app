import type { ComponentType, ReactElement } from 'react';
import Spinner from '../components/Spinner';

export function withLoading<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P & { isLoading: boolean }> {
  function WithLoading({ isLoading, ...props }: P & { isLoading: boolean }): ReactElement {
    if (isLoading) return <Spinner />;
    return <Component {...(props as P)} />;
  }
  WithLoading.displayName = `WithLoading(${Component.displayName ?? Component.name ?? 'Component'})`;
  return WithLoading;
}
