import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import NewsDashboard from './pages/NewsDashboard'
import NewsVerificationDashboard from './pages/NewsVerificationDashboard'
import IntegrityDashboard from './pages/IntegrityDashboard'
import AlertsDashboard from './pages/AlertsDashboard'
import CommunityVerificationDashboard from './pages/CommunityVerificationDashboard'
import Profile from './pages/Profile'
import NewsSubmission from './pages/NewsSubmission'
import NewsMap from './pages/NewsMap'
import MeTTaViewer from './pages/MeTTaViewer'
import BlockchainView from './pages/BlockchainView'
import AuthGuard from './components/auth/AuthGuard'

function App() {
  return (
    <AuthProvider>
      <AppLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/news-map" element={<NewsMap />} />


          {/* Protected Routes */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/news-dashboard" element={<AuthGuard><NewsDashboard /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/submit-news" element={<AuthGuard><NewsSubmission /></AuthGuard>} />
          <Route path="/metta" element={<AuthGuard><MeTTaViewer /></AuthGuard>} />
          <Route path="/blockchain" element={<AuthGuard><BlockchainView /></AuthGuard>} />
          <Route path="/news-verification" element={<AuthGuard><NewsVerificationDashboard /></AuthGuard>} />
          <Route path="/integrity" element={<AuthGuard><IntegrityDashboard /></AuthGuard>} />
          <Route path="/alerts" element={<AuthGuard><AlertsDashboard /></AuthGuard>} />
          <Route path="/community-verification" element={<AuthGuard><CommunityVerificationDashboard /></AuthGuard>} />

          {/* Journalist Only Routes */}
          <Route path="/analytics" element={
            <AuthGuard requiredRole="journalist">
              <Dashboard />
            </AuthGuard>
          } />
        </Routes>
      </AppLayout>
    </AuthProvider>
  )
}

export default App