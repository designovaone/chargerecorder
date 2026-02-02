'use client';

import { useState, useEffect } from 'react';
import UnlockScreen from '@/components/UnlockScreen';
import StatusBanner from '@/components/StatusBanner';
import VoiceInput from '@/components/VoiceInput';
import ManualInput from '@/components/ManualInput';
import SessionHistory from '@/components/SessionHistory';
import ExportButton from '@/components/ExportButton';

export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/status');
      setIsUnlocked(res.ok);
    } catch {
      setIsUnlocked(false);
    } finally {
      setIsLoading(false);
    }
  }

  function triggerRefresh() {
    setRefreshKey((k) => k + 1);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isUnlocked) {
    return <UnlockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <main className="min-h-screen bg-background text-gray-900 flex flex-col">
      <StatusBanner refreshKey={refreshKey} />

      <div className="flex-1 flex flex-col p-4 space-y-4">
        <VoiceInput onSubmit={triggerRefresh} />
        <ManualInput onSubmit={triggerRefresh} />
        <SessionHistory refreshKey={refreshKey} onDelete={triggerRefresh} />
      </div>

      <ExportButton />

      <footer className="p-4 text-center">
        <a
          href="https://richardwimmer.de"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:opacity-80 transition-opacity"
        >
          Made with ❤️ by Richard Wimmer
        </a>
      </footer>
    </main>
  );
}
