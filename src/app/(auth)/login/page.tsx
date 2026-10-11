'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from './actions';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '';
  const errorParam = searchParams.get('error');

  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'inactive' ? 'આપનું એકાઉન્ટ નિષ્ક્રિય કરવામાં આવેલ છે.' : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      setErrorMessage(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {(errorMessage || errorParam === 'invalid') && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>ઈમેલ અથવા પાસવર્ડ અમાન્ય છે.</span>
        </div>
      )}

      {/* Email Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          નોંધાયેલ ઈમેલ (Email) *
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
            📧
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="admin@mandir.local"
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          પાસવર્ડ (Password) *
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
            🔒
          </span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-[#0f172a] hover:bg-[#1e293b] active:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              પ્રમાણીકરણ ચાલુ છે...
            </span>
          ) : (
            'સુરક્ષિત લોગિન (Sign In)'
          )}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen bg-[#fcf9f2] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.05), transparent)',
      }}
    >
      {/* Background traditional border graphics for corners */}
      <div className="absolute top-0 left-0 w-24 h-24 md:w-36 md:h-36 border-t-4 border-l-4 border-amber-500/10 m-4 rounded-tl-2xl pointer-events-none hidden sm:block"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 md:w-36 md:h-36 border-b-4 border-r-4 border-amber-500/10 m-4 rounded-br-2xl pointer-events-none hidden sm:block"></div>

      {/* Traditional Temple Side Panels (Desktop only) */}
      <div className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 flex-col items-center opacity-30 text-center max-w-[160px]">
        <div className="text-3xl text-amber-600 mb-1">🕌</div>
        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">BAPS Mandir Atladara</p>
        <p className="text-[10px] text-slate-500 font-medium">Computer Room</p>
        <div className="w-10 h-[1px] bg-amber-500/30 my-2"></div>
        <p className="text-[10px] text-amber-700 italic">Technology in Service of Satsang</p>
      </div>

      <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col items-center opacity-30 text-center max-w-[160px]">
        <div className="text-3xl text-amber-600 mb-1">🕌</div>
        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">BAPS Mandir Atladara</p>
        <p className="text-[10px] text-slate-500 font-medium">Computer Room</p>
        <div className="w-10 h-[1px] bg-amber-500/30 my-2"></div>
        <p className="text-[10px] text-amber-700 italic">Technology in Service of Satsang</p>
      </div>

      {/* Centered Oum Badge */}
      <div className="mb-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 font-bold text-lg shadow-sm">
          ૐ
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-amber-100 max-w-md w-full relative z-10">
        
        {/* Logo and Brand Header */}
        <div className="text-center pb-5 border-b border-slate-100 mb-5">
          <div className="flex justify-center items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-rose-600 border border-amber-400 flex items-center justify-center text-white text-[9px] font-bold">
              BAPS
            </div>
            <div className="text-left">
              <h1 className="text-xs font-bold text-slate-900 leading-none">BAPS Swaminarayan Mandir</h1>
              <span className="text-[9px] font-bold text-amber-600 tracking-wider uppercase">Atladara • Computer Room Helpdesk Portal</span>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 tracking-wide mt-2">
            સ્વામિનારાયણ મંદિર કોમ્પ્યુટર વર્કશોપ
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            આઇ.ટી. એડમિન અને યુવક પોર્ટલ લોગીન
          </p>
          <p className="text-[10px] text-amber-600 italic font-medium mt-1.5">
            “In the service of Shri Swaminarayan”
          </p>
        </div>

        {/* Suspense Wraps Form */}
        <Suspense fallback={<div className="text-center py-6 text-sm text-slate-400">લોડ થઈ રહ્યું છે...</div>}>
          <LoginForm />
        </Suspense>

        {/* Support Text */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            સેવા વ્યવસ્થાપન અર્થે સુરક્ષિત પ્રણાલી.
          </p>
        </div>
      </div>
      
      {/* Footer copyright */}
      <div className="mt-5 text-[9px] text-slate-400 text-center font-medium">
        © 2026 BAPS Swaminarayan Sanstha.
      </div>
    </div>
  );
}