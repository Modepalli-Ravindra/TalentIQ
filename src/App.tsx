import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CommandPalette } from './components/ui/CommandPalette';
import { AuthModal } from './components/auth/AuthModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { NotificationsPanel } from './components/notifications/NotificationsPanel';
import { UserRole, JobPosting, CandidateApplication, ExternalJob } from './types';
import { jobService, applicationService, isSupabaseConfigured } from './lib/supabase';
import { MOCK_CANDIDATE, MOCK_APPLICATIONS } from './data/mockData';

// Lazy-loaded Views for code splitting
const LandingPage = lazy(() => import('./views/LandingPage').then(m => ({ default: m.LandingPage })));
const JobSearchPage = lazy(() => import('./views/JobSearchPage').then(m => ({ default: m.JobSearchPage })));
const CandidateDashboard = lazy(() => import('./views/CandidateDashboard').then(m => ({ default: m.CandidateDashboard })));
const RecruiterDashboard = lazy(() => import('./views/RecruiterDashboard').then(m => ({ default: m.RecruiterDashboard })));
const AnalyticsDashboard = lazy(() => import('./views/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const AdminDashboard = lazy(() => import('./views/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SettingsPage = lazy(() => import('./views/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SearchPage = lazy(() => import('./views/SearchPage').then(m => ({ default: m.SearchPage })));
const CompanyPage = lazy(() => import('./views/CompanyPage').then(m => ({ default: m.CompanyPage })));
const CandidateProfilePage = lazy(() => import('./views/CandidateProfilePage').then(m => ({ default: m.CandidateProfilePage })));

// Lazy-loaded Modals
const JobDetailsModal = lazy(() => import('./components/jobs/JobDetailsModal').then(m => ({ default: m.JobDetailsModal })));
const AIFitAnalyzerModal = lazy(() => import('./components/jobs/AIFitAnalyzerModal').then(m => ({ default: m.AIFitAnalyzerModal })));
const ExternalJobDetailModal = lazy(() => import('./components/jobs/ExternalJobDetailModal').then(m => ({ default: m.ExternalJobDetailModal })));

function ViewLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function MainAppContent() {
  const { isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTargetLabel, setAuthTargetLabel] = useState('Intelligence Workspace');
  const [pendingRedirectView, setPendingRedirectView] = useState<string | null>(null);

  // Modals state
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobPosting | null>(null);
  const [selectedJobForFitAnalyzer, setSelectedJobForFitAnalyzer] = useState<JobPosting | null>(null);
  const [selectedExternalJob, setSelectedExternalJob] = useState<ExternalJob | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Application Data state
  const [applications, setApplications] = useState<CandidateApplication[]>(MOCK_APPLICATIONS);

  // Fetch applications from Supabase
  const fetchApplications = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return;
    const { data } = await applicationService.listByCandidate(user.id);
    if (data && data.length > 0) {
      const mapped: CandidateApplication[] = data.map((a: any) => {
        const job = a.jobs as Record<string, unknown> | null;
        return {
          id: a.id,
          jobId: a.job_id || '',
          jobTitle: (job?.title as string) || 'Unknown Position',
          company: (job?.company as string) || 'Unknown Company',
          companyLogo: (job?.company_logo as string) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
          appliedDate: a.applied_at ? new Date(a.applied_at).toLocaleDateString() : 'Recently',
          stage: mapStatusToStage(a.status),
          matchScore: (a.ai_match_score as number) || 85,
          nextStep: 'Review in progress',
        };
      });
      setApplications(mapped);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) fetchApplications();
  }, [isAuthenticated, fetchApplications]);

  // Redirect authenticated users off landing page
  useEffect(() => {
    if (isAuthenticated && currentView === 'landing') {
      const defaultView = user?.role === 'recruiter' ? 'recruiter-dashboard' : 'jobs';
      setCurrentView(pendingRedirectView || defaultView);
      setPendingRedirectView(null);
    }
  }, [isAuthenticated, currentView, user?.role, pendingRedirectView]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView('landing');
    }
  }, [isAuthenticated]);

  const handleNavigateView = (view: string) => {
    const isPublicView = view === 'landing';
    if (!isPublicView && !isAuthenticated) {
      setAuthTargetLabel(view.replace('-', ' ').toUpperCase());
      setPendingRedirectView(view);
      setIsAuthModalOpen(true);
    } else {
      setCurrentView(view);
      setSelectedCompanyId(null);
    }
  };

  const handleApplySuccess = (job: JobPosting) => {
    const newApp: CandidateApplication = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      appliedDate: new Date().toISOString().split('T')[0],
      stage: 'Applied',
      matchScore: job.matchScore || 90,
      nextStep: 'Awaiting Initial AI Resume Parsing',
      candidateName: user?.name || MOCK_CANDIDATE.name,
      candidateEmail: user?.email || 'alex.rivera@example.com',
      candidateAvatar: user?.avatar || MOCK_CANDIDATE.avatar,
    };
    setApplications((prev) => [newApp, ...prev]);

    if (isSupabaseConfigured() && user) {
      applicationService.create({
        job_id: job.id,
        candidate_id: user.id,
        ai_match_score: job.matchScore || 85,
      });
    }
  };

  const mapExternalToPosting = (ext: ExternalJob): JobPosting => ({
    id: ext.id,
    title: ext.title,
    company: ext.company_name,
    companyLogo: ext.company_logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    location: ext.location || 'Remote',
    locationType: ext.is_remote ? 'Remote' : 'Onsite',
    type: (ext.employment_type as any) || 'Full-time',
    salaryMin: 0,
    salaryMax: 0,
    currency: 'USD',
    experienceLevel: (ext.ai_seniority as any) || 'Mid',
    techStack: ext.ai_skills?.length ? ext.ai_skills : ext.tags,
    description: ext.description || '',
    responsibilities: [],
    requirements: [],
    benefits: [],
    postedAt: ext.published_at ? new Date(ext.published_at).toLocaleDateString() : 'Recently',
    matchScore: 85,
    applicantsCount: 0,
    status: 'published',
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-white selection:bg-blue-500/30 selection:text-blue-200">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#18181B', color: '#fff', border: '1px solid #27272A', borderRadius: '12px', fontSize: '13px' },
        }}
      />

      <Navbar
        currentView={currentView}
        onNavigateView={handleNavigateView}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAuthModal={(label) => {
          setAuthTargetLabel(label || 'Intelligence Workspace');
          setIsAuthModalOpen(true);
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      <main className="flex-1">
        <Suspense fallback={<ViewLoader />}>
        {currentView === 'landing' && !isAuthenticated && (
          <LandingPage
            onSelectJob={(job) => {
              if (!isAuthenticated) {
                setAuthTargetLabel('Job Details & AI Fit Score');
                setIsAuthModalOpen(true);
              } else {
                setSelectedJobForDetails(job);
              }
            }}
            onAnalyzeFit={(job) => {
              if (!isAuthenticated) {
                setAuthTargetLabel('AI Candidate Fit Analyzer');
                setIsAuthModalOpen(true);
              } else {
                setSelectedJobForFitAnalyzer(job);
              }
            }}
            onExploreJobs={() => handleNavigateView('jobs')}
            onExternalJobSelect={(ext) => setSelectedExternalJob(ext)}
          />
        )}

        {currentView === 'jobs' && isAuthenticated && (
          <JobSearchPage
            onSelectJob={setSelectedJobForDetails}
            onAnalyzeFit={setSelectedJobForFitAnalyzer}
            onExternalJobSelect={(ext) => setSelectedExternalJob(ext)}
          />
        )}

        {currentView === 'search' && isAuthenticated && (
          <SearchPage
            onSelectJob={setSelectedJobForDetails}
            onAnalyzeFit={setSelectedJobForFitAnalyzer}
            onExternalJobSelect={(ext) => setSelectedExternalJob(ext)}
            onSelectCompany={(c) => {
              setSelectedCompanyId(c.id);
              setCurrentView('company');
            }}
          />
        )}

        {currentView === 'candidate-dashboard' && isAuthenticated && (
          <CandidateDashboard
            candidate={MOCK_CANDIDATE}
            applications={applications}
            onExploreJobs={() => handleNavigateView('jobs')}
          />
        )}

        {currentView === 'candidate-profile' && isAuthenticated && (
          <CandidateProfilePage />
        )}

        {currentView === 'recruiter-dashboard' && isAuthenticated && (
          <RecruiterDashboard applications={applications} />
        )}

        {currentView === 'analytics' && isAuthenticated && <AnalyticsDashboard />}

        {currentView === 'admin-dashboard' && isAuthenticated && <AdminDashboard />}

        {currentView === 'settings' && isAuthenticated && <SettingsPage />}

        {currentView === 'company' && selectedCompanyId && (
          <CompanyPage companyId={selectedCompanyId} onBack={() => handleNavigateView('search')} />
        )}
        </Suspense>
      </main>

      {(!isAuthenticated || currentView === 'landing') && <Footer />}

      {/* Modals */}
      <Suspense fallback={null}>
      {selectedJobForDetails && (
        <JobDetailsModal
          job={selectedJobForDetails}
          candidate={MOCK_CANDIDATE}
          onClose={() => setSelectedJobForDetails(null)}
          onOpenFitAnalyzer={(job) => {
            setSelectedJobForFitAnalyzer(job);
            setSelectedJobForDetails(null);
          }}
        />
      )}

      {selectedExternalJob && (
        <ExternalJobDetailModal
          job={selectedExternalJob}
          onClose={() => setSelectedExternalJob(null)}
          onApply={() => {
            if (!isAuthenticated) {
              setAuthTargetLabel('Apply to Job');
              setIsAuthModalOpen(true);
            }
            setSelectedExternalJob(null);
          }}
          onEvaluateFit={() => {
            const posting = mapExternalToPosting(selectedExternalJob);
            setSelectedExternalJob(null);
            if (!isAuthenticated) {
              setAuthTargetLabel('AI Fit Analysis');
              setIsAuthModalOpen(true);
            } else {
              setSelectedJobForFitAnalyzer(posting);
            }
          }}
        />
      )}

      {selectedJobForFitAnalyzer && (
        <AIFitAnalyzerModal
          job={selectedJobForFitAnalyzer}
          candidate={MOCK_CANDIDATE}
          onClose={() => setSelectedJobForFitAnalyzer(null)}
          onApplySuccess={() => {
            handleApplySuccess(selectedJobForFitAnalyzer);
            setSelectedJobForFitAnalyzer(null);
          }}
        />
      )}
      </Suspense>

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          targetViewLabel={authTargetLabel}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccessRedirect={() => {
            setIsAuthModalOpen(false);
            const target = pendingRedirectView || (user?.role === 'recruiter' ? 'recruiter-dashboard' : 'jobs');
            setCurrentView(target);
            setPendingRedirectView(null);
          }}
        />
      )}

      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectRole={() => {}}
        onNavigateView={(view: string) => {
          handleNavigateView(view);
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
}

function mapStatusToStage(status: string): CandidateApplication['stage'] {
  const map: Record<string, CandidateApplication['stage']> = {
    applied: 'Applied',
    screening: 'Screening',
    assessment: 'AI Assessment',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
  };
  return map[status] || 'Applied';
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <MainAppContent />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
