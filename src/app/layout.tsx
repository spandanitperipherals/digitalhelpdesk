import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'સ્વામિનારાયણ મંદિર કોમ્પ્યુટર વર્કશોપ',
  description: 'Digital Helpdesk System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="gu">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
