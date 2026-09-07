import React from 'react';
import { CloudRain, Shield, ExternalLink, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      {/* 4-Column Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Institutional Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 to-teal-500 flex items-center justify-center shadow-md">
                <CloudRain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-extrabold text-white tracking-tight">CAPACITY CONNECT</span>
                <p className="text-[11px] text-teal-400 font-mono">Digital Capacity Building</p>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-xs">
              An offline-first organizational capacity building and learning management ecosystem for the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD).
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-amber-400 font-mono text-[11px]">
              <Shield className="w-3.5 h-3.5" />
              <span>SIH Problem Statement ID: 26075</span>
            </div>
          </div>

          {/* Col 2: Curricula & Modules */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Core Curricula
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><a href="#courses" className="hover:text-teal-300 transition-colors">Doppler Weather Radar (DWR)</a></li>
              <li><a href="#courses" className="hover:text-teal-300 transition-colors">Operational NWP (WRF Modeling)</a></li>
              <li><a href="#courses" className="hover:text-teal-300 transition-colors">INSAT Multispectral Satellite Imagery</a></li>
              <li><a href="#courses" className="hover:text-teal-300 transition-colors">Automatic Weather Stations (AWS)</a></li>
              <li><a href="#courses" className="hover:text-teal-300 transition-colors">Tropical Cyclone Tracking &amp; Surge</a></li>
              <li><a href="#courses" className="hover:text-teal-300 transition-colors">Agrometeorological Advisory</a></li>
            </ul>
          </div>

          {/* Col 3: Offline Ecosystem */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Offline Ecosystem
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><a href="#offline-ecosystem" className="hover:text-teal-300 transition-colors">Capacity Connect OS (Linux)</a></li>
              <li><a href="#offline-ecosystem" className="hover:text-teal-300 transition-colors">Persistent Live USB Architecture</a></li>
              <li><a href="#offline-ecosystem" className="hover:text-teal-300 transition-colors">Micro-LAN Classroom Server</a></li>
              <li><a href="#offline-ecosystem" className="hover:text-teal-300 transition-colors">Bi-Directional Delta Sync Daemon</a></li>
              <li>
                <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-teal-400 hover:underline">
                  <span>OpenAPI Swagger Specification</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="http://localhost:8000/redoc" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-teal-400 hover:underline">
                  <span>ReDoc Architecture Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Institutional Contacts */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              IMD Headquarters
            </h4>
            <div className="space-y-2 text-slate-400 text-xs leading-relaxed">
              <p>Mausam Bhavan, Lodhi Road, New Delhi – 110003, India</p>
              <p className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Central Helpdesk: 1800-180-1717</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>capacity.imd@moes.gov.in</span>
              </p>
            </div>
            <div className="pt-2 text-[11px] text-slate-500 font-mono">
              Designed for Smart Education &bull; Smart India Hackathon
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-bar */}
      <div className="bg-black/50 border-t border-slate-900 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-500">
          <div>
            &copy; 2026 Ministry of Earth Sciences (MoES) / India Meteorological Department. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Phase 1 Baseline Verified</span>
            </span>
            <span>&bull;</span>
            <span className="font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
