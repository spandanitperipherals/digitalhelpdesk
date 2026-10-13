import { createClient } from '@/lib/supabase/server';
import { FolderSync, MessageSquare, Users, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export const revalidate = 0; // લાઈવ ડેટા મેળવવા માટે

export default async function ReportsPage() {
  const supabase = await createClient();

  // ૧. પૂજ્ય સંતોની સંખ્યા
  const { count: santsCount } = await supabase.from('sants').select('*', { count: 'exact', head: true });

  // ૨. એક્ટિવ યુવકોની સંખ્યા
  const { count: activeYuvaks } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'yuvak')
    .eq('is_active', true);

  // ૩. ડિસ્પેચ મેસેજીસ સંખ્યા
  const { count: totalDispatched } = await supabase.from('dispatch_logs').select('*', { count: 'exact', head: true });

  // ૪. તાજેતરના લૉગ્સ
  const { data: recentLogs } = await supabase
    .from('dispatch_logs')
    .select('*, sants(name)')
    .order('created_at', { ascending: false })
    .limit(8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">લાઈવ રિપોર્ટિંગ & એનાલિટિક્સ</h1>
        <p className="text-sm text-slate-500">ડ્રાઇવ ફોલ્ડર સિંક સ્ટેટસ, ડિસ્પેચ ટ્રાફિક અને સેવા સંચાલન વિગતો</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">નોંધાયેલા સંતો</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{santsCount || 0}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <FolderSync size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">સક્રિય યુવકો</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeYuvaks || 0}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">કુલ ડિસ્પેચ સંદેશ</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalDispatched || 0}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <MessageSquare size={24} />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ડ્રાઇવ સિંક સ્ટેટસ</p>
            <h3 className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <CheckCircle size={18} /> ઓનલાઈન
            </h3>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* ડિસ્પેચ વિગતોનું લાઈવ ટેબલ */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 font-semibold text-sm text-slate-800">
          તાજેતરના ડિસ્પેચ થયેલા મેસેજીસ (Live Logs)
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium">
            <tr>
              <th className="py-3 px-4">ચેનલ</th>
              <th className="py-3 px-4">સંત / પ્રાપ્તકર્તા</th>
              <th className="py-3 px-4">સ્થિતિ</th>
              <th className="py-3 px-4">તારીખ & સમય</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!recentLogs || recentLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">કોઈ લૉગ્સ મળ્યા નથી.</td>
              </tr>
            ) : (
              recentLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold uppercase text-xs text-indigo-700">{log.channel}</td>
                  <td className="py-3 px-4 text-slate-700">{log.sants?.name || log.recipient}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle size={12} /> {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {new Intl.DateTimeFormat('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(log.created_at))}
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