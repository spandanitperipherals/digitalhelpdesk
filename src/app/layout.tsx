import type { Metadata } from 'next';
import './globals.css'; // જો આ ફાઈલ `src/app/globals.css` માં હોય તો આ સાચું છે

export const metadata: Metadata = {
  title: 'સ્વામિનારાયણ મંદિર કોમ્પ્યુટર વર્કશોપ',
  description: 'BAPS Atladara Computer Room Helpdesk Portal',
  icons: {
    icon: '/images.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="gu">
      <body className="antialiased min-h-screen bg-[#fcf9f2] text-slate-900">
        {children}
      </body>
    </html>
  );
}