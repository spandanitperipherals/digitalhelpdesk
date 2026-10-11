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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {(errorMessage || errorParam === 'invalid') && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚠️</span>
          <span>{errorMessage || 'ઈમેલ અથવા પાસવર્ડ અમાન્ય છે.'}</span>
        </div>
      )}

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 700,
            color: '#334155',
            marginBottom: '6px',
          }}
        >
          નોંધાયેલ ઈમેલ (Email) *
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              position: 'absolute',
              left: '12px',
              color: '#94a3b8',
              fontSize: '14px',
              pointerEvents: 'none',
            }}
          >
            👤
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="admin@mandir.local"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 700,
            color: '#334155',
            marginBottom: '6px',
          }}
        >
          પાસવર્ડ (Password) *
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              position: 'absolute',
              left: '12px',
              color: '#94a3b8',
              fontSize: '14px',
              pointerEvents: 'none',
            }}
          >
            🔒
          </span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ paddingTop: '8px' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          }}
        >
          {loading ? 'પ્રમાણીકરણ ચાલુ છે...' : 'સુરક્ષિત લોગિન (Sign In)'}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#faf7ee',
        backgroundImage: 'radial-gradient(circle at 50% 0%, #fff7ed 0%, #faf7ee 70%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#fffbeb',
          border: '1.5px solid #fde68a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#b45309',
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.15)',
        }}
      >
        ૐ
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #fef3c7',
          boxShadow: '0 20px 40px -15px rgba(180, 83, 9, 0.08), 0 0 25px rgba(0,0,0,0.04)',
          maxWidth: '440px',
          width: '100%',
          padding: '36px 32px',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                border: '2px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 900,
                letterSpacing: '0.5px',
              }}
            >
              BAPS
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                BAPS Swaminarayan Mandir
              </div>
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#d97706',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  marginTop: '2px',
                }}
              >
                Atladara • Computer Room Helpdesk
              </div>
            </div>
          </div>

          <h2
            style={{
              fontSize: '19px',
              fontWeight: 800,
              color: '#0f172a',
              margin: '12px 0 4px 0',
            }}
          >
            સ્વામિનારાયણ મંદિર કોમ્પ્યુટર વર્કશોપ
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px 0' }}>
            આઈ.ટી. એડમિન અને યુવક પોર્ટલ લોગીન
          </p>
          <p
            style={{
              fontSize: '11px',
              color: '#d97706',
              fontStyle: 'italic',
              margin: 0,
              fontWeight: 500,
            }}
          >
            “In the service of Shri Swaminarayan”
          </p>
        </div>

        <Suspense fallback={<div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>લોડ થઈ રહ્યું છે...</div>}>
          <LoginForm />
        </Suspense>

        <div
          style={{
            marginTop: '24px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            પૂજ્ય સંતોના આધ્યાત્મિક નિયમોનું પાલન અને સેવા વ્યવસ્થાપન અર્થે સુરક્ષિત પ્રણાલી.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
        © 2026 BAPS Swaminarayan Sanstha. All rights reserved.
      </div>
    </div>
  );
}