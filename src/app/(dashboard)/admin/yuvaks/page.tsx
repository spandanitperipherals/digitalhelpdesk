'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Loader2, 
  Search, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Edit3, 
  X, 
  Shield, 
  User, 
  RefreshCw 
} from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'yuvak';
  is_active: boolean;
}

export default function YuvaksPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Baps@12345');
  const [role, setRole] = useState<'admin' | 'yuvak'>('yuvak');
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, is_active')
      .order('name');
    if (!error && data) {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  }

  function openModal(user?: Profile) {
    setFormError('');
    if (user) {
      setEditingUser(user);
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role);
      setPassword('');
    } else {
      setEditingUser(null);
      setName('');
      setEmail('');
      setPassword('Baps@12345');
      setRole('yuvak');
    }
    setIsModalOpen(true);
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    setFormBusy(true);
    setFormError('');

    try {
      if (editingUser) {
        // Edit Mode: ફક્ત નામ અને રોલ અપડેટ કરો
        const { error } = await supabase
          .from('profiles')
          .update({ name: name.trim(), role })
          .eq('id', editingUser.id);

        if (error) throw new Error(error.message);
      } else {
        // Create Mode: ડેટાબેઝ RPC ફંક્શન કૉલ
        const { data, error } = await supabase.rpc('create_new_user_by_admin', {
          p_email: email.trim(),
          p_password: password.trim() || 'Baps@12345',
          p_name: name.trim(),
          p_role: role,
        });

        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.message || 'યુઝર બનાવવામાં ભૂલ આવી');
      }

      setIsModalOpen(false);
      await fetchProfiles();
    } catch (err: any) {
      setFormError(err.message || 'પ્રક્રિયા નિષ્ફળ રહી.');
    } finally {
      setFormBusy(false);
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
      );
    } else {
      alert(`Error: ${error.message}`);
    }
  }

  async function updateRole(id: string, newRole: 'admin' | 'yuvak') {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id);

    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, role: newRole } : p))
      );
    } else {
      alert(`Error: ${error.message}`);
    }
  }

  const filtered = profiles.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            યુવક ઓનબોર્ડિંગ & રોલ મેનેજમેન્ટ
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            સેવા આપતા યુવકોની યાદી, સ્થિતિ અને રોલ ફાળવણી
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchProfiles}
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
            <span>નવા યુવક ઉમેરો</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="નામ અથવા ઈમેલ વડે શોધો..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/[0.03] border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-5">નામ</th>
                <th className="py-3.5 px-5">ઈમેલ</th>
                <th className="py-3.5 px-5">રોલ (Role)</th>
                <th className="py-3.5 px-5">સ્થિતિ</th>
                <th className="py-3.5 px-5 text-right">ક્રિયા</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2 text-amber-400" size={24} />
                    વિગતો લોડ થઈ રહી છે...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    કોઈ રેકોર્ડ મળ્યો નથી.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-5 font-medium text-white flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-amber-400">
                        {user.name ? user.name[0]?.toUpperCase() : 'U'}
                      </div>
                      <span>{user.name || '—'}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">{user.email}</td>
                    <td className="py-3.5 px-5">
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value as 'admin' | 'yuvak')}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none transition ${
                          user.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        <option value="yuvak" className="bg-slate-900 text-white">Yuvak</option>
                        <option value="admin" className="bg-slate-900 text-white">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => toggleStatus(user.id, user.is_active)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                          user.is_active
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        {user.is_active ? 'એક્ટિવ' : 'નિષ્ક્રિય'}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(user)}
                          title="એડિટ કરો"
                          className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-amber-400 hover:bg-white/5 transition"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => toggleStatus(user.id, user.is_active)}
                          title={user.is_active ? 'નિષ્ક્રિય કરો' : 'સક્રિય કરો'}
                          className={`p-1.5 rounded-lg border text-xs font-medium transition ${
                            user.is_active
                              ? 'border-rose-500/20 text-rose-400 hover:bg-rose-500/10'
                              : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {user.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white">
                {editingUser ? 'યુવક માહિતી સુધારો' : 'નવો યુવક ઉમેરો'}
              </h2>
              <button
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

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  પૂરું નામ (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="દા.ત. નીરવ પટેલ"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  ઈમેલ સરનામું (Email) *
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yuvak@mandir.local"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    પ્રારંભિક પાસવર્ડ (Password)
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Baps@12345"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    ડિફૉલ્ટ પાસવર્ડ: Baps@12345
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  રોલ ફાળવણી (Role)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('yuvak')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                      role === 'yuvak'
                        ? 'border-blue-400 bg-blue-500/10 text-blue-200'
                        : 'border-white/10 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <User size={15} />
                    <span>યુવક (Yuvak)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                      role === 'admin'
                        ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                        : 'border-white/10 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Shield size={15} />
                    <span>એડમિન (Admin)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition"
                >
                  {formBusy && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingUser ? 'અપડેટ કરો' : 'ઉમેરો'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}