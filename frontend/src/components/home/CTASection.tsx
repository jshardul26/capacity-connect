import React from 'react';
import { ArrowRight, Shield, HardDrive } from 'lucide-react';

export const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(13,148,136,0.2)_0,transparent_60%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-teal-500/30 text-teal-300 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>MoES / IMD Capacity Building Portal</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Strengthen National Meteorological Resilience with Capacity Connect
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          From Doppler radar calibration to high-resolution WRF modeling, enhance technical readiness across India's complete meteorological observational network.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#courses"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <span>Explore Course Syllabi</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="#offline-ecosystem"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-semibold text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition-all"
          >
            <HardDrive className="w-4 h-4 text-teal-400" />
            <span>Capacity Connect OS Specs</span>
          </a>
        </div>
      </div>
    </section>
  );
};
