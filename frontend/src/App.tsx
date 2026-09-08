import React, { useEffect, useState } from 'react';
import { TopBar } from './components/layout/TopBar';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/home/HeroSection';
import { FeatureCards } from './components/home/FeatureCards';
import { AboutSection } from './components/home/AboutSection';
import { StatsSection } from './components/home/StatsSection';
import { CoursesSection } from './components/home/CoursesSection';
import { LearningJourneySection } from './components/home/LearningJourneySection';
import { CompetencyAISection } from './components/home/CompetencyAISection';
import { OfflineEcosystemSection } from './components/home/OfflineEcosystemSection';
import { DashboardPreviewsSection } from './components/home/DashboardPreviewsSection';
import { AnnouncementsSection } from './components/home/AnnouncementsSection';
import { CTASection } from './components/home/CTASection';
import { HealthCheck } from './components/common/HealthCheck';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { AdminApprovalModal } from './components/admin/AdminApprovalModal';
import { TraineeProfileModal } from './components/trainee/TraineeProfileModal';
import { TrainerStudioModal } from './components/trainer/TrainerStudioModal';
import { CoursePlayerModal } from './components/course/CoursePlayerModal';
import { AssessmentCenterModal } from './components/assessment/AssessmentCenterModal';
import { CompetencyDashboardModal } from './components/competency/CompetencyDashboardModal';
import { useAuthStore } from './store/useAuthStore';
import { healthService } from './services/api';
import { createConnectivityProbe } from './services/connectivity';
import { HealthResponse } from './types';

export const App: React.FC = () => {
  const [appHealth, setAppHealth] = useState<HealthResponse | null>(null);
  const [isBrowserOnline, setIsBrowserOnline] = useState(navigator.onLine);
  const [pendingSyncEvents, setPendingSyncEvents] = useState<number | null>(null);
  const isLanNode = window.location.hostname === 'capacityconnect.local';
  const {
    isAdminModalOpen,
    closeAdminModal,
    isTraineeModalOpen,
    closeTraineeModal,
    isCoursePlayerOpen,
    closeCoursePlayer,
    selectedCourseIdForPlayer,
    isAssessmentModalOpen,
    closeAssessmentModal,
    selectedAssessmentId,
    isCompetencyModalOpen,
    closeCompetencyModal,
    loadSession,
    accessToken,
    user,
  } = useAuthStore();

  useEffect(() => {
    // Restore authenticated session from localStorage if present
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    // Authoritative reachability probe: navigator.onLine is only an estimate,
    // so poll the API health endpoint and drive the banner from the result.
    const updateConnectivity = () => setIsBrowserOnline(navigator.onLine);
    window.addEventListener('online', updateConnectivity);
    window.addEventListener('offline', updateConnectivity);

    const probe = createConnectivityProbe(async () => {
      try {
        const health = await healthService.getAppHealth();
        setAppHealth(health);
        return !!health;
      } catch {
        setAppHealth((previous) => previous);
        return false;
      }
    }, 20000, navigator.onLine);
    const unsubscribe = probe.subscribe(setIsBrowserOnline);
    probe.start();

    return () => {
      window.removeEventListener('online', updateConnectivity);
      window.removeEventListener('offline', updateConnectivity);
      unsubscribe();
      probe.stop();
    };
  }, []);

  useEffect(() => {
    if (!accessToken || user?.role !== 'admin') return;
    fetch('/api/v1/sync/status', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setPendingSyncEvents(data?.pending_events ?? null))
      .catch(() => setPendingSyncEvents(null));
  }, [accessToken, user?.role, isBrowserOnline]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 selection:bg-amber-400 selection:text-slate-950">
      {!isBrowserOnline && (
        <div className="bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-slate-950">
          Offline mode: locally cached courses, resources, progress, and assessment attempts remain available.
        </div>
      )}
      {isLanNode && (
        <div className="bg-sky-800 px-4 py-2 text-center text-xs font-semibold text-white">
          Capacity Connect LAN learning node — authenticated local sessions are stored on this field station.
        </div>
      )}
      {isBrowserOnline && pendingSyncEvents !== null && pendingSyncEvents > 0 && (
        <div className="bg-teal-700 px-4 py-2 text-center text-xs font-semibold text-white">
          {pendingSyncEvents} local change{pendingSyncEvents === 1 ? '' : 's'} awaiting synchronization.
        </div>
      )}
      {/* 1. Institutional Top Bar */}
      <TopBar 
        appMode={appHealth?.app_mode || 'local'} 
        stationCode={appHealth?.station_code || 'IMD-HQ-DELHI'} 
        isOnline={!!appHealth}
      />

      {/* 2. Main Sticky Navigation */}
      <Navbar />

      {/* 3. Hero Section with Atmosphere Gradient & Dual CTAs */}
      <HeroSection />

      {/* 3.5 Institutional Announcements Bulletin Feed (Phase 7) */}
      <AnnouncementsSection />

      {/* 4. Overlapping 4 Numbered Feature Cards (01 to 04) */}
      <FeatureCards />

      {/* 5. Editorial About / Platform Storytelling Composition */}
      <AboutSection />

      {/* 6. Impact & Target Benchmarks Counter Band */}
      <StatsSection />

      {/* 7. Curated Courses Catalog with Interactive Category Filters */}
      <CoursesSection />

      {/* 8. 5-Stage Learning Experience Journey */}
      <LearningJourneySection />

      {/* 9. Explainable Competency AI & Skill-Gap Showcase */}
      <CompetencyAISection />

      {/* 10. Offline-First Ecosystem & Capacity Connect OS Showcase */}
      <OfflineEcosystemSection />

      {/* 11. Interactive Role Dashboard Previews (Trainee, Trainer, Admin) */}
      <DashboardPreviewsSection />

      {/* 12. Live Backend & Database Health Probe (Preserving Phase 1) */}
      <HealthCheck />

      {/* 13. Concluding Call to Action Banner */}
      <CTASection />

      {/* 14. 4-Column Institutional Footer */}
      <Footer />

      {/* Authentication, Clearance, Trainee & Trainer Modals */}
      <AuthModal />
      <AdminApprovalModal isOpen={isAdminModalOpen} onClose={closeAdminModal} />
      <TraineeProfileModal isOpen={isTraineeModalOpen} onClose={closeTraineeModal} />
      <TrainerStudioModal />
      <CoursePlayerModal
        isOpen={isCoursePlayerOpen}
        onClose={closeCoursePlayer}
        courseId={selectedCourseIdForPlayer}
      />
      <AssessmentCenterModal
        isOpen={isAssessmentModalOpen}
        onClose={closeAssessmentModal}
        initialAssessmentId={selectedAssessmentId}
      />
      <CompetencyDashboardModal
        isOpen={isCompetencyModalOpen}
        onClose={closeCompetencyModal}
      />
    </div>
  );
};

export default App;
