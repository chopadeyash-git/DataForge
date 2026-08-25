import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiUpload, FiBarChart, FiSettings, FiAlertTriangle, FiTarget, FiCheckCircle } from 'react-icons/fi'
import { projectAPI } from '../services/projectAPI'
import { useWorkflow } from '../hooks/useWorkflow.js'
import { WorkflowProvider } from '../context/WorkflowContext.jsx'

// Import the same components used in DataCleaning
import Summary from './Summary'
import ProjectConfiguration from '../components/ProjectConfiguration'
import Outliers from './Outliers'
import Weights from './Weights'
import Results from './Results'

const cleaningSteps = [
  { 
    id: 'summary', 
    label: 'Data Summary', 
    icon: FiBarChart,
    component: Summary,
    description: 'View data overview'
  },
  { 
    id: 'configuration', 
    label: 'Configuration', 
    icon: FiSettings,
    component: ProjectConfiguration,
    description: 'Configure cleaning settings'
  },
  { 
    id: 'outliers', 
    label: 'Outlier Detection', 
    icon: FiAlertTriangle,
    component: Outliers,
    description: 'Detect and handle outliers'
  },
  { 
    id: 'weights', 
    label: 'Weights & Estimation', 
    icon: FiTarget,
    component: Weights,
    description: 'Apply weights and calculate estimates'
  },
  { 
    id: 'results', 
    label: 'Results & Reports', 
    icon: FiCheckCircle,
    component: Results,
    description: 'View results and generate reports'
  }
]

// Custom wrapper component to provide project context to workflow
function ProjectWorkflowWrapper({ projectId, datasetId, children, summary }) {
  const { setConfig, setSummary } = useWorkflow()
  
  useEffect(() => {
    // Set project context in workflow config
    setConfig(prev => ({
      ...prev,
      project_id: projectId,
      dataset_id: datasetId
    }))
    
    // Set summary data if available
    if (summary) {
      setSummary(summary)
    }
  }, [projectId, datasetId, summary, setConfig, setSummary])
  
  return children
}

export default function ProjectDataCleaning() {
  const { projectId, datasetId } = useParams()
  const [activeStep, setActiveStep] = useState('summary')
  const [dataset, setDataset] = useState(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [summaryData, setSummaryData] = useState(null)

  useEffect(() => {
    fetchData()
  }, [projectId, datasetId])

  const fetchData = async () => {
    try {
      const [projectData, datasetsData] = await Promise.all([
        projectAPI.getProject(projectId),
        projectAPI.getProjectDatasets(projectId)
      ])
      setProject(projectData)
      const currentDataset = datasetsData.find(d => d.id.toString() === datasetId)
      setDataset(currentDataset)
      
      // Get actual dataset summary from backend
      if (currentDataset) {
        try {
          const summaryData = await projectAPI.getDatasetSummary(projectId, datasetId)
          setSummaryData(summaryData)
        } catch (err) {
          console.error('Failed to fetch dataset summary:', err)
          // Fallback to basic info if summary fails
          const fallbackSummary = {
            rows: currentDataset.rows || 0,
            column_names: Array.from({length: currentDataset.columns || 0}, (_, i) => `Column_${i+1}`),
            data_types: Object.fromEntries(
              Array.from({length: currentDataset.columns || 0}, (_, i) => [`Column_${i+1}`, 'object'])
            )
          }
          setSummaryData(fallbackSummary)
        }
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setLoading(false)
    }
  }

  const CurrentComponent = cleaningSteps.find(step => step.id === activeStep)?.component || Summary

  const handleStepContinue = () => {
    const steps = ['summary', 'configuration', 'outliers', 'weights', 'results']
    const currentIndex = steps.indexOf(activeStep)
    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <WorkflowProvider>
      <ProjectWorkflowWrapper 
        projectId={projectId} 
        datasetId={datasetId} 
        summary={summaryData}
      >
        <div className="min-h-screen bg-gray-50">
          {/* Back Navigation */}
          <div className="bg-white border-b px-6 py-4">
            <Link
              to={`/projects/${projectId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Project: {project?.name}
            </Link>
          </div>

          {/* Enhanced Data Cleaning Navigation */}
          <div className="cleaning-navigation" style={{padding: '5px'}}>
            <div className="nav-container">
              <div className="nav-steps">
                {cleaningSteps.map((step) => {
                  const Icon = step.icon
                  const isActive = activeStep === step.id
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`nav-step ${isActive ? 'active' : ''}`}
                      title={step.description}
                    >
                      <div className="step-icon">
                        <Icon size={20} />
                      </div>
                      <span className="step-label">{step.label}</span>
                      {isActive && <div className="active-indicator" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Current Step Content */}
          <div className="step-content-area" style={{padding: '5px'}}>
            <CurrentComponent onContinue={handleStepContinue} />
          </div>

          <style jsx="true">{`
            .cleaning-navigation {
              background: white;
              border-bottom: 1px solid var(--gray-200);
              padding: 1rem;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            }
            
            @media (min-width: 640px) {
              .cleaning-navigation {
                padding: 1.5rem 2rem;
              }
            }

            .nav-container {
              max-width: 1200px;
              margin: 0 auto;
            }

            .nav-steps {
              display: flex;
              gap: 0.5rem;
              overflow-x: auto;
              scrollbar-width: none;
              -ms-overflow-style: none;
              padding: 0.5rem 0;
            }

            .nav-steps::-webkit-scrollbar {
              display: none;
            }

            .nav-step {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              padding: 1rem 1.5rem;
              border: none;
              border-radius: 12px;
              background: transparent;
              color: var(--gray-600);
              cursor: pointer;
              transition: all 0.3s ease;
              font-size: 0.875rem;
              font-weight: 500;
              white-space: nowrap;
              position: relative;
              min-width: fit-content;
            }

            .nav-step:hover {
              background: var(--gray-50);
              color: var(--gray-800);
              transform: translateY(-1px);
            }

            .nav-step.active {
              background: var(--primary-50);
              color: var(--primary-700);
              box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
            }

            .step-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 8px;
              background: var(--gray-100);
              transition: all 0.3s ease;
            }

            .nav-step.active .step-icon {
              background: var(--primary-100);
              color: var(--primary-600);
            }

            .active-indicator {
              position: absolute;
              bottom: -2px;
              left: 50%;
              transform: translateX(-50%);
              width: 20px;
              height: 3px;
              background: var(--primary-500);
              border-radius: 2px;
            }

            .step-content-area {
              min-height: calc(100vh - 300px);
              background: var(--gray-50);
              padding: 2rem;
            }

            :root {
              --gray-50: #f9fafb;
              --gray-100: #f3f4f6;
              --gray-200: #e5e7eb;
              --gray-600: #4b5563;
              --gray-700: #374151;
              --gray-800: #1f2937;
              --primary-50: #eff6ff;
              --primary-100: #dbeafe;
              --primary-500: #3b82f6;
              --primary-600: #2563eb;
              --primary-700: #1d4ed8;
            }

            @media (max-width: 768px) {
              .cleaning-navigation {
                padding: 1rem;
              }

              .nav-step {
                padding: 0.75rem 1rem;
                min-width: 160px;
              }

              .step-content {
                flex-direction: column;
                gap: 0.5rem;
                text-align: center;
              }

              .step-title {
                font-size: 0.75rem;
              }
            }
          `}</style>
        </div>
      </ProjectWorkflowWrapper>
    </WorkflowProvider>
  )
}