import { useCallback, useState } from 'react'
import { useWorkflow } from '../hooks/useWorkflow.js'
import { API_BASE_URL } from '../config.js'
import WorkflowLayout from '../components/WorkflowLayout.jsx'
import WorkflowSteps from '../components/WorkflowSteps.jsx'
import { 
  FiFileText, FiPlay, FiCheckCircle, FiBarChart, FiDownload, 
  FiEye, FiFilePlus, FiTrendingUp, FiDatabase, FiClock,
  FiTarget, FiActivity, FiPieChart
} from 'react-icons/fi'

export default function Results({ onContinue }) {
  const { 
    summary, 
    config, 
    datasetId, 
    results, 
    setResults, 
    notify 
  } = useWorkflow()
  const [busy, setBusy] = useState(false)

  const startProcessing = useCallback(async () => {
    setBusy(true)
    setResults(null)
    const payload = {
      config: {
        imputation: { 
          method: config.imputation.method, 
          columns: config.imputation.columns.length ? config.imputation.columns : null 
        },
        outliers: { 
          detection_method: config.outliers.detection_method, 
          handling_method: config.outliers.handling_method, 
          columns: config.outliers.columns.length ? config.outliers.columns : null 
        },
        weights: { 
          column: config.weights.column || null 
        },
        estimate_columns: config.estimate_columns.length ? config.estimate_columns : null
      }
    }
    
    // Add project context if available
    if (config.project_id && config.dataset_id) {
      payload.project_id = config.project_id
      payload.dataset_id = config.dataset_id
    } else if (datasetId) {
      payload.dataset_id = datasetId
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/clean`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload), 
        credentials: 'include' 
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      setResults(data)
      notify('success', 'Processing completed successfully')
    } catch (e) {
      notify('error', `Processing failed: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }, [config, datasetId, setResults, notify])

  const generateReport = useCallback(async (format) => {
    if (!datasetId) {
      notify('error', 'No dataset selected. Please upload a file first.')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/report`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ dataset_id: datasetId, format }), 
        credentials: 'include' 
      })
      
      if (format === 'pdf') {
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(errorText || `HTTP ${res.status}`)
        }
        
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('application/pdf')) {
          console.warn('Expected PDF but got:', contentType)
        }
        
        const blob = await res.blob()
        if (blob.size === 0) {
          throw new Error('Received empty PDF file')
        }
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `survey_report_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        notify('success', 'PDF report downloaded successfully')
      } else {
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
        const w = window.open()
        w.document.write(data.html_content)
        w.document.close()
      }
    } catch (e) {
      console.error('Report generation error:', e)
      notify('error', `Report failed: ${e.message}`)
    }
  }, [notify, datasetId])

  const downloadData = useCallback(async () => {
    if (!datasetId) {
      notify('error', 'No dataset selected. Please upload a file first.')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/download_data`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ dataset_id: datasetId }), 
        credentials: 'include' 
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `processed_data_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`
      a.click()
      notify('success', 'Processed data downloaded successfully')
    } catch (e) {
      notify('error', `Download failed: ${e.message}`)
    }
  }, [notify, datasetId])

  return (
    <WorkflowLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Navigation Steps */}
          <WorkflowSteps />
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <FiFileText className="text-8xl" />
            </div>
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <FiFileText className="text-4xl" />
                  <h1 className="text-4xl font-bold">Results & Reports</h1>
                </div>
                <p className="text-xl opacity-90 max-w-2xl">
                  View processing results and generate comprehensive reports
                </p>
              </div>
            </div>
          </div>

            {/* Processing Status */}
            {!results && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FiPlay className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Start Processing</h3>
                    <p className="text-gray-600">Begin data processing with your configured settings</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <button 
                    className={`flex items-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 mx-auto ${
                      busy || !summary 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-lg'
                    }`}
                    onClick={startProcessing} 
                    disabled={busy || !summary}
                  >
                    {busy ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiPlay />
                        Start Processing
                      </>
                    )}
                  </button>
                  
                  {!summary && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
                      <FiTarget className="text-lg" />
                      <span>Please upload data first to start processing</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Display */}
            {results && (
              <>
                {/* Processing Results */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiCheckCircle className="text-2xl text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Processing Results</h3>
                      <p className="text-gray-600">Data processing completed successfully</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Processing Summary */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FiActivity className="text-blue-600" />
                        Processing Summary
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Rows Processed:</span>
                          <span className="font-semibold text-gray-900">{results.rows_processed?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Outliers Detected:</span>
                          <span className="font-semibold text-gray-900">{results.outliers_detected}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Missing Values Imputed:</span>
                          <span className="font-semibold text-gray-900">{results.missing_imputed}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600 flex items-center gap-1">
                            <FiClock className="text-sm" />
                            Processing Time:
                          </span>
                          <span className="font-semibold text-gray-900">{results.processing_time}s</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quality Metrics */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FiTarget className="text-purple-600" />
                        Quality Metrics
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex justify-between items-center">
                            <span className="text-green-700">Data Completeness:</span>
                            <span className="font-bold text-green-800">{results.completeness}%</span>
                          </div>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700">Outlier Percentage:</span>
                            <span className="font-bold text-blue-800">{results.outlier_percentage}%</span>
                          </div>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <div className="flex justify-between items-center">
                            <span className="text-purple-700">Data Consistency:</span>
                            <span className="font-bold text-purple-800">{results.consistency}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistical Estimates */}
                {results.estimates && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <FiBarChart className="text-2xl text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Statistical Estimates</h3>
                        <p className="text-gray-600">Key statistical metrics for your dataset</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(results.estimates).map(([column, stats]) => (
                        <div key={column} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-4 text-lg">{column}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-sm text-gray-500 mb-1">Mean</div>
                              <div className="text-lg font-bold text-blue-600">{stats.mean?.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-500 mb-1">Std Dev</div>
                              <div className="text-lg font-bold text-purple-600">{stats.std?.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-500 mb-1">Min</div>
                              <div className="text-lg font-bold text-green-600">{stats.min?.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-500 mb-1">Max</div>
                              <div className="text-lg font-bold text-red-600">{stats.max?.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Steps Navigation */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-8 text-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <FiTrendingUp className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Choose Your Next Step</h3>
                      <p className="opacity-90">Data processing completed successfully! What would you like to do next?</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-200">
                      <div className="text-center">
                        <div className="p-4 bg-white/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <FiBarChart className="text-2xl" />
                        </div>
                        <h4 className="text-lg font-semibold mb-2">Data Analysis</h4>
                        <p className="text-white/80 text-sm mb-4">Explore interactive charts and detailed analytics</p>
                        <button 
                          className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 mx-auto"
                          onClick={() => window.location.href = '/analytics'}
                        >
                          <FiTrendingUp />
                          Go to Analytics
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-200">
                      <div className="text-center">
                        <div className="p-4 bg-white/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <FiFileText className="text-2xl" />
                        </div>
                        <h4 className="text-lg font-semibold mb-2">Generate Reports</h4>
                        <p className="text-white/80 text-sm mb-4">Create comprehensive PDF/HTML reports</p>
                        <button 
                          className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 mx-auto"
                          onClick={() => document.querySelector('.reports-section')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                          <FiFilePlus />
                          Create Reports
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Generation */}
                <div className="reports-section bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiFilePlus className="text-2xl text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Generate Reports</h3>
                      <p className="text-gray-600">Create comprehensive reports with encrypted data samples, AI analysis, and visualizations</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200 hover:shadow-lg transition-all duration-200">
                      <div className="text-center">
                        <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <FiFileText className="text-2xl text-red-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">PDF Report</h4>
                        <p className="text-gray-600 text-sm mb-4">Download a comprehensive PDF report</p>
                        <button 
                          className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
                          onClick={() => generateReport('pdf')}
                        >
                          <FiDownload />
                          Download PDF
                        </button>
                      </div>
                    </div>
                    
                    <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-200">
                      <div className="text-center">
                        <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <FiEye className="text-2xl text-blue-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">HTML Report</h4>
                        <p className="text-gray-600 text-sm mb-4">View interactive HTML report</p>
                        <button 
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
                          onClick={() => generateReport('html')}
                        >
                          <FiEye />
                          View HTML
                        </button>
                      </div>
                    </div>
                    
                    <div className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200">
                      <div className="text-center">
                        <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <FiDownload className="text-2xl text-green-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Processed Data</h4>
                        <p className="text-gray-600 text-sm mb-4">Download cleaned dataset</p>
                        <button 
                          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
                          onClick={downloadData}
                        >
                          <FiDownload />
                          Download CSV
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Dataset Summary */}
            {summary && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <FiDatabase className="text-2xl text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Dataset Summary</h3>
                    <p className="text-gray-600">Overview of your dataset characteristics</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {summary.rows?.toLocaleString()}
                    </div>
                    <div className="text-gray-600 font-medium">Total Records</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {summary.columns}
                    </div>
                    <div className="text-gray-600 font-medium">Variables</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="text-3xl font-bold text-amber-600 mb-2">
                      {summary.missing_values?.length || 0}
                    </div>
                    <div className="text-gray-600 font-medium">Missing Data Columns</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <div className="text-3xl font-bold mb-2">
                      {results ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-amber-600">⏳</span>
                      )}
                    </div>
                    <div className="text-gray-600 font-medium">Processing Status</div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </WorkflowLayout>
  )
}
