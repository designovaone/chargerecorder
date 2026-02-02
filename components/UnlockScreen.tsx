'use client';

import { useState, FormEvent } from 'react';

interface UnlockScreenProps {
  onUnlock: () => void;
}

export default function UnlockScreen({ onUnlock }: UnlockScreenProps) {
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase }),
      });

      const data = await res.json();

      if (data.success) {
        onUnlock();
      } else {
        setError(data.message || 'Unlock failed');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8 text-primary">Charge Recorder</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Enter passphrase"
            className="w-full px-4 py-3 bg-white border border-border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:opacity-90 disabled:bg-gray-300 disabled:text-gray-500 rounded-lg font-semibold text-white transition-opacity"
          >
            {isLoading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
        {error && (
          <p className="mt-4 text-red-500 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
