import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import SplashScreen from './pages/SplashScreen';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import GeoDashboard from './pages/GeoDashboard';
import HazardReport from './pages/HazardReport';
import HazardList from './pages/HazardList';
import MapView from './pages/MapView';
import JSAPage from './pages/JSAPage';
import SafetyMomentPage from './pages/SafetyMomentPage';
import MoMPage from './pages/MoMPage';
import LearningPage from './pages/LearningPage';
import ModuleDetail from './pages/ModuleDetail';
import AssessmentPage from './pages/AssessmentPage';
import FinalExamPage from './pages/FinalExamPage';
import CertificatePage from './pages/CertificatePage';
import MissionsPage from './pages/MissionsPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import SafetyCampaignPage from './pages/SafetyCampaignPage';
import K3RegulationsPage from './pages/K3RegulationsPage';
import MiniGamesPage from './pages/MiniGamesPage';
import MemberCardPage from './pages/MemberCardPage';
import GeonovaPage from './pages/GeonovaPage';
import GeonovaRockIdPage from './pages/GeonovaRockIdPage';
import GeonovaFieldLogPage from './pages/GeonovaFieldLogPage';
import GeonovaLearningPage from './pages/GeonovaLearningPage';
import GeonovaLessonPage from './pages/GeonovaLessonPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Redirect if user doesn't have one of the allowed roles */
function RoleRoute({ allow, children }: { allow: string[]; children: React.ReactNode }) {
  const { user } = useStore();
  const role = user?.role ?? 'public';
  if (!allow.includes(role)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

/** App root — redirect public users away from dashboard */
function AppIndex() {
  const { user } = useStore();
  if (user?.role === 'public') return <Navigate to="/app/hazards" replace />;
  return <Dashboard />;
}

const MEMBER_ROLES = ['admin', 'member'];
const NON_PUBLIC = ['admin', 'member', 'candidate'];

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#fff', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cert/verify/:hash" element={<CertificatePage verify />} />
        <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<AppIndex />} />

          {/* Member + Admin only */}
          <Route path="geodashboard" element={<GeoDashboard />} />
          <Route path="jsa" element={<RoleRoute allow={MEMBER_ROLES}><JSAPage /></RoleRoute>} />
          <Route path="safety-moment" element={<RoleRoute allow={MEMBER_ROLES}><SafetyMomentPage /></RoleRoute>} />
          <Route path="mom" element={<RoleRoute allow={MEMBER_ROLES}><MoMPage /></RoleRoute>} />
          <Route path="reports" element={<RoleRoute allow={MEMBER_ROLES}><ReportsPage /></RoleRoute>} />
          <Route path="campaign" element={<RoleRoute allow={MEMBER_ROLES}><SafetyCampaignPage /></RoleRoute>} />

          {/* All except public */}
          <Route path="learning" element={<RoleRoute allow={NON_PUBLIC}><LearningPage /></RoleRoute>} />
          <Route path="learning/:code" element={<RoleRoute allow={NON_PUBLIC}><ModuleDetail /></RoleRoute>} />
          <Route path="learning/:code/quiz" element={<RoleRoute allow={NON_PUBLIC}><AssessmentPage /></RoleRoute>} />
          <Route path="learning/final-exam" element={<RoleRoute allow={NON_PUBLIC}><FinalExamPage /></RoleRoute>} />
          <Route path="certificate" element={<RoleRoute allow={NON_PUBLIC}><CertificatePage /></RoleRoute>} />
          <Route path="missions" element={<RoleRoute allow={NON_PUBLIC}><MissionsPage /></RoleRoute>} />
          <Route path="k3-regulations" element={<RoleRoute allow={NON_PUBLIC}><K3RegulationsPage /></RoleRoute>} />
          <Route path="mini-games" element={<RoleRoute allow={NON_PUBLIC}><MiniGamesPage /></RoleRoute>} />

          {/* All roles */}
          <Route path="hazards" element={<HazardList />} />
          <Route path="hazards/new" element={<HazardReport />} />
          <Route path="map" element={<MapView />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="member-card" element={<RoleRoute allow={['member']}><MemberCardPage /></RoleRoute>} />

          {/* Geonova – all authenticated users */}
          <Route path="geonova" element={<GeonovaPage />} />
          <Route path="geonova/rock-id" element={<GeonovaRockIdPage />} />
          <Route path="geonova/field-log" element={<GeonovaFieldLogPage />} />
          <Route path="geonova/learning" element={<GeonovaLearningPage />} />
          <Route path="geonova/lesson/:topicId" element={<GeonovaLessonPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
