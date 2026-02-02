'use client';

import { useEffect, useState } from 'react';
import type { StatusResponse } from '@/lib/types';

interface StatusBannerProps {
  refreshKey: number;
}

export default function StatusBanner({ refreshKey }: StatusBannerProps) {
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.error('Status fetch failed:', err);
      }
    }
    fetchStatus();
  }, [refreshKey]);

  if (!status) {
    return (
      <div className="p-4 bg-white border-b border-border">
        <p className="text-center text-lg text-gray-400">Loading...</p>
      </div>
    );
  }

  if (status.status === 'charging' && status.start_time && status.start_percentage !== undefined) {
    const date = new Date(status.start_time);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="p-4 bg-white border-b border-border">
        <p className="text-center text-lg text-primary">
          Charging since {timeStr} ({status.start_percentage}%)
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border-b border-border">
      <p className="text-center text-lg text-gray-600">No active charge</p>
    </div>
  );
}
