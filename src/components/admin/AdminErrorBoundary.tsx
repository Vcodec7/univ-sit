'use client';

import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

export default class AdminErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  retry = () => {
    this.setState({ failed: false });
  };

  render() {
    if (this.state.failed) {
      return (
        <div className="admin-error-fallback" role="alert">
          <h2 className="admin-error-fallback__title">Не удалось показать раздел</h2>
          <p className="admin-error-fallback__text">
            Данные не загрузились. Можно попробовать снова — без перезагрузки всей панели.
          </p>
          <button type="button" className="btn btn-primary" onClick={this.retry}>
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
