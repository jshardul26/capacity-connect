import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  UserCheck,
  UserX,
  Building,
  MapPin,
  Mail,
  RefreshCw,
  AlertCircle,
  Users,
  BookOpen,
  Award,
  Bell,
  Megaphone,
  FileText,
  Search,
  Trash2,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { adminService } from '../../services/adminService';
import {
  AdminDashboardMetrics,
  AdminUserListItem,
  AdminCourseItem,
  AdminEnrollmentItem,
  AnnouncementItem,
  AuditLogItem,
  AchievementItem,
  User,
} from '../../types';

interface AdminApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab =
  | 'overview'
  | 'clearances'
  | 'users'
  | 'curriculum'
  | 'announcements'
  | 'notifications'
  | 'achievements'
  | 'audit';

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { accessToken, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Overview metrics
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);

  // 2. Pending & all users
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUserListItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // 3. Courses & Enrollments
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [enrollments, setEnrollments] = useState<AdminEnrollmentItem[]>([]);

  // 4. Announcements
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnFeatured, setNewAnnFeatured] = useState(false);

  // 5. Notifications
  const [notifTargetUserId, setNotifTargetUserId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('info');

  // 6. Achievements
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [achieveUserId, setAchieveUserId] = useState('');
  const [achieveTitle, setAchieveTitle] = useState('');
  const [achieveDesc, setAchieveDesc] = useState('');
  const achieveBadgeUrl = '/badges/merit.png';
  const [achieveFeatured, setAchieveFeatured] = useState(false);

  // 7. Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Data Fetching Handlers
  const fetchMetrics = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await adminService.getDashboardMetrics(accessToken);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch admin metrics:', err);
    }
  }, [accessToken]);

  const fetchPending = useCallback(async () => {
    if (!accessToken) return;
    try {
      const users = await adminService.getPendingUsers(accessToken);
      setPendingUsers(users);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
    }
  }, [accessToken]);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await adminService.getUsers(accessToken, {
        role: userRoleFilter || undefined,
        status: userStatusFilter || undefined,
        search: userSearch || undefined,
      });
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [accessToken, userRoleFilter, userStatusFilter, userSearch]);

  const fetchCoursesAndEnrollments = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [cData, eData] = await Promise.all([
        adminService.getCourses(accessToken),
        adminService.getEnrollments(accessToken),
      ]);
      setCourses(cData);
      setEnrollments(eData);
    } catch (err) {
      console.error('Failed to fetch courses/enrollments:', err);
    }
  }, [accessToken]);

  const fetchAnnouncements = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await adminService.getAnnouncements(accessToken);
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  }, [accessToken]);

  const fetchAchievements = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await adminService.getAchievements(accessToken);
      setAchievements(data);
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    }
  }, [accessToken]);

  const fetchAuditLogs = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await adminService.getAuditLogs(accessToken);
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  }, [accessToken]);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen && user?.role === 'admin' && accessToken) {
      setLoading(true);
      Promise.all([
        fetchMetrics(),
        fetchPending(),
        fetchUsers(),
        fetchCoursesAndEnrollments(),
        fetchAnnouncements(),
        fetchAchievements(),
        fetchAuditLogs(),
      ]).finally(() => setLoading(false));
    } else {
      setMessage(null);
    }
  }, [
    isOpen,
    user,
    accessToken,
    fetchMetrics,
    fetchPending,
    fetchUsers,
    fetchCoursesAndEnrollments,
    fetchAnnouncements,
    fetchAchievements,
    fetchAuditLogs,
  ]);

  if (!isOpen) return null;

  // Actions
  const handleApprove = async (userId: string) => {
    if (!accessToken) return;
    setActionLoading(`approve-${userId}`);
    setMessage(null);
    try {
      await adminService.approveUser(userId, accessToken);
      setMessage({ type: 'success', text: 'User account approved successfully.' });
      await Promise.all([fetchPending(), fetchUsers(), fetchMetrics(), fetchAuditLogs()]);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Approval failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!accessToken) return;
    setActionLoading(`reject-${userId}`);
    setMessage(null);
    try {
      await adminService.rejectUser(userId, accessToken);
      setMessage({ type: 'success', text: 'User account rejected.' });
      await Promise.all([fetchPending(), fetchUsers(), fetchMetrics(), fetchAuditLogs()]);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Rejection failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!accessToken) return;
    setActionLoading(`role-${userId}`);
    setMessage(null);
    try {
      await adminService.updateUserRole(userId, newRole, accessToken);
      setMessage({ type: 'success', text: `User role changed to ${newRole}.` });
      await Promise.all([fetchUsers(), fetchMetrics(), fetchAuditLogs()]);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update role.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    if (!accessToken) return;
    setActionLoading(`status-${userId}`);
    setMessage(null);
    try {
      await adminService.updateUserStatus(userId, newStatus, accessToken);
      setMessage({ type: 'success', text: `User status changed to ${newStatus}.` });
      await Promise.all([fetchUsers(), fetchMetrics(), fetchAuditLogs()]);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update status.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleCoursePublish = async (courseId: string, currentPublished: boolean) => {
    if (!accessToken) return;
    setActionLoading(`course-${courseId}`);
    try {
      await adminService.toggleCoursePublish(courseId, !currentPublished, accessToken);
      setMessage({
        type: 'success',
        text: `Course ${!currentPublished ? 'published' : 'unpublished'} successfully.`,
      });
      await Promise.all([fetchCoursesAndEnrollments(), fetchMetrics(), fetchAuditLogs()]);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Publish toggle failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newAnnTitle.trim() || !newAnnContent.trim()) return;
    setActionLoading('create-ann');
    setMessage(null);
    try {
      await adminService.createAnnouncement(
        {
          title: newAnnTitle,
          content: newAnnContent,
          is_featured_on_homepage: newAnnFeatured,
          is_active: true,
        },
        accessToken
      );
      setMessage({ type: 'success', text: 'Announcement published successfully!' });
      setNewAnnTitle('');
      setNewAnnContent('');
      setNewAnnFeatured(false);
      await Promise.all([fetchAnnouncements(), fetchAuditLogs()]);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create announcement.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!accessToken) return;
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await adminService.deleteAnnouncement(id, accessToken);
      setMessage({ type: 'success', text: 'Announcement deleted.' });
      await Promise.all([fetchAnnouncements(), fetchAuditLogs()]);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete announcement.' });
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !notifTitle.trim() || !notifMessage.trim()) return;
    setActionLoading('send-notif');
    setMessage(null);
    try {
      await adminService.sendNotification(
        {
          user_id: notifTargetUserId ? notifTargetUserId : null,
          title: notifTitle,
          message: notifMessage,
          notification_type: notifType,
        },
        accessToken
      );
      setMessage({
        type: 'success',
        text: notifTargetUserId
          ? 'Notification sent to specified user!'
          : 'System broadcast notification dispatched to all users!',
      });
      setNotifTitle('');
      setNotifMessage('');
      setNotifTargetUserId('');
      await fetchAuditLogs();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send notification.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAwardAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !achieveUserId || !achieveTitle.trim()) return;
    setActionLoading('award-ach');
    setMessage(null);
    try {
      await adminService.awardAchievement(
        {
          user_id: achieveUserId,
          title: achieveTitle,
          description: achieveDesc,
          badge_icon_url: achieveBadgeUrl,
          is_displayed_on_homepage: achieveFeatured,
        },
        accessToken
      );
      setMessage({ type: 'success', text: 'Achievement badge successfully awarded!' });
      setAchieveTitle('');
      setAchieveDesc('');
      setAchieveUserId('');
      await Promise.all([fetchAchievements(), fetchAuditLogs()]);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to award achievement.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAchievement = async (id: string) => {
    if (!accessToken) return;
    if (!window.confirm('Are you sure you want to revoke this achievement?')) return;
    try {
      await adminService.revokeAchievement(id, accessToken);
      setMessage({ type: 'success', text: 'Achievement revoked.' });
      await Promise.all([fetchAchievements(), fetchAuditLogs()]);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to revoke achievement.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-6xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Central Portal Administration Console
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  MoES &bull; IMD HQ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Institutional governance, user approvals, course audits, announcements, and compliance auditing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setLoading(true);
                Promise.all([
                  fetchMetrics(),
                  fetchPending(),
                  fetchUsers(),
                  fetchCoursesAndEnrollments(),
                  fetchAnnouncements(),
                  fetchAchievements(),
                  fetchAuditLogs(),
                ]).finally(() => setLoading(false));
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Action Message Banner */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/50 flex space-x-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview Metrics', icon: ShieldCheck },
            { id: 'clearances', label: `Pending Clearances (${pendingUsers.length})`, icon: UserCheck },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'curriculum', label: 'Course Governance', icon: BookOpen },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'achievements', label: 'Achievements', icon: Award },
            { id: 'audit', label: 'Audit Trail', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`pb-3 px-3 flex items-center space-x-1.5 transition border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {metrics ? (
                <>
                  {/* Row 1: Users & Clearances */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Identity &amp; Account Clearance Metrics
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">Total Registered Users</p>
                        <p className="text-2xl font-black text-white mt-1">{metrics.total_users}</p>
                        <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                          <span>{metrics.trainees_count} Trainees</span>
                          <span>&bull;</span>
                          <span>{metrics.trainers_count} Trainers</span>
                        </div>
                      </div>

                      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">Pending Clearances</p>
                        <p className="text-2xl font-black text-amber-400 mt-1">
                          {metrics.pending_approvals_count}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Awaiting admin review</p>
                      </div>

                      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">Approved Accounts</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">
                          {metrics.approved_users_count}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Active clearance status</p>
                      </div>

                      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">IMD Stations Represented</p>
                        <p className="text-2xl font-black text-teal-400 mt-1">
                          {metrics.unique_stations_count}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Observatories &amp; radar posts</p>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Curriculum & Participation */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      LMS Curriculum &amp; Assessment Performance
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">Courses</p>
                        <p className="text-2xl font-black text-white mt-1">{metrics.total_courses}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {metrics.published_courses_count} Published &bull; {metrics.draft_courses_count} Drafts
                        </p>
                      </div>

                      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">Total Enrollments</p>
                        <p className="text-2xl font-black text-blue-400 mt-1">
                          {metrics.total_enrollments}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {metrics.completed_enrollments_count} Completed courses
                        </p>
                      </div>

                      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">Total Exams Taken</p>
                        <p className="text-2xl font-black text-purple-400 mt-1">
                          {metrics.total_assessment_attempts}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Across {metrics.total_assessments} Published exams
                        </p>
                      </div>

                      <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                        <p className="text-xs text-slate-400">Overall Pass Rate</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">
                          {metrics.overall_pass_rate_percentage}%
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {metrics.total_certificates_issued} Certifications earned
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Institutional Quick Action Panel */}
                  <div className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Institutional Administrative Directives</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Perform user approvals, course audits, system broadcasts, or review audit logs.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('clearances')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow"
                      >
                        Review Clearances ({pendingUsers.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('announcements')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition border border-slate-700"
                      >
                        Post Announcement
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">Loading platform metrics...</div>
              )}
            </div>
          )}

          {/* TAB 2: PENDING CLEARANCES */}
          {activeTab === 'clearances' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Pending User Account Clearances</h3>
                  <p className="text-xs text-slate-400">
                    Accounts awaiting administrative approval before accessing portal courses and assessments.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  {pendingUsers.length} Pending
                </span>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/30 border border-slate-800 rounded-2xl">
                  <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-300">Approval Queue is Clear</h4>
                  <p className="text-xs text-slate-500 mt-1">No registered users are awaiting clearance.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((pUser) => (
                    <div
                      key={pUser.id}
                      className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-white">{pUser.full_name}</span>
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                            {pUser.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{pUser.email}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>Station: {pUser.station_code || 'Unspecified'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-500" />
                            <span>{pUser.organization}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleReject(String(pUser.id))}
                          disabled={actionLoading === `reject-${pUser.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition flex items-center space-x-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleApprove(String(pUser.id))}
                          disabled={actionLoading === `approve-${pUser.id}`}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow transition flex items-center space-x-1"
                        >
                          {actionLoading === `approve-${pUser.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Approve Access</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: USER DIRECTORY & ROLE MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or station..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">All Roles</option>
                    <option value="trainee">Trainee</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending_approval">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Station</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <p className="font-bold text-white">{u.full_name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">{u.station_code || '-'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            disabled={actionLoading === `role-${u.id}`}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="trainee">Trainee</option>
                            <option value="trainer">Trainer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.status}
                            onChange={(e) => handleUpdateStatus(u.id, e.target.value)}
                            disabled={actionLoading === `status-${u.id}`}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="approved">Approved</option>
                            <option value="suspended">Suspended</option>
                            <option value="pending_approval">Pending</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(u.created_at).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COURSE GOVERNANCE & ENROLLMENTS */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-3">All Institutional Courses</h3>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Course</th>
                        <th className="px-4 py-3">Trainer</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Enrollments</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {courses.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <p className="font-bold text-white">{c.title}</p>
                            <p className="text-[10px] font-mono text-slate-500">{c.code}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{c.trainer_name}</td>
                          <td className="px-4 py-3 text-slate-400">{c.category}</td>
                          <td className="px-4 py-3 font-semibold text-white">{c.enrollments_count}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.is_published
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {c.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleToggleCoursePublish(c.id, c.is_published)}
                              disabled={actionLoading === `course-${c.id}`}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition"
                            >
                              {c.is_published ? 'Unpublish' : 'Publish Override'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-3">Recent Cross-System Enrollments</h3>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Trainee</th>
                        <th className="px-4 py-3">Course</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Enrolled At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {enrollments.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <p className="font-bold text-white">{e.user_name}</p>
                            <p className="text-[10px] text-slate-400">{e.user_email}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-200">{e.course_title}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                              {e.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {new Date(e.enrolled_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ANNOUNCEMENTS & BULLETINS */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              {/* Creator form */}
              <form
                onSubmit={handleCreateAnnouncement}
                className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-4"
              >
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Publish New Institutional Announcement</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Announcement Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cyclone Season Readiness Briefing 2026"
                      value={newAnnTitle}
                      onChange={(e) => setNewAnnTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Content &amp; Directive</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Enter the official notification details..."
                      value={newAnnContent}
                      onChange={(e) => setNewAnnContent(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAnnFeatured}
                        onChange={(e) => setNewAnnFeatured(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Feature on Homepage Bulletin</span>
                    </label>

                    <button
                      type="submit"
                      disabled={actionLoading === 'create-ann'}
                      className="ml-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1.5"
                    >
                      {actionLoading === 'create-ann' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Publish Announcement</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Announcements list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Published Institutional Bulletins ({announcements.length})
                </h4>

                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{a.title}</span>
                        {a.is_featured_on_homepage && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Homepage Featured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{a.content}</p>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono">
                        Published by {a.author_name} &bull; {new Date(a.created_at).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: NOTIFICATIONS & BROADCASTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <form
                onSubmit={handleSendNotification}
                className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-4 max-w-xl"
              >
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span>Dispatch Notification or Broadcast</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target User (Optional)</label>
                    <select
                      value={notifTargetUserId}
                      onChange={(e) => setNotifTargetUserId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    >
                      <option value="">Broadcast to ALL Users (Global)</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.email}) — {u.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Notification Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Schedule Update: DWR Calibration"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Message Text</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Enter the alert content..."
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Severity / Type</label>
                    <select
                      value={notifType}
                      onChange={(e) => setNotifType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    >
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="alert">Alert / Critical</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading === 'send-notif'}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5"
                  >
                    {actionLoading === 'send-notif' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Dispatch Notification</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: ACHIEVEMENTS & HONORS */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {/* Grant form */}
              <form
                onSubmit={handleAwardAchievement}
                className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-4 max-w-xl"
              >
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Award Competency Distinction Badge</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Recipient User</label>
                    <select
                      required
                      value={achieveUserId}
                      onChange={(e) => setAchieveUserId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    >
                      <option value="">Select an Officer...</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Badge Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Master Radar Meteorologist"
                      value={achieveTitle}
                      onChange={(e) => setAchieveTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Citation / Description</label>
                    <textarea
                      rows={2}
                      placeholder="Conferred for exceptional proficiency in radar operations..."
                      value={achieveDesc}
                      onChange={(e) => setAchieveDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={achieveFeatured}
                        onChange={(e) => setAchieveFeatured(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>Showcase on Homepage</span>
                    </label>

                    <button
                      type="submit"
                      disabled={actionLoading === 'award-ach'}
                      className="ml-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition"
                    >
                      Confer Badge
                    </button>
                  </div>
                </div>
              </form>

              {/* Awarded Badges List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Awarded Honors &amp; Badges ({achievements.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{ach.title}</p>
                          <p className="text-xs text-emerald-400">Recipient: {ach.user_name}</p>
                          <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">
                            Awarded: {new Date(ach.awarded_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeAchievement(ach.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        title="Revoke"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Administrative Audit Trail</h3>
                  <p className="text-xs text-slate-400">
                    Immutable security log recording approvals, role promotions, and governance events.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                  {auditLogs.length} Entries
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Administrator</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Target</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-white font-medium">{log.admin_email}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300 font-mono text-[11px]">{log.target_type}</td>
                        <td className="px-4 py-2.5 text-slate-400 max-w-xs truncate">{log.details || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminDashboardModal = AdminApprovalModal;
export default AdminApprovalModal;
