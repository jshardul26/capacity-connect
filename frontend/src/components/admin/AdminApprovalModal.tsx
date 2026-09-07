import React, { useEffect, useState, useCallback } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  Building, 
  MapPin, 
  Mail, 
  Phone,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/authService';
import { User } from '../../types';

interface AdminApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { accessToken, user } = useAuthStore();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPending = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const users = await authService.getPendingUsers(accessToken);
      setPendingUsers(users);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to fetch pending accounts.',
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen && user?.role === 'admin') {
      fetchPending();
    }
  }, [isOpen, user, fetchPending]);

  if (!isOpen) return null;

  const handleApprove = async (userId: number) => {
    if (!accessToken) return;
    setActionLoading(userId);
    setMessage(null);
    try {
      await authService.approveUser(userId, accessToken);
      setMessage({ type: 'success', text: `User ID #${userId} approved successfully.` });
      await fetchPending();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Approval operation failed.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: number) => {
    if (!accessToken) return;
    setActionLoading(userId);
    setMessage(null);
    try {
      await authService.rejectUser(userId, accessToken);
      setMessage({ type: 'success', text: `User ID #${userId} rejected.` });
      await fetchPending();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Rejection operation failed.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              ADMINISTRATIVE GOVERNANCE
            </span>
            <span className="text-[11px] font-mono text-slate-400">IMD Central Clearance</span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Account Approvals &amp; Role Authorizations</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review, verify identity credentials, and approve pending officer registrations.
              </p>
            </div>
            <button
              onClick={fetchPending}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {message && (
          <div className={`px-6 py-3 text-xs flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-rose-50 text-rose-800 border-b border-rose-100'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* User List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading && pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-500" />
              Loading pending account requests...
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">All Clearance Queues Clear</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are currently no trainee or trainer registration requests awaiting administrator verification.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Approval ({pendingUsers.length})
              </div>
              {pendingUsers.map((pendingUser) => (
                <div
                  key={pendingUser.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {pendingUser.full_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        pendingUser.role === 'trainer'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}>
                        {pendingUser.role}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-slate-200 text-slate-700">
                        ID #{pendingUser.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pendingUser.email}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span>{pendingUser.station_code}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pendingUser.organization}</span>
                      </span>
                      {pendingUser.phone_number && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pendingUser.phone_number}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>Requested on {new Date(pendingUser.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleReject(pendingUser.id)}
                      disabled={actionLoading === pendingUser.id}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApprove(pendingUser.id)}
                      disabled={actionLoading === pendingUser.id}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve Access</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
