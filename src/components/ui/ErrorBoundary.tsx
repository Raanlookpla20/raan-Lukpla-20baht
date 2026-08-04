"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 text-center text-sm text-[var(--color-muted)]">
            เกิดข้อผิดพลาดในการแสดงผลส่วนนี้
          </div>
        )
      );
    }
    return this.props.children;
  }
}
