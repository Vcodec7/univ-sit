'use client';

import { Component, type ReactNode } from 'react';
import toast from 'react-hot-toast';

type Props = { children: ReactNode };
type State = { failed: boolean };

export default class AdminErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    toast.error('Раздел не загрузился. Обновите страницу', { duration: 5000, id: 'admin-boundary' });
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="admin-error-fallback" role="alert">
          Не удалось показать раздел. Обновите страницу.
        </p>
      );
    }
    return this.props.children;
  }
}
