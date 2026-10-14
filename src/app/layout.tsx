import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Gujarati } from "next/font/google";
import './globals.css'; // જો આ ફાઈલ `src/app/globals.css` માં હોય તો આ સાચું છે

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoSansGujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-gujarati",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BAPS ડિજિટલ હેલ્પડેસ્ક - વડોદરા",
  description: 'BAPS Atladara Computer Room Helpdesk Portal',
  icons: {
    icon: '/images.png',
  },
};

// 2) Notched screens: safe-area utilities માટે જરૂરી
export const viewport: Viewport = {
  themeColor: "#0b0f19",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="gu" className={`${inter.variable} ${notoSansGujarati.variable}`}>
      <body className="bg-abyss text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}