'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, UserCheck, UserX } from 'lucide-react';

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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">યુવક ઓનબોર્ડિંગ & રોલ મેનેજમેન્ટ</h1>
        <p className="text-sm text-slate-500">સેવા આપતા યુવકોની યાદી, સ્થિતિ અને રોલ ફાળવણી</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="નામ અથવા ઈમેલ વડે શોધો..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-3 px-4">નામ</th>
              <th className="py-3 px-4">ઈમેલ</th>
              <th className="py-3 px-4">રોલ (Role)</th>
              <th className="py-3 px-4">સ્થિતિ</th>
              <th className="py-3 px-4 text-right">ક્રિયા</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  વિગતો લોડ થઈ રહી છે...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  કોઈ રેકોર્ડ મળ્યો નથી.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-800">{user.name || '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value as 'admin' | 'yuvak')}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                        user.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <option value="yuvak">Yuvak</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {user.is_active ? 'એક્ટિવ' : 'નિષ્ક્રિય'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => toggleStatus(user.id, user.is_active)}
                      className={`p-1.5 rounded-lg border text-xs font-medium transition ${
                        user.is_active
                          ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {user.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}