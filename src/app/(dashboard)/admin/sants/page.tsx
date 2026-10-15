'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@lib/supabase/client';

const supabase = createClient();

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

const { data, error } = await supabase
  .from('sants')
  .insert([
    {
      name,
      email,
      mobile,
      shared_folder_link,
      niyam,
      updated_at: new Date().toISOString(),
    },
  ]);

if (error) {
  console.error("Supabase Insert Error:", error);
  alert(`ભૂલ: ${error.message}`);
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

  // ૨. મોડલ ખોલવું (નવા સંત ઉમેરવા અથવા સુધારવા)
  const openModal = (sant?: Sant) => {
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
    if (!formData.name || !formData.shared_folder_link) {
      alert('કૃપા કરીને સંતનું નામ અને Google Drive ફોલ્ડર લિંક દાખલ કરો.');
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

    if (editingSant) {
      // અપડેટ
      const { error } = await supabase
        .from('sants')
        .update(payload)
        .eq('id', editingSant.id);

      if (error) {
        alert(`ભૂલ: ${error.message}`);
      } else {
        setIsModalOpen(false);
        fetchSants();
      }
    } else {
      // નવો સંત ઉમેરવો
      const { error } = await supabase.from('sants').insert([payload]);

      if (error) {
        alert(`ભૂલ: ${error.message}`);
      } else {
        setIsModalOpen(false);
        fetchSants();
      }
    }
    setSaving(false);
  };

  // ૪. સ્ટેટસ બદલવું (Active / Inactive)
  const toggleStatus = async (sant: Sant) => {
    const { error } = await supabase
      .from('sants')
      .update({ is_active: !sant.is_active, updated_at: new Date().toISOString() })
      .eq('id', sant.id);

    if (!error) {
      fetchSants();
    }
  };

  // ફિલ્ટર લિસ્ટ
  const filteredSants = sants.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.mobile && s.mobile.includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">સંત માસ્ટર ડિરેક્ટરી & ડ્રાઇવ લિંકિંગ</h1>
            <p className="text-sm text-slate-500 mt-1">
              પૂજ્ય સંતોના ખાતા, સંપર્ક વિગત અને વ્યક્તિગત Google Drive Shared Folders નું વ્યવસ્થાપન
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
          >
            + નવા સંત ઉમેરો
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="સંતનું નામ, ઈમેલ અથવા મોબાઈલ નંબરથી શોધો..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"          />
        </div>

        {/* Sants Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">સંતનું નામ</th>
                  <th className="px-6 py-4">સંપર્ક (Email / Mobile)</th>
                  <th className="px-6 py-4">Google Drive Shared Folder</th>
                  <th className="px-6 py-4 text-center">સ્થિતિ</th>
                  <th className="px-6 py-4 text-right">ક્રિયા (Actions)</th>
                </tr>
              </thead>
              <tbody className={`${inter.variable} ${notoSansGujarati.variable} font-sans bg-abyss text-slate-100 antialiased`}>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      ડેટા લોડ થઈ રહ્યો છે...
                    </td>
                  </tr>
                ) : filteredSants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      કોઈ રેકોર્ડ મળ્યો નથી.
                    </td>
                  </tr>
                ) : (
                  filteredSants.map((sant) => (
                    <tr key={sant.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {sant.name}
                        {sant.niyam && (
                          <span className="block text-xs text-slate-400 font-normal">
                            નિયમ: {sant.niyam}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div>{sant.email || '-'}</div>
                        <div className="text-slate-400">{sant.mobile || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={sant.shared_folder_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono max-w-xs truncate"
                        >
                          🔗 {sant.shared_folder_link}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(sant)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            sant.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sant.is_active ? 'સક્રિય' : 'નિષ્ક્રિય'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openModal(sant)}
                          className="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          સુધારો (Edit)
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                {editingSant ? 'સંતની વિગતો સુધારો' : 'નવા સંત ઉમેરો'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    પૂજ્ય સંતનું પૂરું નામ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="દા.ત. પૂજ્ય ભક્તિપ્રિયદાસજી સ્વામી"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ઈમેલ (Email)
                    </label>
                    <input
                      type="email"
                      placeholder="sant@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      મોબાઇલ નંબર (Mobile)
                    </label>
                    <input
                      type="text"
                      placeholder="9876543210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    આ ફોલ્ડર પર 'baroda.it@in.baps.org' સર્વિસ એકાઉન્ટને Editor અધિકાર આપેલ હોવો જોઈએ.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    વિશેષ નિયમ / વિગત (Niyam Notes)
                  </label>
                  <input
                    type="text"
                    placeholder="દા.ત. કોમ્પ્યુટર સ્ક્રીન પ્રત્યક્ષ ન જોવી / પ્રિન્ટ આઉટ જરૂરી"
                    value={formData.niyam}
                    onChange={(e) => setFormData({ ...formData, niyam: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    રદ કરો
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                  >
                    {saving ? 'સાચવી રહ્યું છે...' : 'સાચવો (Save)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}