import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiUsers, FiDatabase, FiActivity, FiUpload, FiEye, FiClock } from 'react-icons/fi'
import { projectAPI } from '../services/projectAPI'

export default function ProjectDashboard() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [showCleaning, setShowCleaning] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [pipelineData, setPipelineData] = useState({
    summary: null,
    config: {
      imputation: { method: 'mean', columns: [] },
      outliers: { detection_method: 'iqr', handling_method: 'winsorize' },
      privacy: { enabled: false, columns: [] }
    },
    outliers: null,
    weights: null,
    results: null
  })
  const [processing, setProcessing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const fetchProjectData = async () => {
    if (!projectId) {
      setError('Project ID is missing')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      
      // Fetch project details
      const projectData = await projectAPI.getProject(projectId)
      setProject(projectData)
      
      // Fetch project datasets
      const datasetsData = await projectAPI.getProjectDatasets(projectId)
      setDatasets(datasetsData)
      
      // Fetch project activity
      const activityData = await projectAPI.getProjectActivity(projectId)
      setActivity(activityData.map(item => ({
        id: item.id,
        user: item.user_name,
        action: item.action.replace('_', ' '),
        time: new Date(item.created_at).toLocaleString(),
        details: item.details
      })))
      
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!memberEmail.trim()) return
    
    try {
      setAddingMember(true)
      await projectAPI.addMember(projectId, memberEmail.trim())
      // Force refresh by clearing cache and refetching
      setProject(null)
      setDatasets([])
      await fetchProjectData()
      setShowAddMember(false)
      setMemberEmail('')
      setAddingMember(false)
    } catch (err) {
      setError(err.message)
      setAddingMember(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    try {
      setUploading(true)
      await projectAPI.uploadDataset(projectId, file)
      // Force refresh by clearing cache and refetching
      setProject(null)
      setDatasets([])
      await fetchProjectData()
      setShowUpload(false)
      setUploading(false)
    } catch (err) {
      setError(err.message)
      setUploading(false)
    }
  }

  const handleProcessDataset = async () => {
    if (!selectedDataset) return
    
    try {
      setProcessing(true)
      const result = await projectAPI.processDataset(projectId, selectedDataset.id, pipelineData.config)
      await fetchProjectData()
      setPipelineData(prev => ({ ...prev, results: result }))
      setCurrentStep(5)
      setProcessing(false)
      setSuccessMessage(`Dataset processed successfully! ${result.processed_rows} rows, ${result.processed_columns} columns processed.`)
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      setError(err.message)
      setProcessing(false)
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const renderPipelineStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div>
            <h4 className="font-semibold mb-4">Data Summary</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Rows</div>
                  <div className="text-xl font-semibold">{selectedDataset?.rows || 0}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-600">Columns</div>
                  <div className="text-xl font-semibold">{selectedDataset?.columns || 0}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">File Size</div>
                <div className="font-semibold">{selectedDataset?.size || 'Unknown'}</div>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div>
            <h4 className="font-semibold mb-4">Configuration</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Missing Value Imputation</label>
                <select 
                  value={pipelineData.config.imputation.method}
                  onChange={(e) => setPipelineData(prev => ({
                    ...prev,
                    config: { ...prev.config, imputation: { ...prev.config.imputation, method: e.target.value }}
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="mean">Mean</option>
                  <option value="median">Median</option>
                  <option value="knn">KNN</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={pipelineData.config.privacy.enabled}
                    onChange={(e) => setPipelineData(prev => ({
                      ...prev,
                      config: { ...prev.config, privacy: { ...prev.config.privacy, enabled: e.target.checked }}
                    }))}
                  />
                  <span className="text-sm font-medium">Enable Privacy Protection</span>
                </label>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div>
            <h4 className="font-semibold mb-4">Outlier Detection</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Detection Method</label>
                <select 
                  value={pipelineData.config.outliers.detection_method}
                  onChange={(e) => setPipelineData(prev => ({
                    ...prev,
                    config: { ...prev.config, outliers: { ...prev.config.outliers, detection_method: e.target.value }}
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="iqr">IQR Method</option>
                  <option value="zscore">Z-Score</option>
                  <option value="isolation_forest">Isolation Forest</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Handling Method</label>
                <select 
                  value={pipelineData.config.outliers.handling_method}
                  onChange={(e) => setPipelineData(prev => ({
                    ...prev,
                    config: { ...prev.config, outliers: { ...prev.config.outliers, handling_method: e.target.value }}
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="winsorize">Winsorize</option>
                  <option value="remove">Remove</option>
                  <option value="cap">Cap Values</option>
                </select>
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div>
            <h4 className="font-semibold mb-4">Weights & Estimation</h4>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-blue-800 mb-2">Processing Configuration</div>
                <div className="text-xs text-blue-600 space-y-1">
                  <div>• Imputation: {pipelineData.config.imputation.method}</div>
                  <div>• Outlier Detection: {pipelineData.config.outliers.detection_method}</div>
                  <div>• Privacy: {pipelineData.config.privacy.enabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
              <button
                onClick={handleProcessDataset}
                disabled={processing}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Start Processing'}
              </button>
            </div>
          </div>
        )
      case 5:
        return (
          <div>
            <h4 className="font-semibold mb-4">Results & Reports</h4>
            {pipelineData.results ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-green-800 font-medium mb-2">Processing Complete!</div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>• Processed Rows: {pipelineData.results.processed_rows}</div>
                    <div>• Processed Columns: {pipelineData.results.processed_columns}</div>
                    <div>• Status: {pipelineData.results.success ? 'Success' : 'Failed'}</div>
                  </div>
                </div>
                {pipelineData.results.cleaning_log && (
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm font-medium mb-2">Processing Log:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      {pipelineData.results.cleaning_log.map((log, idx) => (
                        <div key={idx}>• {log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No results yet. Complete processing in step 4.
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/projects"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {successMessage}
            </div>
          )}
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project?.name}</h1>
              <p className="text-gray-600 mt-1">{project?.organization}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchProjectData}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                Refresh
              </button>
              <button 
                onClick={() => setShowUpload(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FiUpload className="w-5 h-5" />
                Upload Dataset
              </button>
            </div>
          </div>
        </div>



        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
              <input
                type="email"
                placeholder="Enter email address"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                disabled={addingMember}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              />
              {addingMember && (
                <div className="mb-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Adding member...</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddMember(false)}
                  disabled={addingMember}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={addingMember || !memberEmail.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Upload Dataset</h3>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full p-2 border border-gray-300 rounded"
              />
              {uploading && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Uploading...</p>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowUpload(false)}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Datasets */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FiDatabase className="w-5 h-5" />
                  Datasets
                </h2>
                <span className="text-sm text-gray-500">{datasets.length} datasets</span>
              </div>

              <div className="space-y-4">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {dataset.rows} rows × {dataset.columns} columns • v{dataset.version}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Uploaded by {dataset.uploaded_by} • {new Date(dataset.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            // Navigate to project data cleaning page
                            window.location.href = `/projects/${projectId}/datasets/${dataset.id}/clean`
                          }}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {datasets.length === 0 && (
                  <div className="text-center py-8">
                    <FiDatabase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No datasets yet</p>
                    <button 
                      onClick={() => setShowUpload(true)}
                      className="mt-3 text-blue-600 hover:text-blue-700"
                    >
                      Upload your first dataset
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FiActivity className="w-5 h-5" />
                Recent Activity
              </h2>

              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-gray-900">
                        <span className="font-medium">{item.user}</span> {item.action}
                      </p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiUsers className="w-5 h-5" />
                Team Members
              </h3>

              <div className="space-y-3">
                {project?.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {(member.username || member.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {member.username || member.name || 'Unknown'} {member.is_creator && '(Creator)'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowAddMember(true)}
                className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Member
              </button>
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {project?.created_date_formatted || (project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Organization:</span>
                  <span className="ml-2 text-gray-900">{project?.organization}</span>
                </div>
                <div>
                  <span className="text-gray-500">Members:</span>
                  <span className="ml-2 text-gray-900">{project?.member_count || project?.members?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Datasets:</span>
                  <span className="ml-2 text-gray-900">{project?.dataset_count || datasets.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}