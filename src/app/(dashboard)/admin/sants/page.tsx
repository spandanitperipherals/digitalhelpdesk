'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  UserPlus, 
  Search, 
  Edit3, 
  ExternalLink, 
  Loader2, 
  X, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface Sant {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
  shared_folder_link: string;
  niyam: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminSantsManagementPage() {
  const [sants, setSants] = useState<Sant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSant, setEditingSant] = useState<Sant | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    shared_folder_link: '',
    niyam: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const supabase = createClient();

  // ૧. સંતોની યાદી મેળવવી
  const fetchSants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sants')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      setSants(data as Sant[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSants();
  }, []);

  // ૨. મોડલ ખોલવું
  const openModal = (sant?: Sant) => {
    setFormError('');
    if (sant) {
      setEditingSant(sant);
      setFormData({
        name: sant.name,
        email: sant.email || '',
        mobile: sant.mobile || '',
        shared_folder_link: sant.shared_folder_link,
        niyam: sant.niyam || '',
      });
    } else {
      setEditingSant(null);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        shared_folder_link: '',
        niyam: '',
      });
    }
    setIsModalOpen(true);
  };

  // ૩. ડેટા સેવ કરવો (Insert / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.shared_folder_link.trim()) {
      setFormError('કૃપા કરીને પૂજ્ય સંતનું નામ અને Google Drive ફોલ્ડર લિંક દાખલ કરો.');
      return;
    }

    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() ? formData.email.trim().toLowerCase() : null,
      mobile: formData.mobile.trim() ? formData.mobile.trim() : null,
      shared_folder_link: formData.shared_folder_link.trim(),
      niyam: formData.niyam.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingSant) {
        // Update
        const { error } = await supabase
          .from('sants')
          .update(payload)
          .eq('id', editingSant.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('sants').insert([payload]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      await fetchSants();
    } catch (err: any) {
      setFormError(err.message || 'ડેટા સેવ કરવામાં ભૂલ આવી.');
    } finally {
      setSaving(false);
    }
  };

  // ૪. સ્ટેટસ બદલવું (Active / Inactive)
  const toggleStatus = async (sant: Sant) => {
    const nextStatus = !sant.is_active;
    const { error } = await supabase
      .from('sants')
      .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', sant.id);

    if (!error) {
      setSants((prev) =>
        prev.map((s) => (s.id === sant.id ? { ...s, is_active: nextStatus } : s))
      );
    } else {
      alert(`ભૂલ: ${error.message}`);
    }
  };

  // ફિલ્ટર લિસ્ટ
  const filteredSants = sants.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.mobile && s.mobile.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            સંત માસ્ટર ડિરેક્ટરી & ડ્રાઇવ લિંકિંગ
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            પૂજ્ય સંતોના ખાતા, સંપર્ક વિગત અને વ્યક્તિગત Google Drive Shared Folders નું વ્યવસ્થાપન
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSants}
            title="રીફ્રેશ કરો"
            className="p-2.5 rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition"
          >
            <UserPlus size={18} />
            <span>નવા સંત ઉમેરો</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="સંતનું નામ, ઈમેલ અથવા મોબાઈલ નંબરથી શોધો..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-900/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Sants Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/[0.03] border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">સંતનું નામ</th>
                <th className="px-6 py-4">સંપર્ક (Email / Mobile)</th>
                <th className="px-6 py-4">Google Drive Shared Folder</th>
                <th className="px-6 py-4 text-center">સ્થિતિ</th>
                <th className="px-6 py-4 text-right">ક્રિયા</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-400 mb-2" />
                    ડેટા લોડ થઈ રહ્યો છે...
                  </td>
                </tr>
              ) : filteredSants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    કોઈ સંત રેકોર્ડ મળ્યો નથી.
                  </td>
                </tr>
              ) : (
                filteredSants.map((sant) => (
                  <tr key={sant.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-semibold text-amber-400">
                          {sant.name ? sant.name[0] : 'S'}
                        </div>
                        <div>
                          <div>{sant.name}</div>
                          {sant.niyam && (
                            <span className="text-xs text-amber-400/80 font-normal">
                              નિયમ: {sant.niyam}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      <div>{sant.email || '—'}</div>
                      <div className="text-slate-400">{sant.mobile || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={sant.shared_folder_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 hover:underline font-mono max-w-xs truncate"
                      >
                        <FolderOpen size={14} className="shrink-0" />
                        <span className="truncate">{sant.shared_folder_link}</span>
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleStatus(sant)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition ${
                          sant.is_active
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sant.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                          }`}
                        />
                        {sant.is_active ? 'સક્રિય' : 'નિષ્ક્રિય'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(sant)}
                        className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-amber-400 hover:bg-white/5 transition"
                        title="સુધારો (Edit)"
                      >
                        <Edit3 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Sant */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white">
                {editingSant ? 'સંતની વિગતો સુધારો' : 'નવા સંત ઉમેરો'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  પૂજ્ય સંતનું પૂરું નામ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="દા.ત. પૂજ્ય ભક્તિપ્રિયદાસજી સ્વામી"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ઈમેલ (Email)
                  </label>
                  <input
                    type="email"
                    placeholder="sant@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    મોબાઇલ નંબર (Mobile)
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google Drive Shared Folder Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/drive/folders/1aBc..."
                  value={formData.shared_folder_link}
                  onChange={(e) =>
                    setFormData({ ...formData, shared_folder_link: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  આ ફોલ્ડર પર 'baroda.it@in.baps.org' સર્વિસ એકાઉન્ટને Editor અધિકાર આપેલ હોવો જોઈએ.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  વિશેષ નિયમ / વિગત (Niyam Notes)
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. કોમ્પ્યુટર સ્ક્રીન પ્રત્યક્ષ ન જોવી / પ્રિન્ટ આઉટ જરૂરી"
                  value={formData.niyam}
                  onChange={(e) => setFormData({ ...formData, niyam: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  <span>{saving ? 'સાચવી રહ્યું છે...' : 'સાચવો (Save)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}