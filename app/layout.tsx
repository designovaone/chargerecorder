import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Charge Recorder',
  description: 'Track electric car charge levels via voice or text input.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
