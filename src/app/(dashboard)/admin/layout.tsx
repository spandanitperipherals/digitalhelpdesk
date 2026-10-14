import Link from 'next/link';
import { 
  Users, 
  FolderSync, 
  Send, 
  BarChart3, 
  Webhook, 
  LogOut 
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 shadow-2xl">
        <div>
          <div className="p-5 border-b border-slate-800">
            <h1 className="text-xl font-bold tracking-wide text-amber-400">BAPS હેલ્પડેસ્ક</h1>
            <p className="text-xs text-slate-400 mt-1">વડોદરા - એડમિન પોર્ટલ</p>
          </div>

          <nav className="p-4 space-y-1.5 text-sm">
            <Link 
              href="/admin/sants" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <FolderSync size={18} className="text-amber-400" />
              <span>સંત ડિરેક્ટરી & ડ્રાઇવ</span>
            </Link>

            <Link 
              href="/admin/yuvaks" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <Users size={18} className="text-blue-400" />
              <span>યુવક ઓનબોર્ડિંગ & રોલ</span>
            </Link>

            <Link 
              href="/admin/dispatch" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <Send size={18} className="text-emerald-400" />
              <span>ડિસ્પેચ (WhatsApp/TG/Email)</span>
            </Link>

            <Link 
              href="/admin/webhooks" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <Webhook size={18} className="text-purple-400" />
              <span>વેબહુક કન્ફિગરેશન</span>
            </Link>

            <Link 
              href="/admin/reports" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <BarChart3 size={18} className="text-rose-400" />
              <span>લાઈવ રિપોર્ટિંગ</span>
            </Link>
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
          >
            <LogOut size={16} />
            <span>લૉગ આઉટ</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
          <div className="text-sm font-semibold text-slate-700">
            વડોદરા મંદિર પોર્ટલ સંચાલન
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              એડમિન કંટ્રોલ એક્ટિવ
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