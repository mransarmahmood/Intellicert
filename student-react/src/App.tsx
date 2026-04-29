import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Lazy-load route pages so the initial bundle stays small.
// Login + Layout stay eager because they're on the critical first-paint path.
const HomePage = lazy(() => import('./pages/HomePage'));
const DomainPage = lazy(() => import('./pages/DomainPage'));
const TopicPage = lazy(() => import('./pages/TopicPage'));
const StudyHubPage = lazy(() => import('./pages/StudyHubPage'));
const FlashcardStudyPage = lazy(() => import('./pages/FlashcardStudyPage'));
const QuizPracticePage = lazy(() => import('./pages/QuizPracticePage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const FocusModePage = lazy(() => import('./pages/FocusModePage'));
const FeynmanPage = lazy(() => import('./pages/FeynmanPage'));
const LearningFlowPage = lazy(() => import('./pages/LearningFlowPage'));
const NumberBoardPage = lazy(() => import('./pages/NumberBoardPage'));
const RegulationsPage = lazy(() => import('./pages/RegulationsPage'));
const CalcDrillPage = lazy(() => import('./pages/CalcDrillPage'));
const BlitzModePage = lazy(() => import('./pages/BlitzModePage'));
const FlaggedPage = lazy(() => import('./pages/FlaggedPage'));
const ConceptMapsPage = lazy(() => import('./pages/ConceptMapsPage'));
const FormulaGuidePage = lazy(() => import('./pages/FormulaGuidePage'));
const StudyPlanPage = lazy(() => import('./pages/StudyPlanPage'));
const ExamSimulatorPage = lazy(() => import('./pages/ExamSimulatorPage'));
const ConfusionMapPage = lazy(() => import('./pages/ConfusionMapPage'));
const DailyRevisionQueuePage = lazy(() => import('./pages/DailyRevisionQueuePage'));
const FlashcardReviewPage = lazy(() => import('./pages/FlashcardReviewPage'));
const GamificationProfilePage = lazy(() => import('./pages/GamificationProfilePage'));
const MissionsPage = lazy(() => import('./pages/MissionsPage'));
const BadgeGalleryPage = lazy(() => import('./pages/BadgeGalleryPage'));
const AchievementFeedPage = lazy(() => import('./pages/AchievementFeedPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const DomainStudyGuidePage = lazy(() => import('./pages/DomainStudyGuidePage'));
const StudyGuidesPage = lazy(() => import('./pages/StudyGuidesPage'));
const VisualLibraryPage = lazy(() => import('./pages/VisualLibraryPage'));
const SyllabusCoveragePage = lazy(() => import('./pages/SyllabusCoveragePage'));
const MasteryLibraryPage = lazy(() => import('./pages/MasteryLibraryPage'));
const MasteryTopicPage = lazy(() => import('./pages/MasteryTopicPage'));

function PageSpinner() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-ink-dim">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-ink-dim">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap);
  useEffect(() => { bootstrap(); }, [bootstrap]);

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/domains/:id" element={<DomainPage />} />
          <Route path="/domains/:id/study-guide" element={<DomainStudyGuidePage />} />
          <Route path="/study-guides" element={<StudyGuidesPage />} />
          <Route path="/topics/:id" element={<TopicPage />} />
          <Route path="/study" element={<StudyHubPage />} />
          <Route path="/study/flashcards/:domainId" element={<FlashcardStudyPage />} />
          <Route path="/study/quizzes/:domainId" element={<QuizPracticePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/feynman" element={<FeynmanPage />} />
          <Route path="/feynman/:topicId" element={<FeynmanPage />} />
          <Route path="/topics/:id/learn" element={<LearningFlowPage />} />
          <Route path="/calc-drill" element={<CalcDrillPage />} />
          <Route path="/number-board" element={<NumberBoardPage />} />
          <Route path="/regulations" element={<RegulationsPage />} />
          <Route path="/blitz" element={<BlitzModePage />} />
          <Route path="/flagged" element={<FlaggedPage />} />
          <Route path="/concept-maps" element={<ConceptMapsPage />} />
          <Route path="/formulas" element={<FormulaGuidePage />} />
          <Route path="/study-plan" element={<StudyPlanPage />} />
          <Route path="/exam-simulator" element={<ExamSimulatorPage />} />
          <Route path="/confusion-map" element={<ConfusionMapPage />} />
          <Route path="/memory/revision-queue" element={<DailyRevisionQueuePage />} />
          <Route path="/memory/flashcards/:flashcardId" element={<FlashcardReviewPage />} />
          <Route path="/gamification/profile" element={<GamificationProfilePage />} />
          <Route path="/gamification/missions" element={<MissionsPage />} />
          <Route path="/gamification/badges" element={<BadgeGalleryPage />} />
          <Route path="/gamification/achievements" element={<AchievementFeedPage />} />
          <Route path="/gamification/leaderboard" element={<LeaderboardPage />} />
          <Route path="/visuals" element={<VisualLibraryPage />} />
          <Route path="/syllabus" element={<SyllabusCoveragePage />} />
          {/* Mastery Library — premium-gated server-side */}
          <Route path="/mastery" element={<MasteryLibraryPage />} />
          <Route path="/mastery/:masteryId" element={<MasteryTopicPage />} />
        </Route>
        {/* Focus mode bypasses the Layout for a full-screen takeover */}
        <Route
          path="/focus"
          element={
            <ProtectedRoute>
              <FocusModePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
