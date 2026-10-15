'use client';

import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings } from './actions';
import { Mail, Key, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [supportEmail, setSupportEmail] = useState('');
  const [currentServiceAccount, setCurrentServiceAccount] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      const res = await getSystemSettings();
      if (res.settings) {
        setSupportEmail(res.settings.support_ticket_email || 'dmungara7@gmail.com');
        setCurrentServiceAccount(res.settings.google_service_account_email || 'Not configured');
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await updateSystemSettings({
      supportEmail,
      serviceAccountJson,
    });

    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Settings updated successfully.' });
      setServiceAccountJson('');
      const refreshed = await getSystemSettings();
      if (refreshed.settings) {
        setCurrentServiceAccount(refreshed.settings.google_service_account_email || 'Not configured');
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System & Integration Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage incoming support email dispatching and Google Drive service account credentials.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Ticket Ingestion Box */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Ticket Ingestion Email</h2>
              <p className="text-xs text-slate-400">
                Sant requests sent to this address will automatically generate service tickets.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Support Email Address
            </label>
            <input
              type="email"
              required
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="dmungara7@gmail.com"
              className="w-full sm:max-w-md rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Google Drive Service Account Credentials */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Google Drive Service Account</h2>
              <p className="text-xs text-slate-400">
                The identity that needs Editor access to all 50 Sant Google Drive shared folders.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Active Google Service Account:</span>
              <span className="text-xs font-mono text-amber-300 break-all">
                {currentServiceAccount}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Paste New Service Account JSON (Optional)
              </label>
              <textarea
                rows={5}
                value={serviceAccountJson}
                onChange={(e) => setServiceAccountJson(e.target.value)}
                placeholder='Paste the entire content of your service-account-key.json here to update keys...'
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
}