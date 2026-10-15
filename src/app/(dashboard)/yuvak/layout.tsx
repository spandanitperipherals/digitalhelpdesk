import React from 'react';

export const metadata = {
  title: 'યુવક સેવા ડેસ્ક | BAPS ડિજિટલ હેલ્પડેસ્ક',
};

export default function YuvakLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-slate-950/40 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </div>
  );
}