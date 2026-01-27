'use client';

import { useState, FormEvent } from 'react';

interface ManualInputProps {
  onSubmit: () => void;
}

export default function ManualInput({ onSubmit }: ManualInputProps) {
  const [percentage, setPercentage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  function showFeedback(message: string, type: 'success' | 'error') {
    setFeedback(message);
    setFeedbackType(type);
    setTimeout(() => setFeedback(''), 3000);
  }

  async function handleSubmit(type: 'start' | 'end') {
    const pct = parseInt(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      showFeedback('Enter a valid percentage (0-100)', 'error');
      return;
    }

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage: pct, type }),
      });

      if (!res.ok) {
        const data = await res.json();
        showFeedback(data.detail || 'Request failed', 'error');
        return;
      }

      const data = await res.json();
      showFeedback(data.message, 'success');
      setPercentage('');
      onSubmit();
    } catch {
      showFeedback('Connection failed', 'error');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="number"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          placeholder="Enter percentage (0-100)"
          min="0"
          max="100"
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => handleSubmit('start')}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
        >
          Start
        </button>
        <button
          onClick={() => handleSubmit('end')}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
        >
          Stop
        </button>
      </div>

      {feedback && (
        <p className={`text-center text-lg ${feedbackType === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {feedback}
        </p>
      )}
    </div>
  );
}
