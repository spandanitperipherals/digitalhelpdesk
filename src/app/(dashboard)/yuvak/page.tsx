'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, CheckCircle2, PlayCircle, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function YuvakDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
  });

  useEffect(() => {
    async function loadStats() {
      // dispatch_logs અથવા વિનંતીઓના ટેબલમાંથી આંકડા મેળવો
      const { data: logs } = await supabase.from('dispatch_logs').select('status');
      if (logs) {
        setStats({
          total: logs.length,
          pending: logs.filter((l) => l.status === 'pending').length,
          in_progress: logs.filter((l) => l.status === 'in_progress' || l.status === 'processing').length,
          completed: logs.filter((l) => l.status === 'completed' || l.status === 'dispatched').length,
        });
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 p-6 md:p-8 border border-white/10 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-3">
            ડિજિટલ સેવા • સત્સંગની સેવા
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            જય સ્વામિનારાયણ, યુવક
          </h1>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            કોમ્પ્યુટર રૂમ સેવા ડેશબોર્ડમાં આપનું સ્વાગત છે. પૂજ્ય સંતો તરફથી આવેલી વિનંતીઓનું સંચાલન અહીંથી કરો.
          </p>
          <Link
            href="/yuvak/queue"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition"
          >
            <span>પેન્ડિંગ વિનંતીઓ જુઓ</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">કુલ વિનંતીઓ</span>
            <FileText size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">બધી સેવા વિનંતીઓ</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">પેન્ડિંગ</span>
            <Clock size={18} className="text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.pending}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">સ્વીકારવાની બાકી</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">ચાલુ કાર્યો</span>
            <PlayCircle size={18} className="text-sky-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.in_progress}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">હાલમાં કાર્યરત</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">પૂર્ણ થયેલ</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.completed}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">સેવા પૂર્ણ થઈ</span>
        </div>
      </div>
    </div>
  );
}