import React, { useEffect, useState } from 'react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HealthCheck } from './components/common/HealthCheck';
import { 
  Cloud, 
  HardDrive, 
  WifiOff, 
  Share2, 
  BrainCircuit, 
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  FileCode
} from 'lucide-react';
import { healthService } from './services/api';
import { HealthResponse } from './types';

export const App: React.FC = () => {
  const [appHealth, setAppHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    healthService.getAppHealth()
      .then(setAppHealth)
      .catch(() => setAppHealth(null));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header 
        appMode={appHealth?.app_mode || 'central'} 
        stationCode={appHealth?.station_code || 'IMD-HQ-DELHI'} 
        isOnline={!!appHealth}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-8 text-white shadow-lg border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Phase 1 — Project Foundation Active</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              CAPACITY CONNECT
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              A resilient, offline-first digital capacity building and learning management portal tailored for the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD).
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>FastAPI Backend Scaffolding</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>React + Vite + Tailwind Scaffolding</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dual Engine: Postgres &amp; SQLite</span>
              </span>
            </div>
          </div>
        </section>

        {/* Live Connectivity Verification Component */}
        <section>
          <HealthCheck />
        </section>

        {/* Core Architecture Pillars */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Ecosystem Architecture Pillars</h2>
            <span className="text-xs text-slate-500">SIH ID: 26075 &bull; IMD Capacity Building</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Central Cloud Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centralized courseware repository, administrative approvals, meteorological bulletin publishing, and multi-station synchronization hub.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Capacity Connect OS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tailored lightweight Linux environment bootable via persistent Live USB for zero-install deployment on field PCs.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <WifiOff className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Offline-First Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full offline course consumption, video playback, and timed assessments with HMAC cryptographic attempt ledgers in local SQLite.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">LAN Learning Server</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                One field machine hosts the courseware over an ad-hoc Wi-Fi/Ethernet network, enabling up to 30 nearby devices to learn and test.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Intelligent Competency AI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explainable vector modeling (scikit-learn cosine similarity) mapping trainee skill gaps and matching qualified trainers to subjects.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Offline Content Packs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Encrypted, SHA-256 validated <code>.ccpack</code> bundles allowing trainers to distribute complete syllabi via physical pen drives.
              </p>
            </div>
          </div>
        </section>

        {/* Development Quick Links */}
        <section className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm">Canonical Specifications &amp; API Explorer</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
            >
              <span>Swagger / OpenAPI Interactive Docs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="http://localhost:8000/redoc"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
            >
              <span>ReDoc API Documentation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
