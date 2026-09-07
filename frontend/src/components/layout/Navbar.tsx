import React, { useState } from 'react';
import { CloudRain, Menu, X, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Curriculum', href: '#courses' },
    { name: 'How It Works', href: '#learning-journey' },
    { name: 'Competency AI', href: '#competency-ai' },
    { name: 'Offline Hub', href: '#offline-ecosystem' },
    { name: 'Role Previews', href: '#role-previews' },
    { name: 'System Health', href: '#system-health' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand Identity */}
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-900 via-teal-700 to-amber-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <CloudRain className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                  CAPACITY CONNECT
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300">
                  SIH 26075
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                MoES &bull; India Meteorological Department
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-700">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-blue-800 transition-colors relative py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-500 hover:after:w-full after:transition-all"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Action CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#role-previews"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-900 to-teal-700 hover:from-blue-950 hover:to-teal-800 shadow-sm hover:shadow transition-all group"
            >
              <span>Explore Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-50 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <a
              href="#role-previews"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-900 to-teal-700 shadow"
            >
              <span>Explore Portal Previews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
