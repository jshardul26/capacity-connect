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
import { CTASection } from './components/home/CTASection';
import { HealthCheck } from './components/common/HealthCheck';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { AdminApprovalModal } from './components/admin/AdminApprovalModal';
import { TraineeProfileModal } from './components/trainee/TraineeProfileModal';
import { useAuthStore } from './store/useAuthStore';
import { healthService } from './services/api';
import { HealthResponse } from './types';

export const App: React.FC = () => {
  const [appHealth, setAppHealth] = useState<HealthResponse | null>(null);
  const {
    isAdminModalOpen,
    closeAdminModal,
    isTraineeModalOpen,
    closeTraineeModal,
    loadSession,
  } = useAuthStore();

  useEffect(() => {
    // Probe backend health
    healthService.getAppHealth()
      .then(setAppHealth)
      .catch(() => setAppHealth(null));

    // Restore authenticated session from localStorage if present
    loadSession();
  }, [loadSession]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 selection:bg-amber-400 selection:text-slate-950">
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

      {/* Authentication, Clearance, & Trainee Modals */}
      <AuthModal />
      <AdminApprovalModal isOpen={isAdminModalOpen} onClose={closeAdminModal} />
      <TraineeProfileModal isOpen={isTraineeModalOpen} onClose={closeTraineeModal} />
    </div>
  );
};

export default App;
