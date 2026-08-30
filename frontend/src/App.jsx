import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { WorkflowProvider } from './context/WorkflowContext.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DataCleaning from './pages/DataCleaning.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'
import Upload from './pages/Upload.jsx'
import Summary from './pages/Summary.jsx'
import Configuration from './pages/Configuration.jsx'
import DataAugmentation from './pages/DataAugmentation.jsx'
import PrivacySecurity from './pages/PrivacySecurity.jsx'
import Outliers from './pages/Outliers.jsx'
import Weights from './pages/Weights.jsx'
import Results from './pages/Results.jsx'
import TypoCorrection from './pages/TypoCorrection.jsx'
import Augmentation from './pages/Augmentation.jsx'
import Analytics from './pages/Analytics.jsx'
import DataEncryption from './pages/DataEncryption.jsx'
import History from './pages/History.jsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AdvancedCleaning from './pages/AdvancedCleaning.jsx'
import SyntheticData from './pages/SyntheticData.jsx'
import PrivacyProtection from './pages/PrivacyProtection.jsx'
import AIDataAssistant from './pages/AIDataAssistant.jsx'
import Projects from './pages/Projects.jsx'
import CreateProject from './pages/CreateProject.jsx'
import ProjectDashboard from './pages/ProjectDashboard.jsx'
import ProjectDataCleaning from './pages/ProjectDataCleaning.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <WorkflowProvider>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/data-cleaning" element={<ProtectedRoute><DataCleaning /></ProtectedRoute>} />
          <Route path="/augmentation" element={<ProtectedRoute><Augmentation /></ProtectedRoute>} />
          <Route path="/typo-correction" element={<ProtectedRoute><TypoCorrection /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/data-encryption" element={<ProtectedRoute><DataEncryption /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/ai-assistant" element={<ProtectedRoute><AIDataAssistant /></ProtectedRoute>} />
          <Route path="/advanced-cleaning" element={<ProtectedRoute><AdvancedCleaning /></ProtectedRoute>} />
          <Route path="/synthetic-data" element={<ProtectedRoute><SyntheticData /></ProtectedRoute>} />
          <Route path="/privacy-protection" element={<ProtectedRoute><PrivacyProtection /></ProtectedRoute>} />
          
          {/* Project Collaboration Routes */}
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/create" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>} />
          <Route path="/projects/:projectId/datasets/:datasetId/clean" element={<ProtectedRoute><ProjectDataCleaning /></ProtectedRoute>} />
          
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          
          {/* Workflow Routes - accessible through data-cleaning */}
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/summary" element={<ProtectedRoute><Summary /></ProtectedRoute>} />
          <Route path="/configuration" element={<ProtectedRoute><Configuration /></ProtectedRoute>} />
          <Route path="/data-augmentation" element={<ProtectedRoute><DataAugmentation /></ProtectedRoute>} />
          <Route path="/privacy-security" element={<ProtectedRoute><PrivacySecurity /></ProtectedRoute>} />
          <Route path="/outliers" element={<ProtectedRoute><Outliers /></ProtectedRoute>} />
          <Route path="/weights" element={<ProtectedRoute><Weights /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </WorkflowProvider>
  )
}

export default App
