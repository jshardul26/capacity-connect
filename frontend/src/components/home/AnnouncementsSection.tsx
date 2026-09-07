import React, { useEffect, useState } from 'react';
import { Megaphone, Calendar, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AnnouncementItem } from '../../types';

export const AnnouncementsSection: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    adminService
      .getActiveAnnouncements(false, 6)
      .then((data) => setAnnouncements(data))
      .catch((err) => console.error('Failed to load announcements:', err));
  }, []);

  if (announcements.length === 0) {
    return null; // Do not display if no announcements published yet
  }

  return (
    <section className="bg-slate-900 border-b border-slate-800 py-6 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Official Institutional Bulletins &amp; Directives
              </span>
              <p className="text-[11px] text-slate-400">
                Ministry of Earth Sciences &bull; India Meteorological Department Official Announcements
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            Active Bulletins: {announcements.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="flex items-center space-x-1 text-[10px] font-mono text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                  </span>
                  {ann.is_featured_on_homepage && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Priority Bulletin
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mb-1.5 line-clamp-1">{ann.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{ann.content}</p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                <span>By: {ann.author_name || 'IMD Authority'}</span>
                <span className="flex items-center text-teal-400 font-medium">
                  Verified Directive <ShieldCheck className="w-3 h-3 ml-1 text-teal-400" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default AnnouncementsSection;
