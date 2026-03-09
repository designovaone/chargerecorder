'use client';

import { useState, useEffect, useRef } from 'react';

// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      prototype: SpeechRecognition;
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      prototype: SpeechRecognition;
      new (): SpeechRecognition;
    };
  }
}

interface VoiceInputProps {
  onSubmit: () => void;
}

export default function VoiceInput({ onSubmit }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [message, setMessage] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    recognitionRef.current = SpeechRecognition;
  }, []);

  function parseAndSubmit(text: string) {
    // Extract number from text like "62 percent", "62%", "62"
    const match = text.match(/(\d+)/);
    if (!match) {
      return;
    }

    const percentage = parseInt(match[1]);
    if (percentage < 0 || percentage > 100) {
      return;
    }

    // Determine if start or end based on context
    const isEnd = text.toLowerCase().includes('end') || text.toLowerCase().includes('stop');
    const type = isEnd ? 'end' : 'start';

    submitSession(percentage, type);
  }

  async function submitSession(percentage: number, type: 'start' | 'end') {
    try {
      console.log('Submitting:', { percentage, type });
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage, type }),
      });

      const data = await res.json();
      console.log('Response:', res.status, data);

      if (res.ok) {
        setMessage(data.message || `Recorded ${percentage}%`);
        setIsError(false);
        onSubmit();
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.detail || 'Failed to record');
        setIsError(true);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setMessage('Network error');
      setIsError(true);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  function toggleListening() {
    if (!recognitionRef.current) return;

    if (isListening) {
      // Can't stop speech recognition on iOS - just let it finish naturally
      setIsListening(false);
      return;
    }

    // Create a fresh recognition instance each time (required for iOS Safari)
    const SpeechRecognition = recognitionRef.current as any;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      console.log('Heard:', transcript);
      parseAndSubmit(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      setIsListening(false);
      setMessage(`Error: ${event.error}`);
      setIsError(true);
      setTimeout(() => setMessage(''), 3000);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  }

  if (!isSupported) {
    return (
      <div className="space-y-4">
        <button
          disabled
          className="w-full py-12 bg-white border border-border rounded-lg flex items-center justify-center opacity-50"
          style={{ minHeight: '120px' }}
        >
          <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
          </svg>
        </button>
        <p className="text-center text-gray-500 text-sm">Voice input not supported in this browser</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={toggleListening}
        className={`w-full py-12 rounded-lg flex items-center justify-center transition-opacity ${
          isListening ? 'bg-primary listening text-white' : 'bg-white border border-border hover:bg-gray-50 text-primary'
        }`}
        style={{ minHeight: '120px' }}
      >
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
        </svg>
      </button>
      {isListening && (
        <p className="text-center text-gray-600">Listening...</p>
      )}
      {message && (
        <p className={`text-center text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
