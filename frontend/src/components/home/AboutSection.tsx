import React from 'react';
import { ShieldCheck, HardDrive, Wifi, Radio, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Multi-Image / Visual Composition */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Arched Visual Box (Representing Modern Observatory & Radars) */}
              <div className="relative w-full h-[400px] sm:h-[460px] rounded-t-[100px] rounded-b-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-teal-900 shadow-2xl overflow-hidden border-4 border-white flex flex-col justify-between p-8 text-white">
                {/* Radar Grid Decorative Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.15)_0,transparent_70%)] pointer-events-none" />
                <div className="absolute -right-12 -top-12 w-64 h-64 border border-teal-500/20 rounded-full pointer-events-none" />
                <div className="absolute -right-20 -top-20 w-80 h-80 border border-teal-500/10 rounded-full pointer-events-none" />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-mono">
                    <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Meteorological Networks &bull; Edge Deployment</span>
                  </div>
                </div>

                <div className="relative z-10 space-y-3 bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-slate-800">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Field Observatory Ready</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Custom-engineered to run seamlessly at high-altitude mountain observatories, coastal radar stations, and isolated island posts with zero internet dependency.
                  </p>
                </div>
              </div>

              {/* Overlapping Secondary Card (Workstation Simulation) */}
              <div className="absolute -bottom-6 -right-2 sm:-right-6 w-56 sm:w-64 bg-slate-900 rounded-2xl p-5 shadow-2xl border-2 border-white text-white space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>Bootable Live USB</span>
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Plug-and-play persistence. Boots any standard field PC in under 30 seconds.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-teal-300 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dual DB: SQLite WAL</span>
                </div>
              </div>

              {/* Floating Award Badge */}
              <div className="absolute -top-4 -left-2 sm:-left-4 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-lg text-xs flex items-center gap-2 border-2 border-white">
                <span className="text-base">&starf;</span>
                <span>MoES / IMD SIH 26075</span>
              </div>
            </div>
          </div>

          {/* Right Column: Mission Storytelling */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-wider">
                About Capacity Connect
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Empowering Meteorological Personnel Across Remote Stations
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                The India Meteorological Department (IMD) safeguards millions of lives through weather warnings, cyclone alerts, and climate projections. However, personnel stationed at peripheral observatories often face extreme connectivity hurdles that prevent traditional online LMS usage.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Capacity Connect is not just another web portal — it is a dual-mode capacity building ecosystem bridging central meteorological leadership with offline-ready edge deployment.
              </p>
            </div>

            {/* Dual Key Pillars Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <HardDrive className="w-4 h-4 text-teal-600" />
                  <span>Capacity Connect OS</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A distraction-free Linux desktop designed for zero-install training from persistent USB media.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <Wifi className="w-4 h-4 text-blue-600" />
                  <span>Micro-LAN Classroom</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  One host machine shares courses and assessments locally with up to 30 nearby trainee devices.
                </p>
              </div>
            </div>

            {/* CTA Link */}
            <div className="pt-2 flex items-center gap-4">
              <a
                href="#offline-ecosystem"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow transition-all"
              >
                <span>Discover Offline Architecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <span className="text-xs text-slate-500 font-mono">
                100% Offline Parity
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
