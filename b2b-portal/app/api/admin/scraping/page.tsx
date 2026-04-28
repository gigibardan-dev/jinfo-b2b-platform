'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string;
  duration_seconds: number | null;
  triggered_by: string;
  url: string;
}

interface ScrapingStatus {
  latest_run: WorkflowRun | null;
  recent_runs: WorkflowRun[];
  workflow_url: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function StatusBadge({ status, conclusion }: { status: string; conclusion: string | null }) {
  if (status === 'in_progress' || status === 'queued') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        {status === 'queued' ? 'În așteptare' : 'În desfășurare'}
      </span>
    );
  }

  if (status === 'completed') {
    if (conclusion === 'success') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
          <span>✅</span> Succes
        </span>
      );
    }
    if (conclusion === 'failure') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
          <span>❌</span> Eșuat
        </span>
      );
    }
    if (conclusion === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
          <span>⚠️</span> Anulat
        </span>
      );
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">
      {status}
    </span>
  );
}

export default function ScrapingPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [status, setStatus] = useState<ScrapingStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Obține token-ul din sesiunea Supabase
  async function getAuthToken(): Promise<string | null> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  // Fetch status workflow
  const fetchStatus = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch('/api/admin/scraping', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // Polling la fiecare 30 secunde dacă e în desfășurare
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      if (status?.latest_run?.status === 'in_progress' || status?.latest_run?.status === 'queued') {
        fetchStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStatus, status?.latest_run?.status]);

  // Declanșează actualizarea
  async function handleTrigger() {
    setTriggering(true);
    setShowConfirm(false);
    setTriggerMessage(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setTriggerMessage({ type: 'error', text: 'Eroare de autentificare.' });
        return;
      }

      const response = await fetch('/api/admin/scraping', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setTriggerMessage({
          type: 'success',
          text: 'Actualizarea a fost declanșată! Procesul durează 60-90 minute.'
        });
        // Refresh status după 5 secunde
        setTimeout(() => fetchStatus(), 5000);
      } else {
        setTriggerMessage({ type: 'error', text: data.message || 'Eroare la declanșare.' });
      }
    } catch (error) {
      setTriggerMessage({ type: 'error', text: 'Eroare de conexiune.' });
    } finally {
      setTriggering(false);
    }
  }

  const isRunning = status?.latest_run?.status === 'in_progress' || status?.latest_run?.status === 'queued';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
              🔄
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Actualizare Circuite
              </h1>
              <p className="text-purple-100 text-sm">
                Declanșează scraping și import date circuite din jinfotours.ro
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-4">
        <span className="text-2xl">ℹ️</span>
        <div>
          <h3 className="font-bold text-blue-900 mb-1">Cum funcționează?</h3>
          <p className="text-blue-700 text-sm">
            Procesul extrage toate circuitele din jinfotours.ro (prețuri, date de plecare, imagini)
            și actualizează baza de date. Circuitele existente sunt actualizate, cele noi sunt adăugate.
            <strong> Rezervările existente nu sunt afectate.</strong>
          </p>
          <p className="text-blue-600 text-sm mt-1">
            ⏱️ Durată estimată: <strong>60-90 minute</strong>
          </p>
        </div>
      </div>

      {/* Buton Principal */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex flex-col items-center gap-6">

          {/* Status curent */}
          {!loadingStatus && status?.latest_run && (
            <div className="w-full bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Ultima actualizare</p>
                <p className="font-semibold text-gray-800">{formatDate(status.latest_run.started_at)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Durată</p>
                <p className="font-semibold text-gray-800">{formatDuration(status.latest_run.duration_seconds)}</p>
              </div>
              <div>
                <StatusBadge status={status.latest_run.status} conclusion={status.latest_run.conclusion} />
              </div>
            </div>
          )}

          {/* Mesaj trigger */}
          {triggerMessage && (
            <div className={`w-full p-4 rounded-xl flex items-center gap-3 ${
              triggerMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <span className="text-xl">{triggerMessage.type === 'success' ? '✅' : '❌'}</span>
              <p className="font-medium">{triggerMessage.text}</p>
            </div>
          )}

          {/* Buton sau confirmare */}
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={triggering || isRunning}
              className={`
                flex items-center gap-3 px-8 py-4 rounded-xl text-white font-bold text-lg
                transition-all shadow-lg
                ${isRunning
                  ? 'bg-blue-400 cursor-not-allowed'
                  : triggering
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl active:scale-95'
                }
              `}
            >
              {isRunning ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Actualizare în desfășurare...
                </>
              ) : triggering ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Se declanșează...
                </>
              ) : (
                <>
                  <span>🔄</span>
                  Actualizează Circuitele
                </>
              )}
            </button>
          ) : (
            /* Dialog confirmare */
            <div className="w-full max-w-md bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">
                Ești sigur?
              </h3>
              <p className="text-amber-700 text-sm mb-6">
                Vrei să declanșezi actualizarea circuitelor? Procesul va rula
                <strong> 60-90 minute</strong> pe serverele GitHub.
                Datele existente vor fi actualizate, rezervările nu vor fi afectate.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Anulează
                </button>
                <button
                  onClick={handleTrigger}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  Da, actualizează!
                </button>
              </div>
            </div>
          )}

          {/* Link GitHub */}
          {status?.workflow_url && (
            <a
              href={status.workflow_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
            >
              <span>👁️</span> Vezi toate rulările pe GitHub Actions
            </a>
          )}
        </div>
      </div>

      {/* Istoric rulări */}
      {status?.recent_runs && status.recent_runs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">📋 Istoric Actualizări</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {status.recent_runs.map((run) => (
              <div key={run.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-800">{formatDate(run.started_at)}</p>
                  <p className="text-sm text-gray-500">
                    {run.triggered_by === 'schedule' ? '🕐 Automat (cron)' : '👤 Manual din admin'}
                    {run.duration_seconds ? ` · ${formatDuration(run.duration_seconds)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={run.status} conclusion={run.conclusion} />
                  <a
                    href={run.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Detalii →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}