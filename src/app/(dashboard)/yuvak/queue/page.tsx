'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ServiceRequest {
  id: number;
  ticket_id: string;
  subject: string;
  description: string;
  status: 'Pending' | 'In-Progress' | 'Closed_by_Sant' | 'Completed';
  channel: 'Email' | 'Telegram' | 'WhatsApp';
  created_at: string;
  sants: {
    name: string;
    shared_folder_link: string;
  };
  request_amendments?: {
    id: number;
    type: string;
    notes: string;
    created_at: string;
  }[];
}

export default function YuvakQueuePage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ૧. રિક્વેસ્ટ્સ લોડ કરવી
  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*, sants(name, shared_folder_link), request_amendments(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    // ૨. Supabase Realtime Subscription (કોઈપણ ફેરફાર થાય ત્યારે આપોઆપ અપડેટ)
    const channel = supabase
      .channel('realtime_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests' },
        () => {
          fetchRequests();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'request_amendments' },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ૩. રિક્વેસ્ટ સ્વીકારવી (Acknowledge / In-Progress)
  const handleAcknowledge = async (id: number) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'In-Progress', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      fetchRequests();
    }
  };

  // ૪. કાર્ય પૂર્ણ કરવું અને દસ્તાવેજ અપલોડ
  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !uploadFile) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/complete`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        alert('કાર્ય સફળતાપૂર્વક સંપન્ન થયું!');
        setSelectedRequest(null);
        setUploadFile(null);
        fetchRequests();
      } else {
        alert(`ભૂલ: ${result.error}`);
      }
    } catch (err: any) {
      alert(`નેટવર્ક ભૂલ: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">પેન્ડિંગ (Pending)</span>;
      case 'In-Progress':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium animate-pulse">ચાલુ છે (In-Progress)</span>;
      case 'Closed_by_Sant':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-medium">સંત દ્વારા રદ (Closed by Sant)</span>;
      case 'Completed':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">સંપન્ન (Completed)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">કોમ્પ્યુટર વર્કશોપ સેવા ક્યુ (Live Queue)</h1>
            <p className="text-sm text-slate-500 mt-1">પૂજ્ય સંતો તરફથી આવેલ સેવા વિનંતીઓનું રીઅલ-ટાઇમ મોનિટરિંગ</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-slate-600 font-medium">રીઅલ-ટાઇમ સિન્ક સક્રિય</span>
          </div>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">વિનંતીઓ લોડ થઈ રહી છે...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
            હાલમાં કોઈ પેન્ડિંગ રિક્વેસ્ટ ઉપલબ્ધ નથી.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {req.ticket_id}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  <h3 className="font-semibold text-slate-900 text-base mb-1">
                    {req.sants?.name || 'પૂજ્ય સંત'}
                  </h3>

                  <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <span>ચેનલ:</span>
                    <span className="font-medium text-slate-700">{req.channel}</span>
                  </div>

                  <p className="text-sm text-slate-700 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                    {req.description}
                  </p>

                  {/* સુધારા / અમેન્ડમેન્ટ એલર્ટ બેજ */}
                  {req.request_amendments && req.request_amendments.length > 0 && (
                    <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
                      <span className="font-bold">⚠️ સુધારો / નવી સૂચના ({req.request_amendments.length}):</span>
                      <p className="mt-0.5 text-amber-800 line-clamp-2">
                        {req.request_amendments[req.request_amendments.length - 1].notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* એક્શન બટન્સ */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  {req.status === 'Pending' && (
                    <button
                      onClick={() => handleAcknowledge(req.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition"
                    >
                      સ્વીકારો (Start Task)
                    </button>
                  )}

                  {req.status === 'In-Progress' && (
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition"
                    >
                      દસ્તાવેજ અપલોડ & પૂર્ણ કરો
                    </button>
                  )}

                  {req.status === 'Closed_by_Sant' && (
                    <span className="text-xs text-slate-400 italic text-center w-full">
                      સંત દ્વારા વિનંતી પૂર્ણ/રદ કરવામાં આવી છે
                    </span>
                  )}

                  {req.status === 'Completed' && (
                    <span className="text-xs text-emerald-600 font-medium text-center w-full">
                      ✓ દસ્તાવેજ સંતના ફોલ્ડરમાં મોકલાઈ ગયો
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                કાર્ય પૂર્ણ કરો: {selectedRequest.ticket_id}
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                {selectedRequest.sants?.name} ના નિર્ધારિત Google Drive Shared Folder માં તૈયાર થયેલ ફાઇલ અપલોડ થશે.
              </p>

              <form onSubmit={handleCompleteTask}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    તૈયાર થયેલ ફાઇલ પસંદ કરો
                  </label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg p-2"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setSelectedRequest(null);
                      setUploadFile(null);
                    }}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    રદ કરો
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !uploadFile}
                    className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'અપલોડ થઈ રહ્યું છે...' : 'અપલોડ & કમ્પ્લીટ કરો'}
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