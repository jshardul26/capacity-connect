import React from 'react';
import { HardDrive, WifiOff, Share2, RefreshCw, Database, Check } from 'lucide-react';

export const OfflineEcosystemSection: React.FC = () => {
  const capabilities = [
    {
      title: 'Persistent Live USB',
      desc: 'Dual-partition architecture with Ext4 casper-rw storage retaining progress across reboots on any x86 PC.',
      badge: 'Zero Install Required',
      icon: HardDrive,
    },
    {
      title: 'Offline Video & PDF Streaming',
      desc: 'Hardware-accelerated media playback from local filesystem content store without network lag or buffering.',
      badge: '1080p Local Playback',
      icon: WifiOff,
    },
    {
      title: 'Micro-LAN Classroom Mode',
      desc: 'One field OS machine broadcasts ad-hoc Wi-Fi/Ethernet for up to 30 nearby trainee devices to learn simultaneously.',
      badge: 'Multi-User Local Server',
      icon: Share2,
    },
    {
      title: 'Bi-Directional Delta Sync',
      desc: 'Background daemon automatically pushes local quiz attempts and pulls newly published courses when internet returns.',
      badge: 'Idempotent & Resilient',
      icon: RefreshCw,
    },
  ];

  return (
    <section id="offline-ecosystem" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            Core SIH Innovation
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            The Offline-First Capacity Building Ecosystem
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Engineered for high-altitude stations, remote radar posts, and island observatories where external internet cannot be assumed.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 shadow-inner">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 mb-2">
                    {cap.badge}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cap.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Phase 0 &bull; Canonical Architecture</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Architecture Callout Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-teal-400">
              <Database className="w-4 h-4" />
              <span>Unified SQLite WAL &bull; Central PostgreSQL Mirror</span>
            </div>
            <h3 className="text-xl font-bold">Identical API Contract Online &amp; Offline</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Capacity Connect uses a single FastAPI backend architecture. The local node runs lightweight SQLite with WAL mode on port 8000, ensuring 100% code parity between the central cloud portal and field machines.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <a
              href="#system-health"
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 shadow text-center transition-all"
            >
              Inspect Live Node Probe
            </a>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 text-center transition-all"
            >
              OpenAPI Contract Spec
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
