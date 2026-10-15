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
    <div className="min-h-screen w-full bg-[#f4f7fb]">
      {children}
    </div>
  );
}