import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '../../types';
import { Lock, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { isAuthenticated, user, openAuthModal } = useAuthStore();

  if (!isAuthenticated || !user) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto my-8 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-900 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Authentication Required</h3>
          <p className="text-xs text-slate-500 mt-1">
            Please sign in to access this protected Capacity Connect resource.
          </p>
        </div>
        <button
          onClick={() => openAuthModal('login')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 transition"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm max-w-md mx-auto my-8 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-700 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500 mt-1">
            Your role (<strong className="capitalize">{user.role}</strong>) does not have authorization to view this section.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
