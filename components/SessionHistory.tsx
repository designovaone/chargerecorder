'use client';

import { useEffect, useState } from 'react';
import type { ChargingSession } from '@/lib/types';

interface SessionHistoryProps {
  refreshKey: number;
  onDelete: () => void;
}

export default function SessionHistory({ refreshKey, onDelete }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error('History fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSessions();
  }, [refreshKey]);

  async function deleteSession(sessionId: number) {
    if (!confirm('Delete this session?')) {
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  async function clearAllSessions() {
    if (!confirm('Are you sure you want to delete ALL sessions? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/sessions', {
        method: 'DELETE',
      });

      if (res.ok) {
        onDelete();
      }
    } catch (err) {
      console.error('Clear all failed:', err);
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col">
        <h2 className="text-xl font-semibold mb-2">Recent Sessions</h2>
        <div className="flex-1 overflow-y-auto">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const displaySessions = sessions.slice(0, 10);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Recent Sessions</h2>
        {sessions.length > 0 && (
          <button
            onClick={clearAllSessions}
            className="flex items-center gap-2 py-2 px-4 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {displaySessions.length === 0 ? (
          <p className="text-gray-400">No sessions yet</p>
        ) : (
          displaySessions.map((session) => {
            const startDate = new Date(session.start_time);
            const startStr = startDate.toLocaleDateString() + ' ' +
              startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (session.end_percentage !== null) {
              const endDate = new Date(session.end_time!);
              const endStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const gained = session.end_percentage - session.start_percentage;

              return (
                <div key={session.id} className="bg-white border border-border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800">{session.start_percentage}% → {session.end_percentage}%</span>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">+{gained}%</span>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {startStr} → {endStr}
                  </div>
                </div>
              );
            }

            return (
              <div key={session.id} className="bg-white border border-border rounded-lg p-3 border-l-4 border-primary">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg text-gray-800">{session.start_percentage}%</div>
                    <div className="text-sm text-gray-500">Started: {startStr}</div>
                    <div className="text-sm text-primary">In progress...</div>
                  </div>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
