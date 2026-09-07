import React from 'react';
import { CloudRain, Database } from 'lucide-react';

interface HeaderProps {
  appMode?: string;
  stationCode?: string;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  appMode = 'central',
  stationCode = 'IMD-HQ-DELHI',
  isOnline = true,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-blue-700 to-teal-500 flex items-center justify-center shadow-inner">
              <CloudRain className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">CAPACITY CONNECT</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-300 border border-blue-700 font-mono">
                  SIH 26075
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Ministry of Earth Sciences (MoES) &bull; India Meteorological Department (IMD)
              </p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-xs">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-slate-400">Mode:</span>
              <span className="font-semibold text-teal-300 uppercase tracking-wider">{appMode}</span>
            </div>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
              <span>{stationCode}</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">{isOnline ? 'Connected' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
