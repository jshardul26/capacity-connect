import React from 'react';
import { Phone, Mail, Globe, MapPin, Database, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface TopBarProps {
  appMode?: string;
  stationCode?: string;
  isOnline?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  appMode = 'local',
  stationCode = 'IMD-HQ-DELHI',
  isOnline = true,
}) => {
  const { user } = useAuthStore();
  const displayStation = user?.station_code || stationCode;

  return (
    <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        {/* Institutional Affiliation & Contact */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>Ministry of Earth Sciences (MoES) &bull; India Meteorological Department</span>
          </span>
          <span className="hidden lg:inline text-slate-600">|</span>
          <span className="hidden lg:flex items-center gap-1 text-slate-400">
            <Mail className="w-3 h-3 text-slate-500" />
            <span>capacity.imd@moes.gov.in</span>
          </span>
          <span className="hidden sm:flex items-center gap-1 text-slate-400">
            <Phone className="w-3 h-3 text-amber-400" />
            <span>HQ Weather Desk: 1800-180-1717</span>
          </span>
        </div>

        {/* System & Station Node Information */}
        <div className="flex items-center gap-3 text-[11px]">
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-200 font-mono">
              <Shield className="w-3 h-3 text-teal-400" />
              <span>Officer: <strong className="text-white capitalize">{user.role}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">
            <MapPin className="w-3 h-3 text-teal-400" />
            <span>Node: <strong className="text-white font-semibold">{displayStation}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">
            <Database className="w-3 h-3 text-amber-400" />
            <span>Mode: <strong className="text-amber-300 uppercase">{appMode}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 pl-1">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-medium text-slate-300">{isOnline ? 'Online Engine' : 'Offline Mode'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
