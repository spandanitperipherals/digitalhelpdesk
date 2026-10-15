'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type RequestStatus = 'Pending' | 'In-Progress' | 'Closed_by_Sant' | 'Completed';
type QueueFilter = 'All' | 'Pending' | 'In-Progress' | 'Completed';

interface ServiceRequest {
  id: number;
  ticket_id: string;
  subject: string;
  description: string;
  status: RequestStatus;
  channel: 'Email' | 'Telegram' | 'WhatsApp';
  created_at: string;
  sants: {
    name: string;
    shared_folder_link: string;
  } | null;
  request_amendments?: {
    id: number;
    type: string;
    notes: string;
    created_at: string;
  }[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

const navItems: { label: string; filter: QueueFilter; icon: string }[] = [
  { label: 'ડેશબોર્ડ', filter: 'All', icon: 'grid' },
  { label: 'પેન્ડિંગ', filter: 'Pending', icon: 'clock' },
  { label: 'ચાલુ કાર્યો', filter: 'In-Progress', icon: 'gear' },
  { label: 'પૂર્ણ થયેલ', filter: 'Completed', icon: 'check' },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'grid':
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case 'inbox':
      return <svg {...common}><path d="M4 4h16l1 11h-5l-2 3h-4l-2-3H3L4 4Z" /><path d="M3.5 15h5l2 3h3l2-3h5" /><path d="M9 9h6" /></svg>;
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'gear':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.1.9-1.1 1.9-1.4-.5a7.8 7.8 0 0 1-1.7 1l-.2 1.5h-2.2l-.3-1.5a7.8 7.8 0 0 1-1.8-.1l-1 1.1-1.9-1.1.5-1.4a7.8 7.8 0 0 1-1-1.7l-1.5-.2v-2.2l1.5-.3a7.8 7.8 0 0 1 .1-1.8l-1.1-1 1.1-1.9 1.4.5a7.8 7.8 0 0 1 1.7-1l.2-1.5h2.2l.3 1.5a7.8 7.8 0 0 1 1.8.1l1-1.1 1.9 1.1-.5 1.4a7.8 7.8 0 0 1 1 1.7l1.5.2v2.2l-1.5.3a7.8 7.8 0 0 1-.1 1.8Z" transform="translate(-1 -1) scale(1.08)" /></svg>;
    case 'check':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 9" /></svg>;
    case 'file':
      return <svg {...common}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></svg>;
    case 'arrow':
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'bell':
      return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case 'spark':
      return <svg {...common}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></svg>;
    case 'user':
      return <svg {...common}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'logout':
      return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
    case 'settings':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    default:
      return null;
  }
}

function getStatusLabel(status: RequestStatus) {
  switch (status) {
    case 'Pending':
      return 'પેન્ડિંગ';
    case 'In-Progress':
      return 'ચાલુ છે';
    case 'Completed':
      return 'પૂર્ણ';
    case 'Closed_by_Sant':
      return 'બંધ';
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function YuvakQueuePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<QueueFilter>('All');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // Header Dropdown States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Profile & Password Edit State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // લૉગિન યુઝર પ્રોફાઇલ મેળવવી
  useEffect(() => {
    async function loadCurrentProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserProfile(profile as UserProfile);
          setEditName(profile.name || '');
        } else {
          setUserProfile({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || 'યુવક',
            email: session.user.email || '',
            role: 'yuvak',
          });
          setEditName(session.user.user_metadata?.full_name || '');
        }
      }
    }
    loadCurrentProfile();
  }, []);

  // બહાર ક્લિક કરવાથી ડ્રોપડાઉન બંધ કરવું
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*, sants(name, shared_folder_link), request_amendments(*)')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMessage(`વિનંતીઓ લોડ થઈ શકી નથી: ${error.message}`);
    } else {
      setErrorMessage('');
      setRequests((data ?? []) as ServiceRequest[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchRequests();

    const channel = supabase
      .channel('realtime_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        void fetchRequests();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'request_amendments' }, () => {
        void fetchRequests();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  const counts = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((request) => request.status === 'Pending').length,
    inProgress: requests.filter((request) => request.status === 'In-Progress').length,
    completed: requests.filter((request) => request.status === 'Completed').length,
  }), [requests]);

  const visibleRequests = useMemo(
    () => filter === 'All' ? requests : requests.filter((request) => request.status === filter),
    [filter, requests]
  );

  // લૉગ આઉટ હેન્ડલર
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // પ્રોફાઇલ સેટિંગ્સ અપડેટ હેન્ડલર
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg(null);

    try {
      if (userProfile && editName.trim()) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: editName.trim() })
          .eq('id', userProfile.id);

        if (profileError) throw profileError;
        setUserProfile((prev) => prev ? { ...prev, name: editName.trim() } : null);
      }

      if (newPassword.trim()) {
        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword.trim(),
        });
        if (passError) throw passError;
        setNewPassword('');
      }

      setSettingsMsg({ type: 'success', text: 'પ્રોફાઇલ વિગતો સફળતાપૂર્વક અપડેટ થઈ.' });
      setTimeout(() => setShowSettingsModal(false), 1200);
    } catch (err: any) {
      setSettingsMsg({ type: 'error', text: err.message || 'અપડેટ કરવામાં ભૂલ આવી.' });
    } finally {
      setSettingsLoading(false);
    }
  };

  const startTask = async (id: number) => {
    setActionError('');
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'In-Progress', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setActionError(`કાર્ય શરૂ થઈ શક્યું નથી: ${error.message}`);
      return;
    }
    await fetchRequests();
  };

  const handleCompleteTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRequest || !uploadFile) return;

    // ૧. Vercel લિમિટ (4.5 MB) માટે ક્લાયન્ટ-સાઇડ ચેક
    const MAX_SIZE_MB = 4.2;
    if (uploadFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setActionError(
        `ફાઈલનું કદ ઘણું મોટું (${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB) છે. Vercel સર્વર મર્યાદા 4.2 MB છે. કૃપા કરીને ફાઈલ કમ્પ્રેસ કરો અથવા નાની ફાઈલ પસંદ કરો.`
      );
      return;
    }

    setSubmitting(true);
    setActionError('');
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await fetch(`/api/requests/${selectedRequest.id}/complete`, {
        method: 'POST',
        body: formData,
      });

      // ૨. સેફ રિસ્પોન્સ રીડિંગ (પ્લેઇન ટેક્સ્ટ કે JSON બંને હેન્ડલ થશે)
      const rawText = await response.text();
      let result: any = {};
      try {
        result = JSON.parse(rawText);
      } catch {
        result = { error: rawText };
      }

      if (!response.ok) {
        if (response.status === 413 || rawText.includes('Request Entity Too Large')) {
          setActionError('ફાઈલનું કદ સર્વર લિમિટ (4.5 MB) કરતાં મોટું હોવાથી અપલોડ થઈ શકી નથી.');
        } else {
          setActionError(result.error || 'ફાઇલ અપલોડ કરવામાં અણધારી ભૂલ આવી.');
        }
        return;
      }

      setSelectedRequest(null);
      setUploadFile(null);
      await fetchRequests();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'નેટવર્ક ભૂલ થઈ.');
    } finally {
      setSubmitting(false);
    }
  };

  const chartTotal = counts.pending + counts.inProgress + counts.completed;
  const pendingDegrees = chartTotal ? (counts.pending / chartTotal) * 360 : 0;
  const progressDegrees = chartTotal ? (counts.inProgress / chartTotal) * 360 : 0;
  const completedDegrees = chartTotal ? (counts.completed / chartTotal) * 360 : 0;
  const progressStart = pendingDegrees;
  const completedStart = pendingDegrees + progressDegrees;
  const chartStyle = {
    background: chartTotal
      ? `conic-gradient(#e9a929 0deg ${pendingDegrees}deg, #2e82cc ${pendingDegrees}deg ${completedStart}deg, #159b78 ${completedStart}deg ${pendingDegrees + progressDegrees + completedDegrees}deg, #e9edf3 ${pendingDegrees + progressDegrees + completedDegrees}deg 360deg)`
      : '#e9edf3',
  };

  // અવતાર માટે અક્ષરો (દા.ત. Dhaval -> DH, Jignesh -> JV)
  const userInitials = useMemo(() => {
    if (!userProfile?.name) return 'JV';
    const parts = userProfile.name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return userProfile.name.slice(0, 2).toUpperCase();
  }, [userProfile]);

  return (
    <div className="min-h-screen w-full bg-[#f4f7fb] text-[#14233d] flex flex-col lg:flex-row antialiased">
      {/* Sidebar */}
      <aside className="w-full shrink-0 flex-col bg-[#0b2445] text-white flex lg:w-64 xl:w-72">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4cf7a] to-[#d89725] text-xl font-bold text-[#10294d] shadow-lg">
            ૐ
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide">BAPS Atladara</p>
            <p className="mt-0.5 text-xs text-blue-100/70">Computer Room</p>
          </div>
        </div>

        <div className="px-4 pt-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/45">મેનુ</p>
          <nav aria-label="મુખ્ય મેનુ" className="flex gap-2 overflow-x-auto pb-3 lg:flex-col lg:overflow-visible">
            {navItems.map((item, index) => {
              const isActive = index === 0 ? filter === 'All' : filter === item.filter && (item.filter !== 'All' || filter === 'All');
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setFilter(item.filter);
                    document.getElementById('requests')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition ${
                    isActive
                      ? 'bg-[#f0bb4f] font-semibold text-[#10294d] shadow-md shadow-black/10'
                      : 'text-blue-50/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                  {item.filter !== 'All' && (
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] ${isActive ? 'bg-white/50' : 'bg-white/10'}`}>
                      {item.filter === 'Pending' ? counts.pending : item.filter === 'In-Progress' ? counts.inProgress : counts.completed}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto hidden px-4 pb-5 pt-8 lg:block">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#153967] to-[#102b50] p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#f0bb4f]">
              <Icon name="spark" size={21} />
            </div>
            <p className="text-sm font-semibold">સેવા એ જ સાધના</p>
            <p className="mt-1 text-xs leading-5 text-blue-100/60">ટેકનોલોજી દ્વારા સત્સંગની સેવામાં સહભાગી બનો.</p>
            <div className="mt-4 h-px bg-gradient-to-r from-[#f0bb4f]/70 to-transparent" />
            <p className="mt-3 text-[10px] tracking-wide text-blue-100/50">BAPS MANDIR · ATLADARA</p>
          </div>
        </div>
      </aside>

      {/* Main Screen Content */}
      <main className="w-full min-w-0 flex-1 flex flex-col">
        {/* Header with Functional Dropdowns */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3.5 backdrop-blur-xl sm:px-8">
          <div>
            <p className="text-xs font-medium text-slate-500">સેવા વ્યવસ્થાપન / ડેશબોર્ડ</p>
            <h1 className="mt-0.5 text-lg font-bold text-[#10294d] sm:text-xl">કોમ્પ્યુટર રૂમ હેલ્પડેસ્ક</h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-700">{userProfile?.name || 'સેવા પોર્ટલ'}</p>
              <p className="mt-0.5 text-[11px] text-slate-400 capitalize">{userProfile?.role || 'અતલાદરા મંદિર'}</p>
            </div>

            {/* Notification Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <Icon name="bell" size={18} />
                {counts.pending > 0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#df9b24] animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-sm text-[#122b4c]">સૂચનાઓ (Notifications)</h3>
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                      {counts.pending} પેન્ડિંગ
                    </span>
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {requests.slice(0, 5).map((req) => (
                      <div key={req.id} className="py-2.5 hover:bg-slate-50 px-2 rounded-xl transition">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                            {req.subject || req.description}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            req.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {getStatusLabel(req.status)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {req.sants?.name || 'પૂજ્ય સંત'} • {formatDate(req.created_at)}
                        </p>
                      </div>
                    ))}
                    {requests.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-6">કોઈ નવી સૂચના નથી.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8eff9] text-sm font-bold text-[#153967] ring-2 ring-white hover:ring-amber-400 transition"
              >
                {userInitials}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="border-b border-slate-100 pb-3 px-2">
                    <p className="text-xs font-bold text-slate-800">{userProfile?.name || 'યુવક સેવક'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{userProfile?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      રોલ: {userProfile?.role || 'yuvak'}
                    </span>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsModal(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-100 transition"
                    >
                      <Icon name="settings" size={16} />
                      <span>પ્રોફાઇલ સેટિંગ્સ</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 rounded-xl hover:bg-rose-50 transition"
                    >
                      <Icon name="logout" size={16} />
                      <span>લૉગ આઉટ (Sign Out)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 100% Fluid Width Body Container */}
        <div className="w-full flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Welcome Banner */}
          <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#112e54] via-[#183e6a] to-[#285682] px-6 py-7 text-white shadow-[0_14px_38px_rgba(18,48,83,0.18)] sm:px-9 sm:py-8">
            <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-1 top-4 h-44 w-44 rounded-full border border-[#f0bb4f]/25" />
            <div className="pointer-events-none absolute right-12 top-12 h-24 w-24 rounded-full bg-[#f0bb4f]/10 blur-2xl" />
            <div className="relative max-w-2xl">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f4d38f]">
                <span className="h-px w-7 bg-[#f0bb4f]" /> ડિજિટલ સેવા · સત્સંગની સેવા
              </p>
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl">જય સ્વામિનારાયણ, {userProfile?.name?.split(' ')[0] || 'યુવક'}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                કોમ્પ્યુટર રૂમ સેવા ડેશબોર્ડમાં આપનું સ્વાગત છે. સંતો તરફથી આવેલી વિનંતીઓનું સંચાલન અહીંથી કરો.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilter('Pending');
                  document.getElementById('requests')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#f0bb4f] px-4 py-2.5 text-sm font-bold text-[#10294d] shadow-lg shadow-black/10 transition hover:bg-[#f5cc78]"
              >
                પેન્ડિંગ વિનંતીઓ જુઓ <Icon name="arrow" size={16} />
              </button>
            </div>
            <div className="absolute bottom-0 right-8 hidden h-32 w-64 items-end justify-center opacity-40 md:flex" aria-hidden="true">
              <svg viewBox="0 0 240 105" className="h-full w-full text-[#f0bb4f]" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 100h204M33 100V61h18v39m139 0V61h18v39M60 100V47h24v53m72 0V47h24v53M88 100V39h64v61M96 39V28l24-20 24 20v11M105 29h30M114 18v21m6-31v53m-79 7V59l11-12 11 12v21m128 0V59l11-12 11 12v21M27 61h34m112 0h34M54 47l6-8 6 8m108 0 6-8 6 8M84 47h72M18 100h204" />
                <path d="M18 100c0-8 5-12 10-12s10 4 10 12m164 0c0-8 5-12 10-12s10 4 10 12" />
              </svg>
            </div>
          </section>

          {errorMessage && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {errorMessage}
              <button type="button" onClick={() => void fetchRequests()} className="ml-3 font-semibold underline">ફરી પ્રયાસ કરો</button>
            </div>
          )}
          {actionError && !selectedRequest && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{actionError}</div>
          )}

          {/* Stats Bar */}
          <section aria-label="Request statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { title: 'કુલ વિનંતીઓ', amount: counts.total, description: 'બધી સેવા વિનંતીઓ', icon: 'file', color: 'amber' },
              { title: 'પેન્ડિંગ', amount: counts.pending, description: 'સ્વીકારવાની બાકી', icon: 'clock', color: 'rose' },
              { title: 'ચાલુ કાર્યો', amount: counts.inProgress, description: 'હાલમાં કાર્યરત', icon: 'gear', color: 'blue' },
              { title: 'પૂર્ણ થયેલ', amount: counts.completed, description: 'સેવા પૂર્ણ થઈ', icon: 'check', color: 'green' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_16px_rgba(20,45,75,0.04)] sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{item.title}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-[#122b4c]">{loading ? '—' : item.amount}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    item.color === 'amber' ? 'bg-[#fff3d8] text-[#b47a0c]' :
                    item.color === 'rose' ? 'bg-[#fff0ef] text-[#c65048]' :
                    item.color === 'blue' ? 'bg-[#eaf3ff] text-[#2875bd]' :
                    'bg-[#e6f7f0] text-[#168566]'
                  }`}>
                    <Icon name={item.icon} size={22} />
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">{item.description}</p>
              </div>
            ))}
          </section>

          {/* 2-Column Responsive Split */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <section id="requests" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_16px_rgba(20,45,75,0.04)]">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold text-[#122b4c]">તાજેતરની વિનંતીઓ</h2>
                    <p className="mt-1 text-xs text-slate-400">વિનંતીઓનું લાઇવ અપડેટ</p>
                  </div>
                  <div className="flex items-center gap-2 self-start rounded-full bg-[#eff9f4] px-3 py-1.5 text-[11px] font-semibold text-[#178565] sm:self-auto">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    લાઇવ સિંક સક્રિય
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3">
                  {([
                    ['All', 'બધી'],
                    ['Pending', 'પેન્ડિંગ'],
                    ['In-Progress', 'ચાલુ'],
                    ['Completed', 'પૂર્ણ'],
                  ] as [QueueFilter, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        filter === key ? 'bg-[#102f55] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="space-y-3 p-5" aria-label="Loading requests">
                    {[1, 2, 3].map((row) => <div key={row} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
                  </div>
                ) : visibleRequests.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="inbox" size={23} /></div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">અહીં કોઈ વિનંતી નથી</p>
                    <p className="mt-1 text-xs text-slate-400">નવી વિનંતી આવશે ત્યારે અહીં દેખાશે.</p>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[690px] text-left text-xs">
                        <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <tr>
                            <th className="px-5 py-3">ટિકિટ / વિનંતી</th>
                            <th className="px-4 py-3">વિનંતી કરનાર</th>
                            <th className="px-4 py-3">માધ્યમ</th>
                            <th className="px-4 py-3">સ્થિતિ</th>
                            <th className="px-5 py-3">તારીખ</th>
                            <th className="px-5 py-3 text-right">ક્રિયા</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visibleRequests.map((request) => (
                            <tr key={request.id} className="transition hover:bg-slate-50/80">
                              <td className="px-5 py-4">
                                <p className="font-semibold text-[#19385e]">{request.subject || request.description}</p>
                                <p className="mt-1 text-[10px] text-slate-400">{request.ticket_id}</p>
                                {!!request.request_amendments?.length && (
                                  <p className="mt-1 max-w-[260px] truncate text-[10px] text-[#a77413]" title={request.request_amendments[request.request_amendments.length - 1].notes}>
                                    સૂચના: {request.request_amendments[request.request_amendments.length - 1].notes}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-4 text-slate-600">{request.sants?.name || 'સંત'}</td>
                              <td className="px-4 py-4 text-slate-500">{request.channel}</td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                  request.status === 'Pending' ? 'bg-[#fff5dc] text-[#a77413]' :
                                  request.status === 'In-Progress' ? 'bg-[#eaf3ff] text-[#2774bb]' :
                                  request.status === 'Completed' ? 'bg-[#e7f7f0] text-[#168363]' :
                                  'bg-slate-100 text-slate-500'
                                }`}>{getStatusLabel(request.status)}</span>
                              </td>
                              <td className="px-5 py-4 text-slate-500">{formatDate(request.created_at)}</td>
                              <td className="px-5 py-4 text-right">
                                {request.status === 'Pending' && (
                                  <button type="button" onClick={() => void startTask(request.id)} className="whitespace-nowrap rounded-lg bg-[#102f55] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#1c4777]">
                                    કાર્ય સ્વીકારો
                                  </button>
                                )}
                                {request.status === 'In-Progress' && (
                                  <button type="button" onClick={() => { setActionError(''); setSelectedRequest(request); }} className="whitespace-nowrap rounded-lg bg-[#16896e] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#11785f]">
                                    ફાઇલ અપલોડ કરો
                                  </button>
                                )}
                                {(request.status === 'Completed' || request.status === 'Closed_by_Sant') && <span className="text-[10px] text-slate-400">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="divide-y divide-slate-100 md:hidden">
                      {visibleRequests.map((request) => (
                        <article key={request.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#19385e]">{request.subject || request.description}</p>
                              <p className="mt-1 text-[10px] text-slate-400">{request.ticket_id} · {request.sants?.name || 'સંત'}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              request.status === 'Pending' ? 'bg-[#fff5dc] text-[#a77413]' :
                              request.status === 'In-Progress' ? 'bg-[#eaf3ff] text-[#2774bb]' :
                              request.status === 'Completed' ? 'bg-[#e7f7f0] text-[#168363]' :
                              'bg-slate-100 text-slate-500'
                            }`}>{getStatusLabel(request.status)}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{request.channel}</span><span>{formatDate(request.created_at)}</span>
                          </div>
                          {!!request.request_amendments?.length && (
                            <div className="mt-3 rounded-lg bg-[#fff8e8] px-3 py-2 text-[10px] leading-4 text-[#8d641a]">
                              નવી સૂચના: {request.request_amendments[request.request_amendments.length - 1].notes}
                            </div>
                          )}
                          {request.status === 'Pending' && (
                            <button type="button" onClick={() => void startTask(request.id)} className="mt-3 w-full rounded-lg bg-[#102f55] px-3 py-2 text-xs font-semibold text-white">કાર્ય શરૂ કરો</button>
                          )}
                          {request.status === 'In-Progress' && (
                            <button type="button" onClick={() => { setActionError(''); setSelectedRequest(request); }} className="mt-3 w-full rounded-lg bg-[#16896e] px-3 py-2 text-xs font-semibold text-white">ફાઇલ અપલોડ કરો</button>
                          )}
                        </article>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                      <p className="text-[11px] text-slate-400">કુલ {visibleRequests.length} વિનંતીઓ</p>
                      <button type="button" onClick={() => setFilter('All')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2c6da8] hover:text-[#102f55]">
                        બધી જુઓ <Icon name="arrow" size={13} />
                      </button>
                    </div>
                  </>
                )}
              </section>

              {/* Service Flow Section */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_16px_rgba(20,45,75,0.04)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-[#122b4c]">સેવા પ્રવાહ</h2>
                    <p className="mt-1 text-xs text-slate-400">વિનંતીથી પૂર્ણતા સુધીની પ્રગતિ</p>
                  </div>
                  <div className="rounded-xl bg-[#fff5df] p-2.5 text-[#b47a0c]"><Icon name="spark" size={19} /></div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    { label: 'મળેલી', number: counts.total, color: 'bg-[#e9a929]' },
                    { label: 'ચાલુ', number: counts.inProgress, color: 'bg-[#2e82cc]' },
                    { label: 'પૂર્ણ', number: counts.completed, color: 'bg-[#159b78]' },
                  ].map((step, index) => (
                    <div key={step.label} className="relative rounded-xl bg-[#f8fafc] px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${step.color}`} />
                        <span className="text-[11px] font-medium text-slate-500">{step.label}</span>
                      </div>
                      <p className="mt-2 text-xl font-bold text-[#15365c]">{loading ? '—' : step.number}</p>
                      {index < 2 && <span className="absolute -right-1 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 sm:block">›</span>}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Aside Stats Column */}
            <aside className="space-y-6">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_16px_rgba(20,45,75,0.04)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-[#122b4c]">કાર્ય સ્થિતિ</h2>
                    <p className="mt-1 text-xs text-slate-400">વિનંતીઓનું વિતરણ</p>
                  </div>
                  <button type="button" aria-label="Refresh requests" onClick={() => void fetchRequests()} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#153967]">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.7-2L20 12M4 12l2.7 5a7 7 0 0 0 11.7-2" /></svg>
                  </button>
                </div>
                <div className="mt-6 flex items-center justify-center">
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full" style={chartStyle}>
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                      <span className="text-3xl font-bold text-[#122b4c]">{loading ? '—' : chartTotal}</span>
                      <span className="mt-0.5 text-[10px] text-slate-400">કુલ કાર્યો</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { label: 'પેન્ડિંગ', amount: counts.pending, color: 'bg-[#e9a929]' },
                    { label: 'ચાલુ છે', amount: counts.inProgress, color: 'bg-[#2e82cc]' },
                    { label: 'પૂર્ણ', amount: counts.completed, color: 'bg-[#159b78]' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-600"><span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />{item.label}</span>
                      <span className="font-bold text-[#17375c]">{loading ? '—' : item.amount}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_16px_rgba(20,45,75,0.04)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-[#122b4c]">તમારા આગળના કાર્યો</h2>
                    <p className="mt-1 text-xs text-slate-400">ધ્યાન આપવા જેવી વિનંતીઓ</p>
                  </div>
                  <span className="rounded-lg bg-[#fff5df] px-2.5 py-1 text-[10px] font-bold text-[#a77413]">{counts.pending + counts.inProgress} બાકી</span>
                </div>
                <div className="mt-4 space-y-1">
                  {requests.filter((request) => request.status === 'Pending' || request.status === 'In-Progress').slice(0, 5).map((request, index) => (
                    <div key={request.id} className="flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        index % 3 === 0 ? 'bg-[#fff0db] text-[#bd7c12]' : index % 3 === 1 ? 'bg-[#e8f1ff] text-[#3479bd]' : 'bg-[#e8f7f1] text-[#168566]'
                      }`}>{(request.sants?.name || 'સ').slice(0, 1)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[#17375c]">{request.subject || request.description}</p>
                        <p className="mt-1 truncate text-[10px] text-slate-400">{request.sants?.name || 'સંત'} · {request.ticket_id}</p>
                        <div className="mt-2">
                          {request.status === 'Pending' ? (
                            <button type="button" onClick={() => void startTask(request.id)} className="text-[10px] font-bold text-[#3479bd] hover:underline">કાર્ય સ્વીકારો →</button>
                          ) : (
                            <button type="button" onClick={() => { setActionError(''); setSelectedRequest(request); }} className="text-[10px] font-bold text-[#168566] hover:underline">પૂર્ણ કરવા અપલોડ કરો →</button>
                          )}
                        </div>
                      </div>
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${request.status === 'Pending' ? 'bg-[#e9a929]' : 'bg-[#2e82cc]'}`} />
                    </div>
                  ))}
                  {!loading && requests.every((request) => request.status !== 'Pending' && request.status !== 'In-Progress') && (
                    <div className="rounded-xl bg-[#f8fafc] px-3 py-6 text-center text-xs text-slate-400">આગળ કોઈ કાર્ય બાકી નથી. સરસ સેવા!</div>
                  )}
                  {loading && [1, 2, 3].map((row) => <div key={row} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
                </div>
              </section>

              <div className="rounded-2xl border border-[#f0dfbc] bg-gradient-to-br from-[#fff9eb] to-[#fffdf8] p-4">
                <p className="text-xs font-semibold text-[#8d641a]">સેવામાં જ સુખ</p>
                <p className="mt-1 text-[11px] leading-5 text-[#927d58]">દરેક નાની સેવા પણ ભક્તિનો અમૂલ્ય ભાગ છે.</p>
              </div>
            </aside>
          </div>

          <footer className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 px-2 py-4 text-[10px] text-slate-400 sm:flex-row">
            <span>© BAPS Atladara Computer Room · Digital Helpdesk</span>
            <span className="flex items-center gap-1.5"><span className="text-[#c88e24]">ૐ</span> સત્સંગની સેવામાં ટેકનોલોજી</span>
          </footer>
        </div>
      </main>

      {/* Profile Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#081a31]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-[#122b4c]">પ્રોફાઇલ સેટિંગ્સ (Profile Settings)</h2>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {settingsMsg && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-medium ${
                settingsMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {settingsMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ઈમેલ સરનામું</label>
                <input
                  type="email"
                  disabled
                  value={userProfile?.email || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">પૂરું નામ (Full Name)</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#102f55]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">નવો પાસવર્ડ (જો બદલવો હોય તો જ લખો)</label>
                <input
                  type="password"
                  placeholder="નવો પાસવર્ડ દાખલ કરો..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#102f55]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={settingsLoading}
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="rounded-xl bg-[#102f55] px-4 py-2 text-xs font-bold text-white hover:bg-[#1a4478] disabled:opacity-50"
                >
                  {settingsLoading ? 'સાચવી રહ્યું છે...' : 'સાચવો'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload & Complete Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#081a31]/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setSelectedRequest(null);
              setUploadFile(null);
              setActionError('');
            }
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="complete-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f7f0] text-[#168566]">
              <Icon name="file" size={23} />
            </div>
            <h2 id="complete-title" className="text-lg font-bold text-[#122b4c]">કાર્ય પૂર્ણ કરો</h2>
            <p className="mt-1 text-xs text-slate-400">{selectedRequest.ticket_id} · {selectedRequest.sants?.name || 'સંત'}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              તૈયાર થયેલ ફાઇલ સંતના Google Drive shared folder માં અપલોડ થશે.
            </p>

            {actionError && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{actionError}</div>}

            <form onSubmit={handleCompleteTask} className="mt-5">
              <label htmlFor="complete-file" className="mb-2 block text-xs font-semibold text-slate-700">તૈયાર થયેલ ફાઇલ</label>
              <input
                id="complete-file"
                type="file"
                required
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#eaf3ff] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#2469a5] hover:file:bg-[#deebfa]"
              />
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setSelectedRequest(null);
                    setUploadFile(null);
                    setActionError('');
                  }}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={submitting || !uploadFile}
                  className="rounded-xl bg-[#16896e] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition hover:bg-[#11785f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'અપલોડ થઈ રહ્યું છે…' : 'અપલોડ અને પૂર્ણ કરો'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}