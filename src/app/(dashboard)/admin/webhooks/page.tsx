'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Webhook, Save, Key, ShieldCheck, Loader2 } from 'lucide-react';

export default function WebhooksPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState({
    whatsapp_webhook: '',
    whatsapp_token: '',
    telegram_token: '',
    telegram_chat_id: '',
    resend_api_key: '',
  });

  const supabase = createClient();

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    const { data } = await supabase.from('dispatch_configs').select('*');
    if (data) {
      const mapped: any = {};
      data.forEach((item) => {
        if (item.channel === 'whatsapp') {
          mapped.whatsapp_webhook = item.webhook_url || '';
          mapped.whatsapp_token = item.bot_token || '';
        } else if (item.channel === 'telegram') {
          mapped.telegram_token = item.bot_token || '';
          mapped.telegram_chat_id = item.chat_id || '';
        } else if (item.channel === 'email') {
          mapped.resend_api_key = item.bot_token || '';
        }
      });
      setConfigs((prev) => ({ ...prev, ...mapped }));
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // ૧. WhatsApp Config
      await supabase.from('dispatch_configs').upsert({
        channel: 'whatsapp',
        webhook_url: configs.whatsapp_webhook,
        bot_token: configs.whatsapp_token,
        is_active: true,
      }, { onConflict: 'channel' });

      // ૨. Telegram Config
      await supabase.from('dispatch_configs').upsert({
        channel: 'telegram',
        bot_token: configs.telegram_token,
        chat_id: configs.telegram_chat_id,
        is_active: true,
      }, { onConflict: 'channel' });

      // ૩. Email Config
      await supabase.from('dispatch_configs').upsert({
        channel: 'email',
        bot_token: configs.resend_api_key,
        is_active: true,
      }, { onConflict: 'channel' });

      alert('વેબહુક સેટિંગ્સ સફળતાપૂર્વક સાચવવામાં આવ્યા!');
    } catch (err: any) {
      alert(`સાચવવામાં ભૂલ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Loader2 className="animate-spin mx-auto mb-2" size={28} />
        કન્ફિગરેશન લોડ થઈ રહ્યું છે...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">API અને વેબહુક કન્ફિગરેશન</h1>
        <p className="text-sm text-slate-500">
          સર્વિસ એકાઉન્ટ્સ, WhatsApp Cloud API, Telegram Bot Tokens અને SMTP ગેટવે સેટિંગ્સ
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* WhatsApp Cloud API */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold border-b pb-3">
            <Webhook size={18} />
            <span>Meta WhatsApp Cloud API સેટિંગ્સ</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Webhook Callback URL</label>
              <input
                type="url"
                value={configs.whatsapp_webhook}
                onChange={(e) => setConfigs({ ...configs, whatsapp_webhook: e.target.value })}
                placeholder="https://your-domain.com/api/webhooks/whatsapp"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Permanent Access Token</label>
              <input
                type="password"
                value={configs.whatsapp_token}
                onChange={(e) => setConfigs({ ...configs, whatsapp_token: e.target.value })}
                placeholder="EAAGm0PX4ZC0BA..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Telegram Bot */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sky-700 font-semibold border-b pb-3">
            <Key size={18} />
            <span>Telegram Bot Credentials</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bot Father Token</label>
              <input
                type="password"
                value={configs.telegram_token}
                onChange={(e) => setConfigs({ ...configs, telegram_token: e.target.value })}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default Channel / Chat ID</label>
              <input
                type="text"
                value={configs.telegram_chat_id}
                onChange={(e) => setConfigs({ ...configs, telegram_chat_id: e.target.value })}
                placeholder="-1001234567890"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Resend / Email API */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold border-b pb-3">
            <ShieldCheck size={18} />
            <span>Resend / Email SMTP API Gateway</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Resend API Key</label>
            <input
              type="password"
              value={configs.resend_api_key}
              onChange={(e) => setConfigs({ ...configs, resend_api_key: e.target.value })}
              placeholder="re_123456789_abcdefg"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow transition flex items-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          <span>સેટિંગ્સ સાચવો (Save Config)</span>
        </button>
      </form>
    </div>
  );
}