'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  FolderOpen, 
  ExternalLink, 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  Loader2, 
  Search, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface DispatchTask {
  id: string;
  sant_name: string;
  title: string;
  description: string | null;
  shared_folder_link: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  assigned_to?: string;
}

export default function YuvakQueuePage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<DispatchTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ૧. કતાર (વિનંતીઓ) ફેચ કરવી
  const fetchQueue = async () => {
    setLoading(true);
    // જો ટેબલનું નામ 'dispatch_logs' અથવા 'requests' હોય તે મુજબ
    const { data, error } = await supabase
      .from('dispatch_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data as DispatchTask[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // ૨. સ્ટેટસ અપડેટ કરવું (દા.ત. pending -> in_progress -> completed)
  const updateTaskStatus = async (taskId: string, nextStatus: 'in_progress' | 'completed') => {
    setUpdatingId(taskId);
    const { error } = await supabase
      .from('dispatch_logs')
      .update({ 
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (!error) {
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
    } else {
      alert(`ભૂલ: ${error.message}`);
    }
    setUpdatingId(null);
  };

  // ફિલ્ટરિંગ
  const filteredTasks = tasks.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch = 
      t.sant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            કાર્ય કતાર (Service Queue)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            પૂજ્ય સંતો તરફથી આવેલી ફાઇલ સેવા વિનંતીઓ અને કાર્ય સંચાલન
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>રીફ્રેશ કરો</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 w-full sm:w-auto">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                statusFilter === tab
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'all' && 'બધી'}
              {tab === 'pending' && 'પેન્ડિંગ'}
              {tab === 'in_progress' && 'ચાલુ કાર્યો'}
              {tab === 'completed' && 'પૂર્ણ'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="સંત અથવા વિષય વડે શોધો..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 bg-slate-900/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Tasks Queue Grid / Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/[0.03] border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">સંત / સેવક</th>
                <th className="px-6 py-4">વિનંતી વિગત</th>
                <th className="px-6 py-4">Google Drive</th>
                <th className="px-6 py-4 text-center">સ્થિતિ</th>
                <th className="px-6 py-4 text-right">સેવા પગલું (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-400 mb-2" />
                    કતાર લોડ થઈ રહી છે...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <AlertCircle className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                    આ સ્થિતિમાં કોઈ વિનંતી પેન્ડિંગ નથી.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-semibold text-amber-400">
                          {task.sant_name ? task.sant_name[0] : 'S'}
                        </div>
                        <div>
                          <div>{task.sant_name || 'પૂજ્ય સંત'}</div>
                          <span className="text-[11px] text-slate-500">
                            {new Date(task.created_at).toLocaleDateString('gu-IN')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{task.title || 'નવી સેવા વિનંતી'}</div>
                      {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {task.shared_folder_link ? (
                        <a
                          href={task.shared_folder_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 hover:underline font-mono"
                        >
                          <FolderOpen size={14} />
                          <span>ફોલ્ડર ખોલો</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">લિંક નથી</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          task.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : task.status === 'in_progress'
                            ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            task.status === 'completed'
                              ? 'bg-emerald-400'
                              : task.status === 'in_progress'
                              ? 'bg-sky-400 animate-pulse'
                              : 'bg-amber-400'
                          }`}
                        />
                        {task.status === 'completed' && 'પૂર્ણ'}
                        {task.status === 'in_progress' && 'ચાલુ'}
                        {task.status === 'pending' && 'પેન્ડિંગ'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {updatingId === task.id ? (
                        <Loader2 size={16} className="animate-spin inline text-amber-400" />
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {task.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => updateTaskStatus(task.id, 'in_progress')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition"
                            >
                              <PlayCircle size={14} />
                              <span>સ્વીકારો & શરૂ કરો</span>
                            </button>
                          )}

                          {task.status === 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                            >
                              <CheckCircle2 size={14} />
                              <span>પૂર્ણ માર્ક કરો</span>
                            </button>
                          )}

                          {task.status === 'completed' && (
                            <span className="text-xs text-slate-500 italic">સેવા સંપન્ન</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}