import React from 'react';
import { Shield, BookOpen, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-teal-500" />
          <span>CAPACITY CONNECT &bull; MoES / IMD Capacity Building Portal</span>
        </div>

        <div className="flex items-center space-x-6 text-slate-500">
          <span className="flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Problem Statement ID: 26075</span>
          </span>
          <span className="flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>Phase 1: Project Foundation</span>
          </span>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          v1.0.0 &bull; Offline-First Architecture
        </div>
      </div>
    </footer>
  );
};
