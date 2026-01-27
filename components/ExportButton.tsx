'use client';

import { useState } from 'react';

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch('/api/sessions/csv');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'charging_sessions.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="p-4 border-t border-gray-700">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg font-semibold transition-colors"
      >
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </button>
    </div>
  );
}
