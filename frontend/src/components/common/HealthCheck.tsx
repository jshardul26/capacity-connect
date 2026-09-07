import React, { useState, useEffect } from 'react';
import { Activity, Database, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { healthService } from '../../services/api';
import { HealthResponse, DatabaseHealthResponse } from '../../types';

export const HealthCheck: React.FC = () => {
  const [appHealth, setAppHealth] = useState<HealthResponse | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');

  const checkConnectivity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [appRes, dbRes] = await Promise.all([
        healthService.getAppHealth(),
        healthService.getDbHealth(),
      ]);
      setAppHealth(appRes);
      setDbHealth(dbRes);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown connection error';
      setError(message);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center space-x-2.5">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-800 text-sm md:text-base">
            System &amp; Connectivity Status
          </h3>
        </div>
        <button
          onClick={checkConnectivity}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Recheck</span>
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend API Status */}
        <div className="flex items-start space-x-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
          <div className="mt-1">
            {isLoading ? (
              <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
            ) : appHealth?.status === 'healthy' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">FastAPI Backend</h4>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                appHealth?.status === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {appHealth?.status || 'UNREACHABLE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Endpoint: <code>/api/v1/health</code></p>
            {appHealth && (
              <div className="mt-2 text-xs space-y-1 text-slate-600">
                <div>Version: <span className="font-mono font-medium">{appHealth.version}</span></div>
                <div>Engine Mode: <span className="font-mono font-medium uppercase text-teal-700">{appHealth.app_mode}</span></div>
                <div>Station: <span className="font-mono font-medium">{appHealth.station_code}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Database Status */}
        <div className="flex items-start space-x-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
          <div className="mt-1">
            {isLoading ? (
              <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
            ) : dbHealth?.status === 'healthy' ? (
              <Database className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Database Engine</h4>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                dbHealth?.status === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {dbHealth?.status || 'DISCONNECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Endpoint: <code>/api/v1/health/db</code></p>
            {dbHealth && (
              <div className="mt-2 text-xs space-y-1 text-slate-600">
                <div>Dialect: <span className="font-mono font-medium uppercase">{dbHealth.dialect}</span></div>
                <div>Type: <span className="font-mono font-medium capitalize">{dbHealth.database_url_type}</span></div>
                <div>Latency: <span className="font-mono font-medium text-blue-700">{dbHealth.latency_ms} ms</span></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <strong>Connectivity Warning:</strong> {error}
        </div>
      )}

      <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center">
        <span>Phase 1 Scaffolding Verification</span>
        <span>Last probed: {lastChecked || 'Never'}</span>
      </div>
    </div>
  );
};
