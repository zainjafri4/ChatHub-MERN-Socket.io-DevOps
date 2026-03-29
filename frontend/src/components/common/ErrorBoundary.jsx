import { Component } from 'react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-3xl">⚠️</div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{this.state.error?.message || 'An unexpected error occurred'}</p>
        <Button onClick={() => this.setState({ hasError: false, error: null })}>Try Again</Button>
      </div>
    );
    return this.props.children;
  }
}
