'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from './actions';

export default function LoginPage() {
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Mandir Header / Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500 text-white font-bold text-2xl shadow-lg mb-3">
          ૐ
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          સ્વામિનારાયણ મંદિર કોમ્પ્યુટર વર્કશોપ
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          આઈ.ટી. એડમિન અને યુવક પોર્ટલ લોગિન
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                નોંધાયેલ ઈમેલ (Email) *
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="yuvak@domain.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                પાસવર્ડ (Password) *
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
              >
                {loading ? 'પ્રમાણીકરણ ચાલુ છે...' : 'સુરક્ષિત લોગિન (Sign In)'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">
              પૂજ્ય સંતોના આધ્યાત્મિક નિયમોનું પાલન અને સેવા વ્યવસ્થાપન અર્થે સુરક્ષિત પ્રણાલી.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}