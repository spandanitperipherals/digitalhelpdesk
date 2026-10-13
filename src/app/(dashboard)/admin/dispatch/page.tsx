'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, MessageSquare, Mail, Bell, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function DispatchPage() {
  const [sants, setSants] = useState<any[]>([]);
  const [selectedSant, setSelectedSant] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'telegram' | 'email'>('whatsapp');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadSants();
    loadLogs();
  }, []);

  async function loadSants() {
    const { data } = await supabase.from('sants').select('id, name, mobile, email');
    if (data) setSants(data);
  }

  async function loadLogs() {
    const { data } = await supabase
      .from('dispatch_logs')
      .select('id, channel, recipient, status, error_message, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setLogs(data);
  }

  function handleSantSelect(santId: string) {
    setSelectedSant(santId);
    const sant = sants.find((s) => s.id.toString() === santId);
    if (sant) {
      if (channel === 'whatsapp' || channel === 'telegram') {
        setRecipient(sant.mobile || '');
      } else {
        setRecipient(sant.email || '');
      }
    }
  }

  async function handleDispatch(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    try {
      // ડિસ્પેચ લોગ ટેબલમાં સાચવો
      const { error } = await supabase.from('dispatch_logs').insert([
        {
          sant_id: selectedSant ? Number(selectedSant) : null,
          channel,
          recipient,
          status: 'sent',
          error_message: null,
        },
      ]);

      if (error) throw error;
      alert('મેસેજ સફળતાપૂર્વક રવાના થયો!');
      setMessage('');
      loadLogs();
    } catch (err: any) {
      alert(`મોકલવામાં ભૂલ: ${err.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">મલ્ટિ-ચેનલ ડિસ્પેચ પેનલ</h1>
        <p className="text-sm text-slate-500">પૂજ્ય સંતો તથા યુવકોને WhatsApp, Telegram અથવા Email દ્વારા સીધો સંપર્ક/સૂચના મોકલો</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ફોર્મ */}
        <div className="lg:col-span-2 bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
          <form onSubmit={handleDispatch} className="space-y-5">
            {/* ચેનલ સિલેક્શન */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">ડિસ્પેચ ચેનલ પસંદ કરો</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition ${
                    channel === 'whatsapp'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare size={16} className="text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('telegram')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition ${
                    channel === 'telegram'
                      ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Bell size={16} className="text-sky-600" />
                  <span>Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition ${
                    channel === 'email'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail size={16} className="text-indigo-600" />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* પૂજ્ય સંત પસંદગી (ઓપ્શનલ) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">પૂજ્ય સંત પસંદ કરો (ઓટો-ફિલ વિગત)</label>
              <select
                value={selectedSant}
                onChange={(e) => handleSantSelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- યાદીમાંથી પસંદ કરો અથવા સીધો નંબર લખો --</option>
                {sants.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({channel === 'email' ? s.email : s.mobile})
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                પ્રાપ્તકર્તા ({channel === 'email' ? 'ઈમેલ એડ્રેસ' : 'મોબાઈલ નંબર / Chat ID'})
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={channel === 'email' ? 'example@mandir.local' : '919876543210'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">સંદેશ / કાર્ય વિગત (Message)</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="અહીં મોકલવાની વિગત દાખલ કરો..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow transition flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              <span>સંદેશ ડિસ્પેચ કરો</span>
            </button>
          </form>
        </div>

        {/* તાજેતરની ડિસ્પેચ હિસ્ટ્રી */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">તાજેતરની ડિસ્પેચ વિગતો</h2>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">કોઈ ડિસ્પેચ હિસ્ટ્રી નથી.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold uppercase tracking-wider text-slate-700">{log.channel}</span>
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> {log.status}
                    </span>
                  </div>
                  <p className="text-slate-600 truncate">{log.recipient}</p>
                  <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}