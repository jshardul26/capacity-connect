import React, { useState } from 'react';
import { Clock, Star, User, Layers, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { CourseCardData } from '../../types';

export const CoursesSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedCourse, setSelectedCourse] = useState<CourseCardData | null>(null);

  const categories = [
    'All',
    'Radar Meteorology',
    'NWP Modeling',
    'Satellite Remote Sensing',
    'Surface Instrumentation',
    'Disaster Warning'
  ];

  const courses: CourseCardData[] = [
    {
      id: 'c-01',
      code: 'MET-401',
      title: 'Advanced Doppler Weather Radar & Quantitative Precipitation Estimation',
      category: 'Radar Meteorology',
      level: 'Intermediate',
      durationHours: 12.5,
      lessonCount: 18,
      instructorName: 'Dr. Rajesh Singh',
      instructorTitle: 'Lead Radar Meteorologist, IMD',
      rating: 4.9,
      enrolledCount: 142,
      imageUrl: 'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?w=600&auto=format&fit=crop&q=80',
      description: 'Comprehensive capacity building on S-band and X-band Doppler radars, velocity dealiasing, ground clutter removal, and rainfall rate estimation.',
    },
    {
      id: 'c-02',
      code: 'NWP-502',
      title: 'Operational WRF Modeling & High-Resolution Regional Data Assimilation',
      category: 'NWP Modeling',
      level: 'Advanced',
      durationHours: 16.0,
      lessonCount: 24,
      instructorName: 'Dr. Sunita Rao',
      instructorTitle: 'Scientist-F, NWP Division',
      rating: 4.8,
      enrolledCount: 98,
      imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&auto=format&fit=crop&q=80',
      description: 'Parametric atmospheric physics, grid nesting setup, boundary layer parameterizations, and GFS boundary condition ingestion.',
    },
    {
      id: 'c-03',
      code: 'SAT-301',
      title: 'Satellite Meteorology: INSAT-3D & 3DR Multispectral Imagery Analysis',
      category: 'Satellite Remote Sensing',
      level: 'Intermediate',
      durationHours: 10.0,
      lessonCount: 14,
      instructorName: 'Dr. A. K. Sharma',
      instructorTitle: 'Senior Satellite Forecaster',
      rating: 4.9,
      enrolledCount: 215,
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      description: 'RGB composite interpretation, thermal infrared cloud top temperatures, water vapor channels, and rapid scan severe weather analysis.',
    },
    {
      id: 'c-04',
      code: 'AWS-201',
      title: 'Automatic Weather Station (AWS) Maintenance, Sensors & Calibration',
      category: 'Surface Instrumentation',
      level: 'Beginner',
      durationHours: 8.0,
      lessonCount: 12,
      instructorName: 'Er. Manoj Verma',
      instructorTitle: 'Surface Instruments Specialist',
      rating: 4.7,
      enrolledCount: 180,
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      description: 'Field sensor diagnostics for barometric pressure, tipping bucket rain gauges, platinum resistance thermometers, and telemetry logs.',
    },
    {
      id: 'c-05',
      code: 'CYC-601',
      title: 'Tropical Cyclone Tracking, Dvorak Intensity Estimation & Warnings',
      category: 'Disaster Warning',
      level: 'Advanced',
      durationHours: 14.0,
      lessonCount: 20,
      instructorName: 'Dr. M. Mohapatra',
      instructorTitle: 'Tropical Cyclone Specialist',
      rating: 5.0,
      enrolledCount: 310,
      imageUrl: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=600&auto=format&fit=crop&q=80',
      description: 'Curved band and eye pattern Dvorak T-number estimation, storm surge hydrodynamic calculations, and standard warning bulletin drafting.',
    },
    {
      id: 'c-06',
      code: 'AGR-101',
      title: 'District Agrometeorological Advisory Services & Farmer Bulletins',
      category: 'Surface Instrumentation',
      level: 'Beginner',
      durationHours: 6.0,
      lessonCount: 8,
      instructorName: 'Dr. K. K. Singh',
      instructorTitle: 'Head, Agromet Advisory',
      rating: 4.8,
      enrolledCount: 165,
      imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
      description: 'Soil moisture indexing, microclimate advisory formulation, crop-stage weather impact translation, and rural dissemination networks.',
    },
  ];

  const filteredCourses = activeCategory === 'All'
    ? courses
    : courses.filter((c) => c.category === activeCategory);

  return (
    <section id="courses" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider">
            Curated Curriculum
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Specialized Meteorological Training Courses
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Role-oriented courses designed by IMD domain specialists. All materials, lectures, and assessments are 100% packaged for offline learning on Capacity Connect OS.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Course Image Banner with Category Badge */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    onError={(e) => {
                      // Fallback gradient if unsplash image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-blue-900/90 text-blue-200 border border-blue-700/80 backdrop-blur-sm">
                      {course.code}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500 text-slate-950 shadow">
                      {course.category}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      <span>{course.durationHours} hrs</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
                      <span>{course.lessonCount} Modules</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] font-mono uppercase text-slate-300">
                      {course.level}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2 leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Instructor & Rating */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-blue-900 flex items-center justify-center font-bold text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-slate-800">{course.instructorName}</div>
                        <div className="text-[10px] text-slate-500">{course.instructorTitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{course.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => setSelectedCourse(course)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-900 hover:text-white border border-blue-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>View Syllabus &amp; Offline Specs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Syllabus Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-mono font-bold">
                {selectedCourse.code}
              </span>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">{selectedCourse.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedCourse.description}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-700 border border-slate-200">
              <div className="font-semibold text-slate-900 mb-1">Course Distribution Attributes:</div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Offline Video Lectures (H.264 / 1080p, SHA-256 Checksummed)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Downloadable Slide Presentations &amp; Practical Notes (PDF)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Timed MCQ Assessment with Local Auto-Grading &amp; HMAC Ledger</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Close
              </button>
              <a
                href="#offline-ecosystem"
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 shadow"
              >
                Inspect Offline Package
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
