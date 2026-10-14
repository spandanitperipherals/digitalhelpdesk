import Link from 'next/link';
import { 
  ListOrdered, 
  UserCheck, 
  LogOut,
  FolderOpen
} from 'lucide-react';

export default function YuvakLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* યુવક સાઇડબાર નેવિગેશન */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col justify-between shrink-0 shadow-xl">
        <div>
          <div className="p-5 border-b border-slate-700">
            <h1 className="text-xl font-bold tracking-wide text-sky-400">BAPS હેલ્પડેસ્ક</h1>
            <p className="text-xs text-slate-400 mt-1">યુવક સેવા ડેસ્ક</p>
          </div>

          <nav className="p-4 space-y-1.5 text-sm">
            <Link 
              href="/yuvak" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <UserCheck size={18} className="text-emerald-400" />
              <span>મુખ્ય ડેશબોર્ડ</span>
            </Link>

            <Link 
              href="/yuvak/queue" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <ListOrdered size={18} className="text-sky-400" />
              <span>કાર્ય કતાર (Queue)</span>
            </Link>
          </nav>
        </div>

        {/* લૉગ આઉટ બટન */}
        <div className="p-4 border-t border-slate-700">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
          >
            <LogOut size={16} />
            <span>લૉગ આઉટ</span>
          </Link>
        </div>
      </aside>

      {/* મુખ્ય પેજ કન્ટેન્ટ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
          <div className="text-sm font-semibold text-slate-700">
            યુવક કાર્યક્ષેત્ર (Yuvak Portal)
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              સેવા ઉપલબ્ધ
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}