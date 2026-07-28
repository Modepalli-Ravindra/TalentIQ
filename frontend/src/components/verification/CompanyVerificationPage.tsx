import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { verificationApi, type VerificationRequest } from '../../lib/api';
import { JobCardSkeleton } from '../ui/Skeleton';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, XCircle, Clock, Send, Loader2, Building, FileText } from 'lucide-react';

interface Props {}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30', label: 'Pending Review' },
  under_review: { icon: <Clock className="w-4 h-4" />, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', label: 'Under Review' },
  approved: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', label: 'Approved' },
  rejected: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-400 bg-red-500/20 border-red-500/30', label: 'Rejected' },
  expired: { icon: <Clock className="w-4 h-4" />, color: 'text-zinc-400 bg-zinc-500/20 border-zinc-500/30', label: 'Expired' },
};

export default function CompanyVerificationPage(_props: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<VerificationRequest | null>(null);
  const [history, setHistory] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ company_name: '', company_domain: '', business_registration_number: '', tax_id: '' });

  const fetchData = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([verificationApi.getStatus(), verificationApi.getHistory()]);
      setStatus(s);
      setHistory(h);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.company_name.trim()) { toast.error('Company name required'); return; }
    setSubmitting(true);
    try {
      await verificationApi.request({ ...form, company_domain: form.company_domain || undefined, business_registration_number: form.business_registration_number || undefined, tax_id: form.tax_id || undefined });
      toast.success('Verification request submitted!');
      fetchData();
      setForm({ company_name: '', company_domain: '', business_registration_number: '', tax_id: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to submit');
    }
    finally { setSubmitting(false); }
  };

  if (loading) return <JobCardSkeleton count={2} />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Company Verification</h1>
        <p className="text-zinc-400 text-sm mt-1">Get your company verified to build trust with candidates</p>
      </div>

      {status ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-white font-medium">{status.company_name}</h3>
                <p className="text-zinc-400 text-sm">{status.company_domain || 'No domain'}</p>
              </div>
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border ${statusConfig[status.status]?.color || ''}`}>
              {statusConfig[status.status]?.icon}
              {statusConfig[status.status]?.label || status.status}
            </span>
          </div>

          {status.review_notes && (
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-1">Review Notes</p>
              <p className="text-sm text-zinc-300">{status.review_notes}</p>
            </div>
          )}

          {status.status === 'approved' && status.expires_at && (
            <p className="text-emerald-400 text-sm">
              Verified until {new Date(status.expires_at).toLocaleDateString()}
            </p>
          )}

          {status.status !== 'pending' && status.status !== 'under_review' && (
            <p className="text-zinc-500 text-xs">Submitted {new Date(status.created_at).toLocaleDateString()}</p>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-zinc-300">Request Verification</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Company Name *</label>
              <input value={form.company_name} onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Company Domain</label>
              <input value={form.company_domain} onChange={(e) => setForm(f => ({ ...f, company_domain: e.target.value }))}
                placeholder="company.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Business Registration #</label>
              <input value={form.business_registration_number} onChange={(e) => setForm(f => ({ ...f, business_registration_number: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Tax ID</label>
              <input value={form.tax_id} onChange={(e) => setForm(f => ({ ...f, tax_id: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={submitting || !form.company_name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Request
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Verification History</h3>
          {history.map(h => (
            <div key={h.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white text-sm">{h.company_name}</p>
                <p className="text-zinc-500 text-xs">{new Date(h.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs border ${statusConfig[h.status]?.color || ''}`}>
                {statusConfig[h.status]?.label || h.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
