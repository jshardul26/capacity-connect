import React from 'react';
import { ArrowRight, Shield, HardDrive, CheckCircle2 } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-slate-950 text-white overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
      {/* Background Graphic Patterns & Atmospheric Gradients */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(13,148,136,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(2,132,199,0.3) 0%, transparent 60%)`,
        }}
      />
      
      {/* Subtle Atmospheric Wave / Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-6">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-teal-500/30 text-teal-300 text-xs font-medium tracking-wide shadow-sm backdrop-blur-sm">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Ministry of Earth Sciences &bull; India Meteorological Department</span>
          </div>

          {/* Master Headline with Golden Amber Emphasis */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-white">
            Build Skills. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">
              Strengthen Capacity.
            </span> <br />
            Enable Better Decisions.
          </h1>

          {/* Narrative Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
            A mission-critical, offline-first digital learning management ecosystem engineered for meteorological observers, forecasters, and radar specialists across remote field observatories, coastal radar stations, and frontier monitoring posts.
          </p>

          {/* Primary and Secondary CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href="#courses"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] group"
            >
              <span>Explore Curriculum</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="#offline-ecosystem"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-semibold text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 shadow transition-all backdrop-blur-sm"
            >
              <HardDrive className="w-4 h-4 text-teal-400" />
              <span>Offline OS &amp; Micro-LAN</span>
            </a>
          </div>

          {/* Key Value Micro-Badges */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero-Internet Field Readiness</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>AI Competency Gap Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Instant Local LAN Classroom</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
